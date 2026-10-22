
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import {
  getMyProfile,
  updateMyProfile,
} from "../../services/profile";

export default function EditProfileScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.alert(`${title}\n${message}`);
      }
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const user = await getMyProfile();

        if (active) {
          setName(user.name ?? "");
          setEmail(user.email ?? "");
        }
      } catch (error) {
        if (active) {
          setErrorMessage("Profile load nahi ho payi. Dobara try karo.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setErrorMessage("");

    if (!name.trim() || !email.trim()) {
      showMessage("Validation", "Name aur email dono bharo.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      showMessage("Validation", "Valid email address enter karo.");
      return;
    }

    try {
      setSaving(true);

      await updateMyProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });

      if (Platform.OS === "web") {
        showMessage("Success", "Profile update ho gayi!");
        router.back();
      } else {
        Alert.alert("Success", "Profile update ho gayi!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Profile update nahi ho payi. Dobara try karo.";

      showMessage("Error", message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text className="mt-3 text-white">
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      keyboardShouldPersistTaps="handled"
    >
      <View className="px-5 pt-16 pb-10">
        <Pressable
          onPress={() => router.back()}
          className="mb-6"
        >
          <Text className="text-base text-sky-400">
            ← Back
          </Text>
        </Pressable>

        <Text className="text-3xl font-bold text-white">
          Edit Profile
        </Text>

        <Text className="mt-2 mb-8 text-slate-400">
          Apni personal details update karo.
        </Text>

        {errorMessage ? (
          <View className="mb-5 rounded-xl bg-red-950 p-4">
            <Text className="mb-3 text-red-300">
              {errorMessage}
            </Text>

            <Pressable
              onPress={() => {
                setLoading(true);
                setErrorMessage("");

                getMyProfile()
                  .then((user) => {
                    setName(user.name ?? "");
                    setEmail(user.email ?? "");
                  })
                  .catch(() => {
                    setErrorMessage(
                      "Profile load nahi ho payi. Login aur backend check karo."
                    );
                  })
                  .finally(() => setLoading(false));
              }}
            >
              <Text className="font-bold text-white">
                Retry
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Text className="mb-2 text-slate-300">
          Full Name
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor="#94a3b8"
          autoCapitalize="words"
          className="mb-5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-4 text-white"
        />

        <Text className="mb-2 text-slate-300">
          Email Address
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          className="mb-8 rounded-xl border border-slate-700 bg-slate-900 px-4 py-4 text-white"
        />

        <Pressable
          onPress={handleSave}
          disabled={saving || loading}
          className={`items-center rounded-xl py-4 ${
            saving || loading
              ? "bg-sky-800"
              : "bg-sky-500"
          }`}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="font-bold text-white">
              Save Changes
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
