
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  getContacts,
  updateContact,
  type EmergencyContact,
} from "../../services/contacts";

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [contact, setContact] = useState<EmergencyContact | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    let active = true;

    const loadContact = async () => {
      if (!id || typeof id !== "string") {
        setLoading(false);
        showMessage("Error", "Invalid contact ID.");
        router.back();
        return;
      }

      try {
        const contacts = await getContacts();
        const found = contacts.find((item) => item._id === id);

        if (!found) {
          showMessage("Not Found", "This emergency contact could not be found.");
          router.back();
          return;
        }

        if (active) {
          setContact(found);
          setName(found.name);
          setPhone(found.phone);
          setRelationship(found.relationship);
        }
      } catch (error: any) {
        showMessage(
          "Error",
          error?.response?.data?.message ||
            "Could not load contact details. Please try again."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadContact();

    return () => {
      active = false;
    };
  }, [id]);

  const saveChanges = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanRelationship = relationship.trim();

    if (!cleanName || !cleanPhone || !cleanRelationship) {
      showMessage("Missing Information", "Please fill in all fields.");
      return;
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      showMessage(
        "Invalid Phone Number",
        "Please enter a valid 10-digit Indian phone number."
      );
      return;
    }

    if (!contact) {
      showMessage("Error", "Contact details are not available.");
      return;
    }

    try {
      setSaving(true);

      await updateContact(contact._id, {
        name: cleanName,
        phone: cleanPhone,
        relationship: cleanRelationship,
      });

      if (Platform.OS === "web") {
        window.alert("Contact Updated\n\nYour changes have been saved.");
        router.back();
      } else {
        Alert.alert(
          "Contact Updated",
          "Your changes have been saved successfully.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      showMessage(
        "Update Failed",
        error?.response?.data?.message ||
          "Could not update contact. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color="#ef4444" />
        <Text className="mt-4 text-slate-400">Loading contact details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-950"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-5 pb-10 pt-14">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-full bg-slate-900"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text className="text-2xl text-white">‹</Text>
            </Pressable>

            <View className="ml-4 flex-1">
              <Text className="text-2xl font-bold text-white">
                Edit Contact
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                Update your trusted person's details
              </Text>
            </View>
          </View>

          <View className="mt-10 items-center">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-violet-500/10">
              <Text className="text-5xl">👤</Text>
            </View>
            <Text className="mt-4 text-lg font-bold text-white">
              {contact?.name}
            </Text>
            <Text className="mt-1 text-sm text-slate-500">
              Emergency contact
            </Text>
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
              editable={!saving}
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
              editable={!saving}
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
              editable={!saving}
              className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-base text-white"
            />

            <View className="mt-6 rounded-2xl border border-violet-900/50 bg-violet-950/20 p-4">
              <Text className="text-sm font-semibold text-violet-300">
                🔒 Keep details up to date
              </Text>
              <Text className="mt-2 text-xs leading-5 text-slate-400">
                Check the phone number carefully so your trusted contact's
                details are correct when you need them.
              </Text>
            </View>

            <Pressable
              onPress={() => void saveChanges()}
              disabled={saving || !contact}
              className={`mt-8 items-center rounded-2xl py-4 ${
                saving || !contact ? "bg-violet-900" : "bg-violet-600"
              }`}
            >
              <Text className="text-base font-bold text-white">
                {saving ? "Saving Changes..." : "Save Changes"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              disabled={saving}
              className="mt-3 items-center py-4"
            >
              <Text className="font-semibold text-slate-500">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
