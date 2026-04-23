import axiosInstance from "./axiosInstance";

// 🔹 Get user by username
export const getUserByUsername = async (username: string) => {
  try {
    const res = await axiosInstance.get(`/users/user/${username}`);
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Something went wrong" };
  }
};
