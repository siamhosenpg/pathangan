import { baseApi } from "@/redux/api/baseApi";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CourseMedia {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  duration?: string;
}

export interface CourseContent {
  title: string;
  description: string;
  media: CourseMedia[];
  price: number;
  tags: string[];
}

export interface CourseAuthor {
  _id: string;
  name: string;
  username: string;
  greenmarkVerified?: boolean;
  profileImage?: string;
  gender?: string;
  bio?: string;
}

export interface Course {
  _id: string;
  userid: CourseAuthor;
  postType: "course";
  course: CourseContent;
  privacy: "public" | "friends" | "private";
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isReacted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Response Types ───────────────────────────────────────────────────────────

interface CoursesResponse {
  courses: Course[];
  nextCursor: string | null;
  count?: number;
}

// ─── Arg Types ────────────────────────────────────────────────────────────────

interface GetCoursesParams {
  limit?: number;
}

interface GetCoursesByUserParams {
  userid: string;
  limit?: number;
}

interface CreateCourseArg {
  formData: FormData;
}

interface UpdateCourseArg {
  id: string;
  body: {
    course?: Partial<CourseContent>;
    privacy?: "public" | "friends" | "private";
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const courseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── GET ALL COURSES ──────────────────────────────────────────────────────
    getAllCourses: builder.infiniteQuery<
      CoursesResponse,
      GetCoursesParams,
      string | null
    >({
      query: ({ queryArg, pageParam }) => ({
        url: "/courses",
        params: {
          limit: queryArg.limit ?? 10,
          ...(pageParam && { cursor: pageParam }),
        },
      }),
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
      providesTags: ["Post"],
    }),

    // ── GET COURSES BY USER ID ──────────────────────────────────────────────
    getCoursesByUserId: builder.infiniteQuery<
      CoursesResponse,
      GetCoursesByUserParams,
      string | null
    >({
      query: ({ queryArg, pageParam }) => ({
        url: `/courses/user/${queryArg.userid}`,
        params: {
          limit: queryArg.limit ?? 10,
          ...(pageParam && { cursor: pageParam }),
        },
      }),
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
      providesTags: (_result, _err, arg) => [
        {
          type: "Post",
          id: `USER_COURSES_${arg.userid}`,
        },
      ],
    }),

    // ── GET SINGLE COURSE ────────────────────────────────────────────────────
    getCourseById: builder.query<Course & { isReacted: boolean }, string>({
      query: (id) => `/courses/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Post", id }],
    }),

    // ── CREATE COURSE ────────────────────────────────────────────────────────
    createCourse: builder.mutation<
      { success: boolean; post: Course },
      CreateCourseArg
    >({
      query: ({ formData }) => ({
        url: "/courses",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Post"],
    }),

    // ── UPDATE COURSE ────────────────────────────────────────────────────────
    updateCourse: builder.mutation<
      { success: boolean; post: Course },
      UpdateCourseArg
    >({
      query: ({ id, body }) => ({
        url: `/courses/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: "Post", id }],
    }),

    // ── DELETE COURSE ────────────────────────────────────────────────────────
    deleteCourse: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/courses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Post", id },
        { type: "Post", id: "COURSE_LIST" },
      ],
    }),
  }),
});

export const {
  useGetAllCoursesInfiniteQuery,
  useGetCoursesByUserIdInfiniteQuery,
  useGetCourseByIdQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
} = courseApi;
