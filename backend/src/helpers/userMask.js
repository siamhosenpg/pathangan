// ডিলিট / ব্যান / ডিঅ্যাকটিভ ইউজারের তথ্য client এ যাবে না
export const HIDDEN_ACCOUNT_STATUSES = ["deleted", "banned", "deactivated"];

export const USER_SELECT = "name username profileImage accountStatus";

// populate করা user object এর জন্য। null হলে frontend "ডিলিট হওয়া ইউজার" দেখাবে
export const maskUser = (user) => {
  if (!user || typeof user !== "object") return null;
  if (HIDDEN_ACCOUNT_STATUSES.includes(user.accountStatus)) return null;
  // eslint-disable-next-line no-unused-vars
  const { accountStatus, ...safe } = user;
  return safe;
};
