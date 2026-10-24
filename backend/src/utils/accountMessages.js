export const SUPPORT_EMAIL = "help@pathangan.com";

// login ও Google login দুই জায়গাতেই একই বার্তা ব্যবহার হবে
export const getAccountBlockMessage = (user) => {
  const status = user.accountStatus;

  const messages = {
    suspended: `Account suspended until ${
      user.suspension?.expiresAt
        ? new Date(user.suspension.expiresAt).toLocaleDateString()
        : "further notice"
    }. Reason: ${user.suspension?.reason ?? "policy violation"}`,
    banned: "Account permanently banned. Contact support.",
    deactivated: "Account deactivated. Please reactivate to continue.",
    deleted: `আপনার অ্যাকাউন্টটি ডিলিট করা হয়েছে। অ্যাকাউন্ট খোলার সময় যে ইমেইল ব্যবহার করেছিলেন, সেই ইমেইল থেকে আপনার নাম, username ও জন্ম তারিখ দিয়ে ${SUPPORT_EMAIL} এ মেইল করুন। কয়েকদিনের মধ্যে মেইল করলে আমরা অ্যাকাউন্টটি ফিরিয়ে দিতে চেষ্টা করব। এর পরে অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলা হবে।`,
    under_review: "Account is under review. Contact support.",
  };

  return messages[status] ?? `Account is ${status}. Contact support.`;
};
