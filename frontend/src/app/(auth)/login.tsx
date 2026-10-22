
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { loginUser } from "../../services/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert("Missing details", "Enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser(cleanEmail, password);

      console.log("Login successful:", response);

      router.replace("/(tabs)");
    } catch (error: unknown) {
      const apiError = error as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
        message?: string;
      };

      console.log("Login status:", apiError.response?.status);
      console.log("Login response:", apiError.response?.data);
      console.log("Login error:", apiError.message);

      Alert.alert(
        "Login failed",
        apiError.response?.data?.message ||
          "Could not connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 px-6 pb-10 pt-24">
        <Text className="text-5xl">🛡️</Text>

        <Text className="mt-6 text-4xl font-extrabold text-white">
          Welcome Back
        </Text>

        <Text className="mt-3 text-base text-slate-400">
          Log in to continue with ResQ.
        </Text>

        <Text className="mb-2 mt-10 font-semibold text-slate-300">
          Email
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor="#64748b"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-white"
        />

        <Text className="mb-2 mt-5 font-semibold text-slate-300">
          Password
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor="#64748b"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-white"
        />

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          className={`mt-8 items-center rounded-2xl py-4 ${
            loading ? "bg-red-900" : "bg-red-600"
          }`}
        >
          {loading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#ffffff" />
              <Text className="font-bold text-white">
                Logging in...
              </Text>
            </View>
          ) : (
            <Text className="font-bold text-white">Log In</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push("/(auth)/register")}
          disabled={loading}
          className="mt-6 items-center py-2"
        >
          <Text className="text-slate-400">
            New to ResQ?{" "}
            <Text className="font-bold text-red-400">
              Create account
            </Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
