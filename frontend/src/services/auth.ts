
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API } from "./api";

const TOKEN_KEY = "resq_token";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthResponse = {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
};

// Save token for Web and Mobile
async function saveToken(token: string) {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

// Register user
export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const response = await API.post("/auth/register", {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  });

  return response.data;
}

// Login user
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await API.post<AuthResponse>("/auth/login", {
    email: email.trim().toLowerCase(),
    password,
  });

  const data = response.data;

  if (!data.success || !data.token) {
    throw new Error(data.message || "Login failed");
  }

  await saveToken(data.token);

  return data;
}

// Get saved token
export async function getSavedToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

// Logout user
export async function logoutUser() {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
