import { SuggestedUser } from "@/types/usertypes";
import { baseApi } from "../baseApi";

export interface PeopleSuggestionsResponse {
  count: number;
  users: SuggestedUser[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PeopleSuggestionsArg {
  cursor?: string | null;
  limit?: number;
}

const peopleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPeopleSuggestions: builder.query<
      PeopleSuggestionsResponse,
      PeopleSuggestionsArg | void
    >({
      query: (arg) => {
        const params = new URLSearchParams();
        if (arg?.cursor) params.set("cursor", arg.cursor);
        params.set("limit", String(arg?.limit ?? 10));

        return {
          url: `/peoples/suggestions?${params.toString()}`,
          method: "GET",
        };
      },

      // সব পেজ একই cache entry তে merge হবে (cursor বাদ দিয়ে key বানানো হচ্ছে)
      serializeQueryArgs: ({ endpointName }) => endpointName,

      // নতুন ব্যাচ এলে আগের users এর সাথে জুড়ে দেওয়া
      merge: (currentCache, newItems) => {
        if (!newItems?.users) return currentCache;

        const existingIds = new Set(currentCache.users.map((u) => u._id));
        const uniqueNewUsers = newItems.users.filter(
          (u) => !existingIds.has(u._id),
        );

        currentCache.users.push(...uniqueNewUsers);
        currentCache.nextCursor = newItems.nextCursor;
        currentCache.hasMore = newItems.hasMore;
        currentCache.count = currentCache.users.length;
      },

      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor,

      providesTags: ["User"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPeopleSuggestionsQuery,
  useLazyGetPeopleSuggestionsQuery,
} = peopleApi;
