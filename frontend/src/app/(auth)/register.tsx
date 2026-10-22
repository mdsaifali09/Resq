
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
import { registerUser } from "../../services/auth";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      Alert.alert("Missing details", "Please fill in all fields.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Weak password",
        "Your password must contain at least 8 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await registerUser(
        cleanName,
        cleanEmail,
        password
      );

      console.log("Registration success:", response);

      Alert.alert(
  "Registration successful 🎉",
  "Your account has been created."
);

router.replace("/(auth)/login");
    } catch (error: unknown) {
      const apiError = error as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            code?: string;
          };
        };
        message?: string;
      };

      const status = apiError.response?.status;
      const data = apiError.response?.data;
      const message = data?.message;

      console.log("Registration status:", status);
      console.log("Registration response:", data);
      console.log("Registration error:", apiError.message);

      if (status === 409 && data?.code === "EMAIL_EXISTS") {
        Alert.alert(
          "Email already registered",
          message || "This email is already registered. Please log in.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Log In",
              onPress: () => router.replace("/(auth)/login"),
            },
          ]
        );
      } else {
        Alert.alert(
          `Registration failed${status ? ` (${status})` : ""}`,
          message ||
            apiError.message ||
            "Something went wrong. Please try again."
        );
      }
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
      <View className="flex-1 px-6 pb-10 pt-20">
        <Text className="text-4xl font-extrabold text-white">
          Join ResQ 🚨
        </Text>

        <Text className="mt-3 text-base text-slate-400">
          Create your account to get started.
        </Text>

        <Text className="mb-2 mt-10 font-semibold text-slate-300">
          Full name
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor="#64748b"
          autoCapitalize="words"
          autoCorrect={false}
          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-white"
        />

        <Text className="mb-2 mt-5 font-semibold text-slate-300">
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
          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-white"
        />

        <Text className="mb-2 mt-5 font-semibold text-slate-300">
          Password
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          placeholderTextColor="#64748b"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-white"
        />

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          className={`mt-8 items-center rounded-2xl py-4 ${
            loading ? "bg-red-900" : "bg-red-600"
          }`}
        >
          {loading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#ffffff" />
              <Text className="font-bold text-white">
                Creating account...
              </Text>
            </View>
          ) : (
            <Text className="font-bold text-white">
              Create Account
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          disabled={loading}
          className="mt-6 items-center py-2"
        >
          <Text className="text-slate-400">
            Already registered?{" "}
            <Text className="font-bold text-red-400">Log in</Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
