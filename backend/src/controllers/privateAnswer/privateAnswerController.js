import mongoose from "mongoose";
import Answer from "../../models/answer/answerModel.js";
import PrivateQuestion from "../../models/PrivateQuestion.js";
import { getBlockRelation } from "../../helpers/blockHelper.js";
import { USER_SELECT, maskUser } from "../../helpers/userMask.js";
import { checkBadText } from "../../helpers/moderation/badTextFilter.js";
import { flagEntry } from "../../helpers/moderation/postModeration.js";
import {
  applyEditModeration,
  moderateAnswerInBackground,
  withAnswerNotice,
} from "../../helpers/moderation/answerModeration.js";

// Answer schema এর minlength 5 এর সাথে মিল রাখা হলো
const MIN_ANSWER = 5;
const MAX_ANSWER = 2000;

const validateText = (text) => {
  const t = text?.trim();
  if (!t) return "Answer text is required";
  if (t.length < MIN_ANSWER)
    return `Answer must be at least ${MIN_ANSWER} characters`;
  if (t.length > MAX_ANSWER)
    return `Answer cannot exceed ${MAX_ANSWER} characters`;
  return null;
};

// answer এর populate করা user mask করে পাঠানো
// isOwner true হলে moderationNotice বসে, moderationHistory সবসময় সরে যায়
const shapeAnswer = (answerDoc, isOwner = true) => {
  const obj = withAnswerNotice(answerDoc, isOwner);
  return { ...obj, userId: maskUser(obj.userId) };
};

