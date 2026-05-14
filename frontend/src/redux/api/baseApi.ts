import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "baseApi",
  // ✅ এভাবে করো — token থাকলে header এ পাঠাও, না থাকলে cookie
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    "Post",
    "User",
    "Reaction",
    "Collection",
    "SavedItem",
    "Comment",
    "Answer",
    "Follow",
    "Rating",
    "Notification",
  ], // cache invalidation এর জন্য
  endpoints: () => ({}),
});
