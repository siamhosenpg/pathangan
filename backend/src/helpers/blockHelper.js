import mongoose from "mongoose";
import Block from "../models/blockModel.js";
import User from "../models/usermodel.js";

// ডিলিট হওয়া সব ইউজারের ID (permanent delete হয়ে গেলে এই তালিকা ছোটই থাকবে)
export const getDeletedUserIds = async () => {
  const users = await User.find({ accountStatus: "deleted" })
    .select("_id")
    .lean();
  return users.map((u) => u._id.toString());
};

// একজন ইউজার ডিলিট অবস্থায় আছে কি না
export const isUserDeleted = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return false;
  const user = await User.findOne({ _id: userId, accountStatus: "deleted" })
    .select("_id")
    .lean();
  return !!user;
};

// লুকানোর মতো সব user ID:
// ডিলিট হওয়া ইউজার (login না থাকলেও) + আমি যাদের block করেছি + যারা আমাকে block করেছে
export const getBlockedUserIds = async (userId) => {
  const ids = new Set(await getDeletedUserIds());

  if (userId) {
    const blocks = await Block.find({
      $or: [{ blocker: userId }, { blocked: userId }],
    })
      .select("blocker blocked")
      .lean();

    blocks.forEach((b) => {
      ids.add(b.blocker.toString());
      ids.add(b.blocked.toString());
    });
    ids.delete(userId.toString());
  }

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
