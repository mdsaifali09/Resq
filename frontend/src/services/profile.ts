
import { API } from "./api";

export type UserProfile = {
  _id: string;
  name: string;
  email: string;
};

type ProfileResponse = {
  user: UserProfile;
  message?: string;
};

export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await API.get<ProfileResponse>("/auth/me");

  if (!response.data?.user) {
    throw new Error("Profile data not found");
  }

  return response.data.user;
};

export const updateMyProfile = async (
  data: Pick<UserProfile, "name" | "email">
): Promise<UserProfile> => {
  const response = await API.put<ProfileResponse>(
    "/auth/profile",
    {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
    }
  );

  if (!response.data?.user) {
    throw new Error("Updated profile data not found");
  }

  return response.data.user;
};
