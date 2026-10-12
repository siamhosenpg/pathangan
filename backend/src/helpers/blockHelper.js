import mongoose from "mongoose";
import Block from "../models/blockModel.js";

// আমি যাদের block করেছি + যারা আমাকে block করেছে, দুই দিকের সব ID
export const getBlockedUserIds = async (userId) => {
  if (!userId) return [];

  const blocks = await Block.find({
    $or: [{ blocker: userId }, { blocked: userId }],
  })
    .select("blocker blocked")
    .lean();

  const ids = new Set();
  blocks.forEach((b) => {
    ids.add(b.blocker.toString());
    ids.add(b.blocked.toString());
  });
  ids.delete(userId.toString());

  return Array.from(ids).map((id) => new mongoose.Types.ObjectId(id));
};

// দুইজনের মধ্যে block সম্পর্ক কোন দিকে
export const getBlockRelation = async (me, other) => {
  if (!me || !other) {
    return { blockedByMe: false, blockedMe: false, any: false };
  }

  const blocks = await Block.find({
    $or: [
      { blocker: me, blocked: other },
      { blocker: other, blocked: me },
    ],
  })
    .select("blocker")
    .lean();

  const blockedByMe = blocks.some(
    (b) => b.blocker.toString() === me.toString(),
  );
  const blockedMe = blocks.some(
    (b) => b.blocker.toString() === other.toString(),
  );

  return { blockedByMe, blockedMe, any: blocks.length > 0 };
};