// ===================== CREATE PRIVATE ANSWER =====================
export const createPrivateAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const privateQuestion = await PrivateQuestion.findOne({
      _id: questionId,
      isDeleted: false,
    });

    if (!privateQuestion) {
      return res.status(404).json({ message: "Private question not found" });
    }

    if (privateQuestion.receiverId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the receiver can answer this question" });
    }

    const relation = await getBlockRelation(userId, privateQuestion.senderId);
    if (relation.any) {
      return res
        .status(403)
        .json({ message: "You cannot answer this question" });
    }

    if (privateQuestion.status === "answered") {
      return res
        .status(409)
        .json({ message: "This question has already been answered" });
    }

    if (privateQuestion.status === "ignored") {
      return res
        .status(403)
        .json({ message: "This question has been ignored" });
    }

    const { text } = req.body;
    const textError = validateText(text);
    if (textError) return res.status(400).json({ message: textError });

    const trimmed = text.trim();

    // soft delete হওয়া উত্তর ধরা হবে না
    const existing = await Answer.findOne({
      questionId,
      userId,
      isDeleted: false,
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "You have already answered this question" });
    }

    // ── ধাপ ১: Local filter (API call ছাড়া, তাৎক্ষণিক) ──
    const local = checkBadText(trimmed);

    const answerData = { questionId, userId, text: trimmed };

    // Local filter কিছু পেলে সরাসরি auto_hidden, Gemini call হবে না
    if (local.flagged) {
      answerData.moderationStatus = "auto_hidden";
      answerData.moderationHistory = [
        flagEntry("local_filter", local.flagType),
      ];
    }

    const answer = await Answer.create(answerData);

    await answer.populate("userId", `${USER_SELECT} badges`);

    privateQuestion.status = "answered";
    await privateQuestion.save();

    // ── ধাপ ২: save-এর পরে background-এ Gemini দিয়ে যাচাই ──
    if (!local.flagged) {
      moderateAnswerInBackground(answer._id, trimmed);
    }

    return res.status(201).json({
      success: true,
      message: "Answer posted successfully",
      answer: shapeAnswer(answer, true),
      moderation: {
        flagged: local.flagged,
        flagType: local.flagType,
        message: local.message,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "You have already answered this question" });
    }
    console.error("createPrivateAnswer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== GET ANSWER BY QUESTION ID (শুধু participant) =====================
export const getPrivateAnswerByQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const privateQuestion = await PrivateQuestion.findOne({
      _id: questionId,
      isDeleted: false,
    }).select("senderId receiverId");

    if (!privateQuestion) {
      return res.status(200).json({ success: true, answer: null });
    }

    const isParticipant =
      privateQuestion.senderId.toString() === userId.toString() ||
      privateQuestion.receiverId.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const answer = await Answer.findOne({
      questionId,
      isDeleted: false,
    })
      .populate("userId", `${USER_SELECT} badges`)
      .lean();

    if (!answer) {
      return res.status(200).json({ success: true, answer: null });
    }

    // mask করার আগে বের করতে হবে, নাহলে _id হারিয়ে যেতে পারে
    const isAuthor = answer.userId?._id?.toString() === userId.toString();

    // hidden উত্তর শুধু যে দিয়েছে সে দেখবে, প্রশ্নকারী পাবে answerHidden
    if (answer.moderationStatus === "auto_hidden" && !isAuthor) {
      return res
        .status(200)
        .json({ success: true, answer: null, answerHidden: true });
    }

    return res.status(200).json({
      success: true,
      answer: shapeAnswer(answer, isAuthor),
    });
  } catch (err) {
    console.error("getPrivateAnswerByQuestion error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== EDIT PRIVATE ANSWER (শুধু যে উত্তর দিয়েছে) =====================
export const editPrivateAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID" });
    }

    const { text } = req.body;
    const textError = validateText(text);
    if (textError) return res.status(400).json({ message: textError });

    const trimmed = text.trim();

    const answer = await Answer.findOne({ _id: answerId, isDeleted: false });
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    if (answer.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own answer" });
    }

    // এই route শুধু private question এর উত্তরের জন্য
    const privateQuestion = await PrivateQuestion.findOne({
      _id: answer.questionId,
      isDeleted: false,
    }).select("senderId");
    if (!privateQuestion) {
      return res.status(404).json({ message: "Private question not found" });
    }

    const relation = await getBlockRelation(userId, privateQuestion.senderId);
    if (relation.any) {
      return res.status(403).json({ message: "You cannot edit this answer" });
    }

    if (answer.text === trimmed) {
      await answer.populate("userId", `${USER_SELECT} badges`);
      return res
        .status(200)
        .json({ success: true, answer: shapeAnswer(answer, true) });
    }

    // ── Moderation: text বদলেছে, তাই চেক ──
    const { moderation, runBackground } = await applyEditModeration(
      answer,
      trimmed,
    );

    answer.text = trimmed;
    answer.isEdited = true;
    answer.editedAt = new Date();
    await answer.save();
    await answer.populate("userId", `${USER_SELECT} badges`);

    // save-এর পরে background-এ যাচাই
    if (runBackground) {
      moderateAnswerInBackground(answer._id, trimmed);
    }

    return res.status(200).json({
      success: true,
      message: "Answer updated",
      answer: shapeAnswer(answer, true),
      moderation,
    });
  } catch (err) {
    console.error("editPrivateAnswer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===================== SOFT DELETE PRIVATE ANSWER (শুধু যে উত্তর দিয়েছে) =====================
export const deletePrivateAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Login required" });

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID" });
    }

    const answer = await Answer.findOne({ _id: answerId, isDeleted: false });
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    if (answer.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own answer" });
    }

    const privateQuestion = await PrivateQuestion.findOne({
      _id: answer.questionId,
      isDeleted: false,
    });
    if (!privateQuestion) {
      return res.status(404).json({ message: "Private question not found" });
    }

    answer.isDeleted = true;
    answer.deletedAt = new Date();
    answer.deletedBy = userId;
    await answer.save();

    // প্রশ্নটা আবার উত্তর দেওয়ার মতো অবস্থায় ফিরবে
    privateQuestion.status = "pending";
    await privateQuestion.save();

    return res.status(200).json({
      success: true,
      message: "Answer deleted",
    });
  } catch (err) {
    console.error("deletePrivateAnswer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
