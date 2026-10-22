

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { API } from "../../services/api";
import {
  getContacts,
  deleteContact,
  type EmergencyContact,
} from "../../services/contacts";
import {
  createSOSMessage,
  shareSOSViaWhatsApp,
  shareSOSViaSMS,
} from "../../services/sosSharing";
import {
  createSOSHistory,
  updateSOSHistory,
  type SOSHistoryItem,
  type SOSHistoryStatus,
} from "../../services/sosHistory";
import { prepareSOSAlert } from "../../services/sos";



type UserProfile = {
  id?: string;
  name: string;
  email: string;
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

export default function HomeScreen() {
  const [isHolding, setIsHolding] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sosShareMessage, setSosShareMessage] = useState("");
  const [latestHistoryId, setLatestHistoryId] = useState<string | null>(null);
  const [latestStatus, setLatestStatus] = useState<SOSHistoryStatus | null>(null);
  const [sharingMethod, setSharingMethod] = useState<"whatsapp" | "sms" | null>(null);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTriggered = useRef(false);
  const isMounted = useRef(false);

  const showMessage = useCallback((title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(false);
    try {
      const response = await API.get("/auth/me");
      if (!response.data?.success || !response.data?.user) {
        throw new Error("Unable to load profile");
      }
      if (isMounted.current) setProfile(response.data.user);
    } catch (error) {
      console.log("Profile fetch failed:", error);
      if (isMounted.current) setProfileError(true);
    } finally {
      if (isMounted.current) setProfileLoading(false);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    setContactsLoading(true);
    setContactsError(false);
    try {
      const data = await getContacts();
      if (isMounted.current) setContacts(data);
    } catch (error) {
      console.log("Contacts fetch failed:", error);
      if (isMounted.current) setContactsError(true);
    } finally {
      if (isMounted.current) setContactsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchContacts();
    }, [fetchContacts])
  );

  useEffect(() => {
    isMounted.current = true;
    void fetchProfile();
    return () => {
      isMounted.current = false;
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
    };
  }, [fetchProfile]);

  const handleDeleteContact = (contact: EmergencyContact) => {
    const removeContact = async () => {
      setDeletingId(contact._id);
      try {
        await deleteContact(contact._id);
        if (isMounted.current) {
          setContacts((previous) =>
            previous.filter((item) => item._id !== contact._id)
          );
        }
      } catch (error) {
        console.log("Delete contact failed:", error);
        showMessage("ERROR", "Could not delete this contact.");
      } finally {
        if (isMounted.current) setDeletingId(null);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Delete ${contact.name}?`)) void removeContact();
      return;
    }
    Alert.alert("Delete Contact", `Are you sure you want to delete ${contact.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void removeContact() },
    ]);
  };

  const getCurrentLocation = async (): Promise<UserLocation | null> => {
    try {
      if (Platform.OS === "web") {
        const coords = await new Promise<UserLocation>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported"));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (position) =>
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
            reject,
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
          );
        });
        if (isMounted.current) setLocation(coords);
        return coords;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        showMessage(
          "LOCATION PERMISSION REQUIRED",
          "Allow location access in your device settings."
        );
        return null;
      }

      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      };
      if (isMounted.current) setLocation(coords);
      return coords;
    } catch (error) {
      console.log("Location error:", error);
      showMessage(
        "LOCATION ERROR",
        "Unable to get location. Check your browser or device location settings and try again."
      );
      return null;
    }
  };

  const activateSOS = async () => {
    if (sosActive) return;
    setIsHolding(false);
    setSosActive(true);
    setLatestHistoryId(null);
    setLatestStatus(null);

    try {
      const currentLocation = await getCurrentLocation();
      if (!currentLocation) return;

      const { latitude, longitude } = currentLocation;
      const shareMessage = createSOSMessage(latitude, longitude);
      setSosShareMessage(shareMessage);

      const result = await prepareSOSAlert(latitude, longitude);
      if (!result.success) throw new Error("Could not prepare SOS alert.");

      const recipientsText = result.recipients
        .map((contact, index) => `${index + 1}. ${contact.name}\n${contact.phone}`)
        .join("\n\n");

      const previewMessage =
        `${result.message}\n\n` +
        `Recipients:\n${recipientsText || "No emergency contacts added"}\n\n` +
        `Alert message:\n${result.alertMessage}\n\n` +
        `Location:\n${result.mapsLink}\n\n` +
        `TEST MODE: No SMS has been sent automatically.\n\n` +
        `Use the sharing options below to share the message yourself.`;

      try {
        const saved = await createSOSHistory({
          latitude,
          longitude,
          status: "prepared",
          alertMessage: result.alertMessage,
        });
        if (isMounted.current) {
          setLatestHistoryId(saved?._id ?? null);
          setLatestStatus(saved?.status ?? "prepared");
        }
      } catch (historyError) {
        console.error("SOS history save error:", historyError);
        showMessage(
          "HISTORY SAVE WARNING",
          "The SOS preview is ready, but this event could not be saved to history."
        );
      }

      showMessage("🚨 SOS ALERT PREVIEW", previewMessage);
    } catch (error: any) {
      console.log("SOS request failed:", error?.response?.data || error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to prepare the SOS alert. Check your internet and backend server.";
      showMessage("SOS ERROR", errorMessage);
    } finally {
      if (isMounted.current) {
        setSosActive(false);
        setIsHolding(false);
      }
    }
  };

  const startSOSHold = () => {
    if (sosActive || holdTimer.current) return;
    holdTriggered.current = false;
    setIsHolding(true);
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      holdTriggered.current = true;
      void activateSOS();
    }, 1500);
  };

  const cancelSOSHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
      setIsHolding(false);
    }
  };

  const markLatestAsShared = async () => {
    if (!latestHistoryId) {
      showMessage(
        "HISTORY UNAVAILABLE",
        "This SOS event was not saved with an ID, so its status cannot be updated. Check the SOS history API response."
      );
      return;
    }
    try {
      const updated = await updateSOSHistory(latestHistoryId, "shared");
      if (isMounted.current) setLatestStatus(updated.status);
      showMessage(
        "STATUS UPDATED",
        "The SOS history status is now SHARED. Only use this after you have sent the message."
      );
    } catch (error: any) {
      console.error("SOS status update failed:", error?.response?.data || error);
      showMessage(
        "STATUS UPDATE FAILED",
        error?.response?.data?.message || "Could not update the SOS history status."
      );
    }
  };

  const handleWhatsAppShare = async () => {
    if (!sosShareMessage || sharingMethod) return;
    setSharingMethod("whatsapp");
    try {
      await shareSOSViaWhatsApp(sosShareMessage);
      showMessage(
        "WHATSAPP OPENED",
        "Confirm that you actually sent the SOS message in WhatsApp. Then tap “I sent the SOS” below to update history."
      );
    } catch (error) {
      console.error("WhatsApp share failed:", error);
      showMessage(
        "WHATSAPP UNAVAILABLE",
        "WhatsApp could not be opened. Check that it is installed, or use SMS."
      );
    } finally {
      if (isMounted.current) setSharingMethod(null);
    }
  };

  const handleSMSShare = async () => {
    if (!sosShareMessage || sharingMethod) return;
    setSharingMethod("sms");
    try {
      const result = await shareSOSViaSMS(sosShareMessage);
      if (result === "copied") {
        showMessage(
          "SMS MESSAGE COPIED",
          "The SOS message has been copied. Paste it into your SMS app and send it. Then tap “I sent the SOS” below."
        );
      } else {
        showMessage(
          "SMS READY",
          "Check the SMS app and confirm that you sent the message before updating the history."
        );
      }
    } catch (error) {
      console.error("SMS share failed:", error);
      showMessage(
        "SMS UNAVAILABLE",
        "The SMS app could not be opened. Try WhatsApp or copy the SOS message manually."
      );
    } finally {
      if (isMounted.current) setSharingMethod(null);
    }
  };

  const openMaps = async () => {
    if (!location) return;
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    try {
      if (Platform.OS === "web") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        await Linking.openURL(url);
      }
    } catch {
      showMessage("MAPS UNAVAILABLE", "Could not open Google Maps on this device.");
    }
  };

  const openHistory = () => router.push("/(tabs)/history");

  const handleQuickCall = async (phone: string) => {
  try {
    await Linking.openURL(`tel:${phone}`);
  } catch (error) {
    Alert.alert(
      "Unable to open dialer",
      "Please try calling from your phone."
    );
  }
};



