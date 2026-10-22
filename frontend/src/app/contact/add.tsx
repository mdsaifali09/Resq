
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { addContact } from "../../services/contacts";

export default function AddContactScreen() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [saving, setSaving] = useState(false);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const saveContact = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanRelationship = relationship.trim();

    if (!cleanName || !cleanPhone || !cleanRelationship) {
      showMessage("Missing Information", "Please fill all fields.");
      return;
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      showMessage(
        "Invalid Phone Number",
        "Please enter a valid 10-digit Indian phone number."
      );
      return;
    }

    try {
      setSaving(true);

      await addContact({
        name: cleanName,
        phone: cleanPhone,
        relationship: cleanRelationship,
      });

      showMessage(
        "Contact Added",
        `${cleanName} has been saved successfully.`
      );

      router.back();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Could not save contact. Please log in again or try later.";

      showMessage("Error", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-950"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-5 pb-10 pt-14">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-full bg-slate-900"
            >
              <Text className="text-2xl text-white">‹</Text>
            </Pressable>

            <View className="ml-4 flex-1">
              <Text className="text-2xl font-bold text-white">
                Add Emergency Contact
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                Someone you trust in an emergency
              </Text>
            </View>
          </View>

          <View className="mt-10 items-center">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-red-500/10">
              <Text className="text-5xl">👤</Text>
            </View>
          </View>

          <View className="mt-10">
            <Text className="mb-2 text-sm font-semibold text-slate-300">
              Full Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter contact name"
              placeholderTextColor="#64748b"
              autoCapitalize="words"
              className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-base text-white"
            />

            <Text className="mb-2 mt-6 text-sm font-semibold text-slate-300">
              Phone Number
            </Text>
            <TextInput
              value={phone}
              onChangeText={(value) =>
                setPhone(value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="Enter 10-digit phone number"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              maxLength={10}
              className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-base text-white"
            />

            <Text className="mb-2 mt-6 text-sm font-semibold text-slate-300">
              Relationship
            </Text>
            <TextInput
              value={relationship}
              onChangeText={setRelationship}
              placeholder="Example: Mom, Dad, Brother"
              placeholderTextColor="#64748b"
              autoCapitalize="words"
              className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-base text-white"
            />

            <View className="mt-6 rounded-2xl border border-blue-900/50 bg-blue-950/30 p-4">
              <Text className="text-sm font-semibold text-blue-300">
                🔒 Your safety matters
              </Text>
              <Text className="mt-2 text-xs leading-5 text-slate-400">
                Your contact details will be saved to your ResQ account.
                Saving a contact does not automatically notify them.
              </Text>
            </View>

            <Pressable
              onPress={saveContact}
              disabled={saving}
              className={`mt-8 items-center rounded-2xl py-4 ${
                saving ? "bg-red-900" : "bg-red-600 active:bg-red-700"
              }`}
            >
              <Text className="text-base font-bold text-white">
                {saving ? "Saving..." : "Save Emergency Contact"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              disabled={saving}
              className="mt-3 items-center py-4"
            >
              <Text className="font-semibold text-slate-500">
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
