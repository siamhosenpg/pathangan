import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      // FormData হলে Content-Type set করবে না
      // Browser নিজেই boundary সহ set করবে
      return headers;
    },
  }),
  tagTypes: ["Post", "User", "Reaction", "Collection", "SavedItem"], // cache invalidation এর জন্য
  endpoints: () => ({}),
});
