import Post from "../../models/postmodel.js";
import { FEED_CONFIG } from "./feedConfig.js";
import { categoryQueryValues } from "./categoryTaxonomy.js";

const FIELDS =
  "userid createdAt categories postType likesCount commentsCount sharesCount viewsCount";

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const find = (filter, sort, limit) =>
  Post.find(filter).select(FIELDS).sort(sort).limit(limit).lean();

// পাঁচ উৎস থেকে প্রার্থী post তোলা (এখনো নম্বর দেওয়া হয়নি)
export async function fetchCandidates({
  profile,
  blockedIds,
  excludeIds,
  followingIds,
}) {
  const { windows, limits } = FEED_CONFIG;

  // সব উৎসের জন্য সাধারণ শর্ত
  const base = {
    moderationStatus: { $nin: FEED_CONFIG.hiddenStatuses },
    privacy: "public",
    ...(blockedIds.length > 0 && { userid: { $nin: blockedIds } }),
    ...(excludeIds.length > 0 && { _id: { $nin: excludeIds } }),
  };

  const topValues = profile.top.flatMap((c) => categoryQueryValues(c.category));
  const avoidValues = profile.avoid.flatMap(categoryQueryValues);

  // ১) আগ্রহ-ভিত্তিক: প্রতিটা বিষয়ের জন্য আলাদা, যাতে ভাগ ঠিক রাখা যায়
  const interestJobs = profile.top.map((c, i) =>
    find(
      {
        ...base,
        categories: { $in: categoryQueryValues(c.category) },
        createdAt: { $gte: daysAgo(windows.interestDays) },
      },
      { createdAt: -1 },
      i === 0 ? limits.topCategory : limits.category,
    ).then((posts) => ({ category: c.category, posts })),
  );

  // ২) যাদের follow করা হয়েছে
  const followingJob =
    followingIds.length > 0
      ? find(
          {
            ...base,
            userid: { $in: followingIds }, // আগেই blocked বাদ দেওয়া
            createdAt: { $gte: daysAgo(windows.followingDays) },
          },
          { createdAt: -1 },
          limits.following,
        )
      : Promise.resolve([]);

  // ৩) জনপ্রিয় (যে বিষয় user এড়াতে চায় তা বাদ)
  const trendingJob = find(
    {
      ...base,
      ...(avoidValues.length > 0 && { categories: { $nin: avoidValues } }),
      createdAt: { $gte: daysAgo(windows.trendingDays) },
    },
    { likesCount: -1, commentsCount: -1, createdAt: -1 },
    limits.trending,
  );

  // ৪) নতুন বিষয়: user-এর প্রধান আগ্রহের বাইরের post
  const exploreJob = find(
    {
      ...base,
      categories: { $nin: [...topValues, ...avoidValues] },
      createdAt: { $gte: daysAgo(windows.exploreDays) },
    },
    { createdAt: -1 },
    limits.explore,
  );

  // ৫) সর্বশেষ: সব ফুরিয়ে গেলে ফিড যেন থেমে না যায়
  const latestJob = find(
    {
      ...base,
      ...(avoidValues.length > 0 && { categories: { $nin: avoidValues } }),
      createdAt: { $gte: daysAgo(windows.latestDays) },
    },
    { createdAt: -1 },
    limits.latest,
  );

  const [interest, following, trending, explore, latest] = await Promise.all([
    Promise.all(interestJobs),
    followingJob,
    trendingJob,
    exploreJob,
    latestJob,
  ]);

  return { interest, following, trending, explore, latest };
}
