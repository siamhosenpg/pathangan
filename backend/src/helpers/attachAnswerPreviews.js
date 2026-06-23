import mongoose from "mongoose";
import Answer from "../models/answer/answerModel.js";

const PREVIEW_ANSWERS_LIMIT = 2;

export const attachAnswerPreviews = async (posts) => {
  if (posts.length === 0) return posts;

  // শুধুমাত্র question type post-গুলোর id নেওয়া
  const questionPosts = posts.filter((p) => p.postType === "question");
  if (questionPosts.length === 0) return posts;

  const questionIds = questionPosts.map((q) => q._id);

  const answerGroups = await Answer.aggregate([
    {
      $match: {
        questionId: { $in: questionIds },
        isDeleted: false,
      },
    },
    { $sort: { isBestAnswer: -1, createdAt: -1 } },
    {
      $group: {
        _id: "$questionId",
        answers: { $push: "$$ROOT" },
        totalCount: { $sum: 1 },
      },
    },
    {
      $project: {
        answers: { $slice: ["$answers", PREVIEW_ANSWERS_LIMIT] },
        totalCount: 1,
      },
    },
  ]);

  const answersByQuestionId = new Map(
    answerGroups.map((group) => [group._id.toString(), group]),
  );

  // answer-এর userId গুলো batch populate
  const allAnswerUserIds = new Set();
  answerGroups.forEach((group) => {
    group.answers.forEach((a) => {
      if (a.userId) allAnswerUserIds.add(a.userId.toString());
    });
  });

  let answerUsersMap = new Map();
  if (allAnswerUserIds.size > 0) {
    const User = mongoose.model("User");
    const answerUsers = await User.find({
      _id: { $in: Array.from(allAnswerUserIds) },
    })
      .select("name username profileImage badges")
      .lean();

    answerUsersMap = new Map(answerUsers.map((u) => [u._id.toString(), u]));
  }

  // প্রতিটা post-এ তার previewAnswers বসানো, question না হলে হাত দেওয়া হবে না
  return posts.map((post) => {
    if (post.postType !== "question") return post;

    const group = answersByQuestionId.get(post._id.toString());

    const previewAnswers = group
      ? group.answers.map((a) => ({
          ...a,
          userId: answerUsersMap.get(a.userId?.toString()) || a.userId,
        }))
      : [];

    return {
      ...post,
      previewAnswers,
      answersCount: group ? group.totalCount : 0,
    };
  });
};
