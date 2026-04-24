import { baseApi } from "../baseApi";

export interface SavedItem {
  _id: string;
  postId: any;
  collectionId: string;
  userId: string;
  createdAt: string;
}

type CheckIfSavedResult = { saved: boolean };

const savedItemApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    checkIfSaved: builder.query<CheckIfSavedResult, string>({
      query: (postId) => ({
        url: `/items/check/${postId}`,
        method: "GET",
      }),
      providesTags: (result, error, postId) => [
        { type: "SavedItem", id: postId },
      ],
    }),

    getSavedItems: builder.query<SavedItem[], string>({
      query: (collectionId) => ({
        url: `/items/item/${collectionId}`,
        method: "GET",
      }),
      providesTags: (result, error, collectionId) => [
        { type: "SavedItem", id: collectionId },
      ],
    }),

    savePost: builder.mutation<
      SavedItem,
      { collectionId: string; postId: string }
    >({
      query: ({ collectionId, postId }) => ({
        url: `/items/item/${collectionId}`,
        method: "POST",
        body: { postId },
      }),
      async onQueryStarted({ postId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          savedItemApi.util.updateQueryData("checkIfSaved", postId, (draft) => {
            draft.saved = true;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (result, error, { postId }) => [
        "Collection",
        { type: "SavedItem", id: postId },
      ],
    }),

    deleteSavedItem: builder.mutation<{ message: string }, string>({
      query: (postId) => ({
        url: `/items/item/delete/${postId}`,
        method: "DELETE",
      }),
      async onQueryStarted(postId, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          savedItemApi.util.updateQueryData("checkIfSaved", postId, (draft) => {
            draft.saved = false;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (result, error, postId) => [
        "Collection",
        { type: "SavedItem", id: postId },
      ],
    }),
  }),
});

export const {
  useCheckIfSavedQuery,
  useGetSavedItemsQuery,
  useSavePostMutation,
  useDeleteSavedItemMutation,
} = savedItemApi;
