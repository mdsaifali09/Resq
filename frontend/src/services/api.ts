
import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "resq_token";

export const API = axios.create({
  baseURL:  "https://resq-iusn.onrender.com/api",
  timeout: 10000,
});

API.interceptors.request.use(async (config) => {
  let token: string | null = null;

  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      token = localStorage.getItem(TOKEN_KEY);
    }
  } else {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
  }

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});
