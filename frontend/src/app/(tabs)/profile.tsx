
import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  getMyProfile,
  type UserProfile,
} from "../../services/profile";

const GREEN = "#34D399";
const CARD = "#111C2D";
const MUTED = "#94A3B8";

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !right}
      className="flex-row items-center px-4 py-4 active:bg-slate-800/50"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-800">
        <Text className="text-xl">{icon}</Text>
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-white">
          {title}
        </Text>

        {subtitle ? (
          <Text className="mt-1 text-xs leading-5 text-slate-400">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ?? (
        <Text className="text-2xl text-slate-500">›</Text>
      )}
    </Pressable>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View className="mb-3">
      <Text className="text-lg font-bold text-white">
        {title}
      </Text>
      <Text className="mt-1 text-xs text-slate-500">
        {subtitle}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  // These preferences are currently UI-only.
  const [notifications, setNotifications] = useState(true);
  const [locationReminders, setLocationReminders] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setProfileError(false);

    try {
      const user = await getMyProfile();
      setProfile(user);
    } catch (error) {
      console.error("Profile loading failed:", error);
      setProfileError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchProfile = async () => {
        setLoading(true);
        setProfileError(false);

        try {
          const user = await getMyProfile();

          if (active) {
            setProfile(user);
          }
        } catch (error) {
          console.error("Profile loading failed:", error);

          if (active) {
            setProfileError(true);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

      fetchProfile();

      return () => {
        active = false;
      };
    }, [])
  );

  const confirmLogout = () => {
    const logoutAction = () => {
      // Connect your existing auth logout service here
      // so the saved token is cleared before navigation.
      router.replace("/login" as any);
    };

    if (Platform.OS === "web") {
      const confirmed = globalThis.confirm(
        "Are you sure you want to log out?"
      );

      if (confirmed) logoutAction();
      return;
    }

    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log out",
          style: "destructive",
          onPress: logoutAction,
        },
      ]
    );
  };

  const displayName = profile?.name?.trim() || "ResQ User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pb-6 pt-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold tracking-[3px] text-emerald-400">
                RESQ SAFETY
              </Text>

              <Text className="mt-3 text-3xl font-extrabold text-white">
                My Profile
              </Text>

              <Text className="mt-2 text-sm text-slate-400">
                Your account, your safety.
              </Text>
            </View>

            <View className="h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
              <Text className="text-2xl">🛡️</Text>
            </View>
          </View>
        </View>

        {/* Profile Card */}
        <View className="mx-5 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
          <View className="h-1 bg-emerald-400" />

          <View className="p-5">
            <View className="flex-row items-center">
              <View className="h-[68px] w-[68px] items-center justify-center rounded-full border-2 border-emerald-400 bg-slate-800">
                {loading ? (
                  <ActivityIndicator color={GREEN} />
                ) : (
                  <Text className="text-3xl font-extrabold text-emerald-300">
                    {initial}
                  </Text>
                )}
              </View>

              <View className="ml-4 flex-1">
                <Text
                  numberOfLines={1}
                  className="text-xl font-extrabold text-white"
                >
                  {loading ? "Loading profile..." : displayName}
                </Text>

                <Text
                  numberOfLines={1}
                  className="mt-1 text-sm text-slate-400"
                >
                  {profile?.email || "Your account"}
                </Text>

                <View className="mt-2 self-start flex-row items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1">
                  <View className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <Text className="text-xs font-semibold text-emerald-300">
                    ResQ Member
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => router.push("/profile/edit" as any)}
                className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5"
              >
                <Text className="font-bold text-emerald-300">
                  Edit
                </Text>
              </Pressable>
            </View>

            {profileError ? (
              <View className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <Text className="font-semibold text-red-300">
                  Unable to load your profile
                </Text>

                <Text className="mt-1 text-xs leading-5 text-slate-400">
                  Check your login session and internet connection.
                </Text>

                <Pressable
                  onPress={loadProfile}
                  className="mt-3 self-start rounded-xl bg-red-500/20 px-4 py-2"
                >
                  <Text className="font-bold text-red-300">
                    Try Again
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View className="my-5 h-px bg-slate-800" />

            <View className="flex-row items-start">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                <Text className="text-lg">📧</Text>
              </View>

              <View className="flex-1 pt-1">
                <Text className="text-xs font-medium text-slate-400">
                  EMAIL ADDRESS
                </Text>

                <Text className="mt-1 text-sm font-semibold text-white">
                  {loading
                    ? "Loading..."
                    : profile?.email || "Email unavailable"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Safety Tools */}
        <View className="mx-5 mt-8">
          <SectionTitle
            title="Safety & Emergency"
            subtitle="Quick access to your safety tools"
          />

          <View className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            <SettingItem
              icon="🆘"
              title="Emergency Contacts"
              subtitle="Add a trusted person"
              onPress={() => router.push("/contact/add" as any)}
            />

            <View className="ml-[68px] h-px bg-slate-800" />

            <SettingItem
              icon="📍"
              title="Location & Safety Map"
              subtitle="Explore emergency locations"
              onPress={() => router.push("/map" as any)}
            />

            <View className="ml-[68px] h-px bg-slate-800" />

            <SettingItem
              icon="🕘"
              title="SOS History"
              subtitle="Review your emergency activity"
              onPress={() => router.push("/history" as any)}
            />
          </View>
        </View>

        {/* Preferences */}
        <View className="mx-5 mt-8">
          <SectionTitle
            title="Preferences"
            subtitle="Personalize your experience"
          />

          <View className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            <SettingItem
              icon="🔔"
              title="Notifications"
              subtitle="Safety reminders and alerts"
              right={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{
                    false: "#334155",
                    true: GREEN,
                  }}
                  thumbColor="#FFFFFF"
                />
              }
            />

            <View className="ml-[68px] h-px bg-slate-800" />

            <SettingItem
              icon="🧭"
              title="Location Reminders"
              subtitle="Location-related preferences"
              right={
                <Switch
                  value={locationReminders}
                  onValueChange={setLocationReminders}
                  trackColor={{
                    false: "#334155",
                    true: GREEN,
                  }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>

          <Text className="mt-3 px-1 text-xs leading-5 text-slate-500">
            Preference switches are currently local UI settings and do not
            enable device notifications or change GPS permissions.
          </Text>
        </View>

        {/* Support */}
        <View className="mx-5 mt-8">
          <SectionTitle
            title="Support & Account"
            subtitle="Help and account information"
          />

          <View className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            <SettingItem
              icon="❓"
              title="Help & Support"
              subtitle="Get help using ResQ"
              onPress={() =>
                Alert.alert(
                  "Help & Support",
                  "For now, please use the app's available safety tools. Support contact details have not been configured yet."
                )
              }
            />

            <View className="ml-[68px] h-px bg-slate-800" />

            <SettingItem
              icon="🔒"
              title="Privacy & Security"
              subtitle="Account and safety information"
              onPress={() =>
                Alert.alert(
                  "Privacy & Security",
                  "Keep your account credentials private. Location sharing happens when you choose to share an SOS message."
                )
              }
            />
          </View>
        </View>

        {/* Logout */}
        <Pressable
          onPress={confirmLogout}
          className="mx-5 mt-8 flex-row items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 py-4 active:bg-red-500/20"
        >
          <Text className="mr-3 text-xl text-red-400">↪</Text>

          <Text className="font-extrabold text-red-400">
            Log Out
          </Text>
        </Pressable>

        <View className="mt-7 items-center">
          <Text className="text-xs font-semibold tracking-widest text-slate-600">
            RESQ SAFETY ASSISTANT
          </Text>

          <Text className="mt-2 text-xs text-slate-600">
            Stay safe. Stay aware.
          </Text>

          <Text className="mt-2 text-[10px] text-slate-700">
            Your safety matters.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