const handleContactCall = async (phone: string) => {
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  if (!cleanPhone) {
    Alert.alert("Invalid number", "This contact has no valid phone number.");
    return;
  }

  try {
    await Linking.openURL(`tel:${cleanPhone}`);
  } catch {
    Alert.alert(
      "Unable to open dialer",
      "Please try calling this contact from your phone."
    );
  }
};


  return (
    <ScrollView
      className="flex-1 bg-[#070B14]"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View className="px-5 pt-14">
        {/* Premium header */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center self-start rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5">
              <View className="mr-2 h-2 w-2 rounded-full bg-emerald-400" />
              <Text className="text-[10px] font-extrabold tracking-[2px] text-emerald-300">
                RESQ PROTECTION
              </Text>
            </View>
            <Text className="mt-4 text-3xl font-black tracking-tight text-white">
              Stay safe.
            </Text>
            <Text className="mt-1 text-base text-slate-400">
              Your personal safety dashboard
            </Text>
            {profileLoading ? (
              <Text className="mt-3 text-sm text-slate-500">Loading profile...</Text>
            ) : profile ? (
              <View className="mt-3">
                <Text className="text-base font-bold text-emerald-300">
                  Welcome, {profile.name}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">{profile.email}</Text>
              </View>
            ) : (
              <View className="mt-3">
                <Text className="text-sm text-red-300">
                  {profileError ? "Could not load your profile." : "Welcome to ResQ"}
                </Text>
                {profileError && (
                  <Pressable
                    onPress={() => void fetchProfile()}
                    className="mt-2 self-start rounded-xl bg-slate-800 px-3 py-2"
                  >
                    <Text className="text-xs font-bold text-white">RETRY</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
          <View className="h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-900">
            <Text className="text-3xl">🛡️</Text>
          </View>
        </View>

        {/* System status */}
        <View className="mt-6 flex-row items-center rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
            <Text className="text-xl">✓</Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-sm font-bold text-white">Safety dashboard ready</Text>
            <Text className="mt-1 text-xs text-slate-400">
              {location ? "GPS location available" : "GPS activates when you request SOS"}
            </Text>
          </View>
          <View className="rounded-full bg-emerald-400/10 px-2.5 py-1">
            <Text className="text-[10px] font-extrabold text-emerald-300">READY</Text>
          </View>
        </View>

        {/* SOS card */}
        <View className="mt-6 overflow-hidden rounded-[30px] border border-red-500/20 bg-[#111522] px-5 pb-6 pt-7">
          <View className="items-center">
            <View className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5">
              <Text className="text-[10px] font-extrabold tracking-[2px] text-red-300">
                EMERGENCY ASSISTANCE
              </Text>
            </View>
            <Text className="mt-4 text-center text-2xl font-black text-white">
              Need help right now?
            </Text>
            <Text className="mt-2 max-w-[280px] text-center text-sm leading-5 text-slate-400">
              Press and hold the button for 1.5 seconds to prepare your SOS alert.
            </Text>
            <View className="mt-7 h-60 w-60 items-center justify-center rounded-full border border-red-500/20 bg-red-500/5">
              <View className="h-52 w-52 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                <Pressable
                  onPressIn={startSOSHold}
                  onPressOut={cancelSOSHold}
                  disabled={sosActive}
                  accessibilityRole="button"
                  accessibilityLabel="Hold to prepare SOS alert"
                  className={`h-44 w-44 items-center justify-center rounded-full border-4 border-red-200/20 ${
                    isHolding || sosActive ? "bg-red-700" : "bg-red-600"
                  }`}
                  style={{
                    opacity: sosActive ? 0.75 : 1,
                    elevation: 10,
                    shadowColor: "#ef4444",
                    shadowOpacity: 0.3,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 5 },
                  }}
                >
                  <Text className="text-5xl">🚨</Text>
                  <Text className="mt-2 text-3xl font-black tracking-widest text-white">
                    SOS
                  </Text>
                  <Text className="mt-1 text-[10px] font-extrabold tracking-wider text-red-100">
                    {sosActive
                      ? "PROCESSING..."
                      : isHolding
                      ? "KEEP HOLDING..."
                      : "HOLD FOR HELP"}
                  </Text>
                </Pressable>
              </View>
            </View>
            <Text className="mt-5 text-center text-xs leading-5 text-slate-500">
              Test mode: ResQ prepares the alert. It does not automatically call emergency services or send SMS.
            </Text>
          </View>


          
{/* Emergency Quick Call */}
<View className="mt-5 rounded-3xl border border-red-500/20 bg-[#171923] p-5">
  <Text className="text-lg font-extrabold text-white">
    Emergency Quick Call
  </Text>

  <Text className="mt-1 text-sm text-gray-400">
    Quickly open your phone dialer for emergency help.
  </Text>

  <Pressable
    onPress={() => handleQuickCall("112")}
    className="mt-4 flex-row items-center justify-between rounded-2xl bg-red-500/15 p-4"
  >
    <View>
      <Text className="text-base font-bold text-red-300">
        Emergency Services
      </Text>
      <Text className="mt-1 text-sm text-gray-400">
        India emergency number
      </Text>
    </View>

    <View className="rounded-xl bg-red-500 px-4 py-3">
      <Text className="font-extrabold text-white">
        Call 112
      </Text>
    </View>
  </Pressable>

  <Text className="mt-3 text-xs text-gray-500">
    Your phone dialer will open. Check the number and confirm the call.
  </Text>
</View>


          {sosShareMessage !== "" && (
            <View className="mt-6 border-t border-slate-800 pt-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-extrabold text-white">Share your SOS</Text>
                <View className="rounded-full bg-amber-400/10 px-2.5 py-1">
                  <Text className="text-[10px] font-extrabold text-amber-300">
                    {latestStatus ? latestStatus.toUpperCase() : "PREPARED"}
                  </Text>
                </View>
              </View>
              <Text className="mt-1 text-xs leading-5 text-slate-400">
                Choose an app, send the message, then confirm below.
              </Text>
              <View className="mt-4 gap-3">
                <Pressable
                  onPress={() => void handleWhatsAppShare()}
                  disabled={sharingMethod !== null}
                  className="flex-row items-center rounded-2xl bg-[#168A50] p-4"
                  style={{ opacity: sharingMethod ? 0.65 : 1 }}
                >
                  <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                    <Text className="text-2xl">◉</Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-extrabold text-white">
                      {sharingMethod === "whatsapp" ? "Opening WhatsApp..." : "Share via WhatsApp"}
                    </Text>
                    <Text className="mt-1 text-xs text-emerald-50">
                      Send your location to a trusted contact
                    </Text>
                  </View>
                  <Text className="text-xl text-white">›</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleSMSShare()}
                  disabled={sharingMethod !== null}
                  className="flex-row items-center rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4"
                  style={{ opacity: sharingMethod ? 0.65 : 1 }}
                >
                  <View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-400/10">
                    <Text className="text-2xl">✉️</Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-extrabold text-white">
                      {sharingMethod === "sms" ? "Opening SMS..." : "Share via SMS"}
                    </Text>
                    <Text className="mt-1 text-xs text-slate-400">
                      Open messaging or copy the SOS text
                    </Text>
                  </View>
                  <Text className="text-xl text-blue-200">›</Text>
                </Pressable>
                <Pressable
                  onPress={() => void markLatestAsShared()}
                  disabled={!latestHistoryId || latestStatus === "shared"}
                  className={`rounded-2xl border p-4 ${
                    latestStatus === "shared"
                      ? "border-emerald-500/20 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-800/70"
                  }`}
                >
                  <Text className={`text-center font-extrabold ${
                    latestStatus === "shared" ? "text-emerald-300" : "text-white"
                  }`}>
                    {latestStatus === "shared" ? "✓ SOS MARKED AS SHARED" : "I SENT THE SOS — UPDATE HISTORY"}
                  </Text>
                  <Text className="mt-1 text-center text-[11px] leading-4 text-slate-400">
                    Only tap after you have actually sent the message.
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Location card */}
        <View className="mt-5 rounded-3xl border border-slate-800 bg-[#101522] p-5">
          <View className="flex-row items-center">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/10">
              <Text className="text-2xl">📍</Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-extrabold text-white">Current location</Text>
              <Text className="mt-1 text-xs text-slate-400">Your GPS coordinates</Text>
            </View>
            <View className={`rounded-full px-2.5 py-1 ${
              location ? "bg-emerald-400/10" : "bg-slate-800"
            }`}>
              <Text className={`text-[10px] font-extrabold ${
                location ? "text-emerald-300" : "text-slate-400"
              }`}>{location ? "ACTIVE" : "WAITING"}</Text>
            </View>
          </View>
          <View className="mt-4 rounded-2xl border border-slate-800/80 bg-[#090D17] p-4">
            {location ? (
              <>
                <Text className="text-xs font-semibold text-slate-500">LATITUDE / LONGITUDE</Text>
                <Text className="mt-2 text-base font-bold text-white">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
                <Pressable onPress={() => void openMaps()} className="mt-4 self-start rounded-xl bg-sky-500/15 px-4 py-2.5">
                  <Text className="text-sm font-bold text-sky-300">Open in Google Maps ↗</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text className="text-sm font-bold text-white">Location not available yet</Text>
                <Text className="mt-1 text-xs leading-5 text-slate-500">
                  Hold the SOS button to request your current location.
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Contacts */}
        <View className="mt-7">
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-xl font-black text-white">Emergency contacts</Text>
              <Text className="mt-1 text-xs text-slate-500">People you trust most</Text>
            </View>
            <Pressable
              onPress={() => router.push("/contact/add")}
              className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2"
            >
              <Text className="text-sm font-extrabold text-red-300">+ Add contact</Text>
            </Pressable>
          </View>

          {contactsLoading ? (
            <View className="mt-4 rounded-2xl border border-slate-800 bg-[#101522] p-5">
              <Text className="text-sm text-slate-400">Loading emergency contacts...</Text>
            </View>
          ) : contactsError ? (
            <View className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <Text className="text-sm text-red-300">Could not load emergency contacts.</Text>
              <Pressable onPress={() => void fetchContacts()} className="mt-3 self-start rounded-xl bg-slate-800 px-4 py-2.5">
                <Text className="font-bold text-white">Retry</Text>
              </Pressable>
            </View>
          ) : contacts.length === 0 ? (
            <View className="mt-4 rounded-2xl border border-slate-800 bg-[#101522] p-5">
              <Text className="text-3xl">👥</Text>
              <Text className="mt-3 text-base font-extrabold text-white">No emergency contacts yet</Text>
              <Text className="mt-2 text-sm leading-5 text-slate-400">
                Add a trusted person so their details are ready when you need help.
              </Text>
              <Pressable onPress={() => router.push("/contact/add")} className="mt-4 self-start rounded-xl bg-red-600 px-4 py-3">
                <Text className="font-extrabold text-white">Add your first contact</Text>
              </Pressable>
            </View>
          ) : (
            <View className="mt-4 gap-3">
              {contacts.map((contact) => (
                <View key={contact._id} className="flex-row items-center rounded-2xl border border-slate-800 bg-[#101522] p-4">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10">
                    <Text className="text-2xl">👤</Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-extrabold text-white">{contact.name}</Text>
                    <Text className="mt-1 text-xs text-slate-400">{contact.relationship}</Text>
                    <Text className="mt-1 text-sm font-medium text-slate-300">{contact.phone}</Text>
                  </View>

                  
<Pressable
  onPress={() =>
    router.push({
      pathname: "/contact/edit",
      params: { id: contact._id },
    })
  }
  className="mr-2 rounded-xl bg-violet-500/10 px-3 py-2.5"
>
  <Text className="text-xs font-extrabold text-violet-300">
    Edit
  </Text>
</Pressable>



<Pressable
  onPress={() => handleContactCall(contact.phone)}
  className="mr-2 rounded-xl bg-emerald-500/10 px-3 py-2.5"
>
  <Text className="text-xs font-extrabold text-emerald-300">
    Call
  </Text>
</Pressable>





                  <Pressable
                    onPress={() => handleDeleteContact(contact)}
                    disabled={deletingId === contact._id}
                    className="rounded-xl bg-red-500/10 px-3 py-2.5"
                  >
                    <Text className="text-xs font-extrabold text-red-300">
                      {deletingId === contact._id ? "Deleting..." : "Delete"}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* AI assistant feature card */}
        <Pressable
          onPress={() => router.push("/(tabs)/ai")}
          className="mt-7 rounded-3xl border border-violet-400/20 bg-[#151126] p-5"
        >
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10">
              <Text className="text-2xl">🤖</Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-extrabold text-white">AI Safety Assistant</Text>
              <Text className="mt-1 text-xs text-violet-200">Safety guidance and support</Text>
            </View>
            <Text className="text-xl text-violet-200">›</Text>
          </View>
          <Text className="mt-4 text-sm leading-5 text-slate-400">
            Explore safety guidance for difficult situations and plan your next step.
          </Text>
        </Pressable>

        {/* Quick actions */}
        <View className="mt-7">
          <Text className="text-xl font-black text-white">Quick actions</Text>
          <Text className="mt-1 text-xs text-slate-500">Jump to the tools you need</Text>
          <View className="mt-4 flex-row gap-3">
            <Pressable onPress={() => router.push("/(tabs)/map")} className="flex-1 rounded-2xl border border-slate-800 bg-[#101522] p-4">
              <Text className="text-2xl">🗺️</Text>
              <Text className="mt-3 text-sm font-extrabold text-white">Safety map</Text>
              <Text className="mt-1 text-xs text-slate-500">View map tools</Text>
            </Pressable>
            <Pressable onPress={openHistory} className="flex-1 rounded-2xl border border-slate-800 bg-[#101522] p-4">
              <Text className="text-2xl">📋</Text>
              <Text className="mt-3 text-sm font-extrabold text-white">SOS history</Text>
              <Text className="mt-1 text-xs text-slate-500">Review past alerts</Text>
            </Pressable>
          </View>
        </View>

        <Text className="mb-4 mt-8 text-center text-[10px] leading-4 text-slate-600">
          RESQ • PERSONAL SAFETY ASSISTANT{"\n"}Test mode only — verify emergency information and contact details.
        </Text>
      </View>
    </ScrollView>
  );
}



