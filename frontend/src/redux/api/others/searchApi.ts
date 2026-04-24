import { baseApi } from "../baseApi";
import type { Post } from "@/types/postTypes";

export interface SearchUser {
  _id: string;
  name: string;
  username: string;
  userid: number;
  profileImage?: string;
}

export interface SearchResult {
  success: boolean;
  users: SearchUser[];
  posts: Post[];
}

const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    globalSearch: builder.query<SearchResult, string>({
      query: (q) => ({
        url: `/search/search?q=${encodeURIComponent(q)}`,
        method: "GET",
      }),
    }),
  }),
});

export const { useGlobalSearchQuery } = searchApi;
