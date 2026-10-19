import mongoose from "mongoose";
import PrivateQuestion from "../models/PrivateQuestion.js";
import Answer from "../models/answer/answerModel.js";
import User from "../models/usermodel.js";
import { getBlockedUserIds, getBlockRelation } from "../helpers/blockHelper.js";
import { USER_SELECT, maskUser } from "../helpers/userMask.js";

const MAX_QUESTION_LENGTH = 1000;

// ===================== SEND PRIVATE QUESTION =====================
export const sendPrivateQuestion = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Login required" });
    }

    const { receiverId, questionText } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiverId" });
    }

    if (!questionText?.trim()) {
      return res.status(400).json({ message: "questionText is required" });
    }

    if (questionText.trim().length > MAX_QUESTION_LENGTH) {
      return res.status(400).json({
        message: `Question cannot exceed ${MAX_QUESTION_LENGTH} characters`,
      });
    }

    if (req.user.id.toString() === receiverId.toString()) {
      return res.status(400).json({ message: "You cannot question yourself" });
    }

    const receiver = await User.findOne({
      _id: receiverId,
      accountStatus: { $nin: ["deleted", "banned", "deactivated"] },
    }).select("_id");

    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const relation = await getBlockRelation(req.user.id, receiverId);

    if (relation.blockedMe) {
      return res.status(404).json({ message: "User not found" });
    }

    if (relation.blockedByMe) {
      return res.status(403).json({
        message: "You have blocked this user. Unblock to send a question.",
      });
    }

    const newQuestion = await PrivateQuestion.create({
      senderId: req.user.id,
      receiverId,
      questionText: questionText.trim(),
    });

    res.status(201).json({ success: true, question: newQuestion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== GET INBOX (flat list) =====================
export const getInbox = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Login required" });
    }

    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;
    const status = req.query.status || null;

    const blockedIds = await getBlockedUserIds(req.user.id);

    const query = { receiverId: req.user.id, isDeleted: false };
    if (cursor) query.createdAt = { $lt: cursor };
    if (status) query.status = status;
    if (blockedIds.length > 0) query.senderId = { $nin: blockedIds };

    const questions = await PrivateQuestion.find(query)
      .populate("senderId", USER_SELECT)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = questions.length > limit;
    if (hasMore) questions.pop();

    res.status(200).json({
      success: true,
      questions: questions.map((q) => ({
        ...q,
        senderId: maskUser(q.senderId),
      })),
      nextCursor: hasMore ? questions[questions.length - 1].createdAt : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== GET SENT QUESTIONS (flat list) =====================
export const getSentQuestions = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Login required" });
    }

    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const blockedIds = await getBlockedUserIds(req.user.id);

    const query = { senderId: req.user.id, isDeleted: false };
    if (cursor) query.createdAt = { $lt: cursor };
    if (blockedIds.length > 0) query.receiverId = { $nin: blockedIds };

    const questions = await PrivateQuestion.find(query)
      .populate("receiverId", USER_SELECT)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = questions.length > limit;
    if (hasMore) questions.pop();

    res.status(200).json({
      success: true,
      questions: questions.map((q) => ({
        ...q,
        receiverId: maskUser(q.receiverId),
      })),
      nextCursor: hasMore ? questions[questions.length - 1].createdAt : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== GET PEOPLE (কার কার সাথে প্রশ্ন আছে) =====================
// mode=inbox → যারা আমাকে প্রশ্ন করেছে
// mode=sent  → আমি যাদের প্রশ্ন করেছি
export const getPrivateQuestionPeople = async (req, res) => {
  try {
    const me = req.user?.id;
    if (!me) return res.status(401).json({ message: "Login required" });

    const mode = req.query.mode === "sent" ? "sent" : "inbox";
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const meId = new mongoose.Types.ObjectId(me);
    const blockedIds = await getBlockedUserIds(me);

    const otherField = mode === "inbox" ? "senderId" : "receiverId";
    const myField = mode === "inbox" ? "receiverId" : "senderId";

    const match = { [myField]: meId, isDeleted: false };
    if (blockedIds.length > 0) match[otherField] = { $nin: blockedIds };

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: `$${otherField}`,
          lastAt: { $first: "$createdAt" },
          lastText: { $first: "$questionText" },
          lastStatus: { $first: "$status" },
          totalCount: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
          },
        },
      },
    ];

    if (cursor) pipeline.push({ $match: { lastAt: { $lt: cursor } } });
    pipeline.push({ $sort: { lastAt: -1 } }, { $limit: limit + 1 });

    const groups = await PrivateQuestion.aggregate(pipeline);

    const hasMore = groups.length > limit;
    if (hasMore) groups.pop();

    const users = await User.find({ _id: { $in: groups.map((g) => g._id) } })
      .select(USER_SELECT)
      .lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const people = groups.map((g) => ({
      userId: g._id,
      user: maskUser(userMap.get(g._id.toString())),
      totalCount: g.totalCount,
      // sent এ unread এর মানে নেই (সেটা অপর পক্ষের read)
      unreadCount: mode === "inbox" ? g.unreadCount : 0,
      lastQuestionText: g.lastText,
      lastQuestionAt: g.lastAt,
      lastStatus: g.lastStatus,
    }));

    res.status(200).json({
      success: true,
      people,
      nextCursor: hasMore ? people[people.length - 1].lastQuestionAt : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== GET QUESTIONS WITH ONE USER (infinite) =====================
// mode=inbox → ওই user আমাকে যা প্রশ্ন করেছে
// mode=sent  → আমি ওই user কে যা প্রশ্ন করেছি
export const getQuestionsWithUser = async (req, res) => {
  try {
    const me = req.user?.id;
    if (!me) return res.status(401).json({ message: "Login required" });

    const { userId: otherId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(otherId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const mode = req.query.mode === "sent" ? "sent" : "inbox";
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const otherUser = await User.findById(otherId).select(USER_SELECT).lean();

    // block থাকলে খালি list
    const relation = await getBlockRelation(me, otherId);
    if (relation.any) {
      return res.status(200).json({
        success: true,
        user: maskUser(otherUser),
        questions: [],
        nextCursor: null,
      });
    }

    const query =
      mode === "inbox"
        ? { senderId: otherId, receiverId: me, isDeleted: false }
        : { senderId: me, receiverId: otherId, isDeleted: false };
    if (cursor) query.createdAt = { $lt: cursor };

    const questions = await PrivateQuestion.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = questions.length > limit;
    if (hasMore) questions.pop();

    // প্রতিটা প্রশ্নের active উত্তর (soft deleted বাদ)
    const answers = await Answer.find({
      questionId: { $in: questions.map((q) => q._id) },
      isDeleted: false,
    })
      .select("questionId text createdAt isEdited")
      .lean();
    const answerMap = new Map(answers.map((a) => [a.questionId.toString(), a]));

    res.status(200).json({
      success: true,
      user: maskUser(otherUser),
      questions: questions.map((q) => ({
        ...q,
        answer: answerMap.get(q._id.toString()) ?? null,
      })),
      nextCursor: hasMore ? questions[questions.length - 1].createdAt : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== GET SINGLE QUESTION =====================
export const getPrivateQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid question id" });
    }

    const raw = await PrivateQuestion.findOne({
      _id: id,
      isDeleted: false,
    }).lean();

    if (!raw) {
      return res.status(404).json({ message: "Question not found" });
    }

    const userId = req.user.id.toString();
    const senderId = raw.senderId.toString();
    const receiverId = raw.receiverId.toString();

    const isSender = senderId === userId;
    const isReceiver = receiverId === userId;

    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: "Access denied" });
    }

    const otherId = isSender ? receiverId : senderId;
    const relation = await getBlockRelation(userId, otherId);
    if (relation.any) {
      return res.status(404).json({ message: "Question not found" });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(senderId).select(USER_SELECT).lean(),
      User.findById(receiverId).select(USER_SELECT).lean(),
    ]);

    if (isReceiver && !raw.isRead) {
      await PrivateQuestion.findByIdAndUpdate(id, { isRead: true });
    }

    res.status(200).json({
      success: true,
      question: {
        ...raw,
        isRead: isReceiver ? true : raw.isRead,
        senderId: maskUser(sender),
        receiverId: maskUser(receiver),
        isSender,
        isReceiver,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== EDIT QUESTION (শুধু sender) =====================
export const editPrivateQuestion = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Login required" });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid question id" });
    }

    const text = req.body.questionText?.trim();
    if (!text) {
      return res.status(400).json({ message: "questionText is required" });
    }
    if (text.length > MAX_QUESTION_LENGTH) {
      return res.status(400).json({
        message: `Question cannot exceed ${MAX_QUESTION_LENGTH} characters`,
      });
    }

    const question = await PrivateQuestion.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (question.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the sender can edit this question" });
    }

    const relation = await getBlockRelation(userId, question.receiverId);
    if (relation.any) {
      return res.status(404).json({ message: "Question not found" });
    }

    // কিছু বদলায়নি
    if (question.questionText === text) {
      return res.status(200).json({ success: true, question });
    }

    question.questionText = text;
    question.isEdited = true;
    question.editedAt = new Date();
    await question.save();

    res.status(200).json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== UPDATE STATUS (ignored / pending) =====================
// "answered" শুধু উত্তর দিলে নিজে থেকে হবে, হাতে সেট করা যাবে না
export const updateQuestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid question id" });
    }

    const allowed = ["ignored", "pending"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const question = await PrivateQuestion.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (question.receiverId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "Only receiver can update status" });
    }

    if (question.status === "answered") {
      return res
        .status(409)
        .json({ message: "Answered question status cannot be changed" });
    }

    question.status = status;
    await question.save();

    res.status(200).json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== GET UNREAD COUNT =====================
export const getUnreadCount = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Login required" });
    }

    const blockedIds = await getBlockedUserIds(req.user.id);

    const count = await PrivateQuestion.countDocuments({
      receiverId: req.user.id,
      isRead: false,
      isDeleted: false,
      ...(blockedIds.length > 0 && { senderId: { $nin: blockedIds } }),
    });

    res.status(200).json({ success: true, unreadCount: count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== SOFT DELETE QUESTION (শুধু sender) =====================
export const deletePrivateQuestion = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Login required" });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid question id" });
    }

    const question = await PrivateQuestion.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (question.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the sender can delete this question" });
    }

    const now = new Date();
    question.isDeleted = true;
    question.deletedAt = now;
    question.deletedBy = userId;
    await question.save();

    // প্রশ্ন গেলে তার উত্তরও soft delete (private এ rating নেই, তাই আর কিছু লাগে না)
    await Answer.updateMany(
      { questionId: id, isDeleted: false },
      { isDeleted: true, deletedAt: now, deletedBy: userId },
    );

    res.status(200).json({ success: true, message: "Question deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
