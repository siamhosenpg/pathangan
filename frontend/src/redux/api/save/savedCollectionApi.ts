import { baseApi } from "../baseApi";

export interface Collection {
  _id: string;
  name: string;
  default: boolean;
  userId: string;
  createdAt: string;
}

const savedCollectionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCollections: builder.query<Collection[], void>({
      query: () => ({ url: "/saves/collections", method: "GET" }),
      providesTags: ["Collection"],
    }),

    getDefaultCollection: builder.query<Collection, void>({
      query: () => ({ url: "/saves/collections/saved/default", method: "GET" }),
      providesTags: ["Collection"],
    }),

    getSingleCollection: builder.query<Collection, string>({
      query: (id) => ({ url: `/collections/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: "Collection", id }],
    }),

    createCollection: builder.mutation<Collection, { name: string }>({
      query: (body) => ({ url: "/saves/collections", method: "POST", body }),
      invalidatesTags: ["Collection"],
    }),

    updateCollection: builder.mutation<
      Collection,
      { id: string; name: string }
    >({
      query: ({ id, name }) => ({
        url: `/saves/collections/${id}`,
        method: "PUT",
        body: { name },
      }),
      invalidatesTags: ["Collection"],
    }),

    deleteCollection: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/collections/${id}`, method: "DELETE" }),
      invalidatesTags: ["Collection"],
    }),
  }),
});

export const {
  useGetCollectionsQuery,
  useGetDefaultCollectionQuery,
  useGetSingleCollectionQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
} = savedCollectionApi;
