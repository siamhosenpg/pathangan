import mongoose from "mongoose";
import Answer from "../models/answer/answerModel.js";
import { getDeletedUserIds } from "./blockHelper.js";
// ⚠️ পাথটা আপনার maskUser ফাইলের আসল জায়গা অনুযায়ী বদলান
import { maskUser } from "./userMask.js";

const PREVIEW_ANSWERS_LIMIT = 2;

// blockedIds: viewer-এর সাথে block সম্পর্কিত user-দের ObjectId array
// (ডিলিট ইউজারের ID থাকলেও এখানে বাদ দেওয়া হয়, কারণ তাদের answer থাকবে)
export const attachAnswerPreviews = async (posts, blockedIds = []) => {
  if (posts.length === 0) return posts;

  const questionPosts = posts.filter((p) => p.postType === "question");
  if (questionPosts.length === 0) return posts;

  const questionIds = questionPosts.map((q) => q._id);

  // ডিলিট ইউজারকে block তালিকা থেকে সরিয়ে শুধু আসল block রাখি
  const deletedSet = new Set(await getDeletedUserIds());
  const realBlockedIds = blockedIds.filter(
    (id) => !deletedSet.has(id.toString()),
  );

  const answerGroups = await Answer.aggregate([
    {
      $match: {
        questionId: { $in: questionIds },
        isDeleted: false,
        // aggregate-এ auto cast হয় না, তাই blockedIds অবশ্যই ObjectId হতে হবে
        ...(realBlockedIds.length > 0 && { userId: { $nin: realBlockedIds } }),
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
      .select("name username profileImage badges accountStatus")
      .lean();

    answerUsersMap = new Map(answerUsers.map((u) => [u._id.toString(), u]));
  }

  return posts.map((post) => {
    if (post.postType !== "question") return post;

    const group = answersByQuestionId.get(post._id.toString());

    const previewAnswers = group
      ? group.answers.map((a) => {
          const author = answerUsersMap.get(a.userId?.toString());
          return {
            ...a,
            // ডিলিট হলে বা একেবারে মুছে গেলে null → "ডিলিট হওয়া ইউজার"
            userId: author ? maskUser(author) : null,
          };
        })
      : [];

    return {
      ...post,
      previewAnswers,
      answersCount: group ? group.totalCount : 0,
    };
  });
};
