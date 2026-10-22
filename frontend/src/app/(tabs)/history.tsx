

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import {
  getSOSHistory,
  deleteSOSHistory,
  updateSOSHistory,
  type SOSHistoryItem,
  type SOSHistoryStatus,
} from "../../services/sosHistory";


export default function HistoryScreen() {
  const router = useRouter();

  const [alerts, setAlerts] = useState<SOSHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getSOSHistory();
      setAlerts(data);
    } catch (err: any) {
      console.error(
        "LOAD SOS HISTORY ERROR:",
        err?.response?.data || err
      );

      setError(
        err?.response?.data?.message ||
          "UNABLE TO LOAD SOS HISTORY. PLEASE CHECK YOUR CONNECTION."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [])
  );

  const showNotice = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title.toUpperCase()}\n\n${message.toUpperCase()}`);
    } else {
      Alert.alert(title.toUpperCase(), message.toUpperCase());
    }
  };

  const performDelete = async (item: SOSHistoryItem) => {
    if (deletingId || updatingId) return;

    try {
      setDeletingId(item._id);

      await deleteSOSHistory(item._id);

      setAlerts((previous) =>
        previous.filter((alert) => alert._id !== item._id)
      );

      showNotice(
        "DELETED",
        "SOS HISTORY RECORD DELETED SUCCESSFULLY."
      );
    } catch (err: any) {
      console.error(
        "DELETE SOS HISTORY ERROR:",
        err?.response?.data || err
      );

      showNotice(
        "DELETE FAILED",
        err?.response?.data?.message ||
          "UNABLE TO DELETE THIS RECORD. PLEASE TRY AGAIN."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (item: SOSHistoryItem) => {
    if (deletingId || updatingId) return;

    const confirmDelete = () => {
      void performDelete(item);
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "ARE YOU SURE YOU WANT TO PERMANENTLY DELETE THIS SOS RECORD?"
      );

      if (confirmed) confirmDelete();
      return;
    }

    Alert.alert(
      "DELETE SOS HISTORY",
      "ARE YOU SURE YOU WANT TO PERMANENTLY DELETE THIS RECORD?",
      [
        { text: "CANCEL", style: "cancel" },
        {
          text: "DELETE",
          style: "destructive",
          onPress: confirmDelete,
        },
      ]
    );
  };

  
const handleStatusUpdate = async (
  item: SOSHistoryItem,
  status: SOSHistoryStatus
) => {
  if (updatingId || deletingId) return;
  if (item.status === status) return;

  try {
    setUpdatingId(item._id);

    const updatedAlert = await updateSOSHistory(item._id, status);

    setAlerts((previous) =>
      previous.map((alert) =>
        alert._id === item._id ? updatedAlert : alert
      )
    );

    showNotice(
      "SUCCESS",
      `SOS STATUS UPDATED TO ${status.toUpperCase()}`
    );
  } catch (err: unknown) {
    const error = err as {
      response?: {
        data?: {
          message?: string;
        };
      };
      message?: string;
    };

    console.error(
      "UPDATE SOS STATUS ERROR:",
      error.response?.data || error.message || err
    );

    showNotice(
      "STATUS UPDATE FAILED",
      (
        error.response?.data?.message ||
        error.message ||
        "UNABLE TO UPDATE SOS STATUS. PLEASE TRY AGAIN."
      ).toUpperCase()
    );
  } finally {
    setUpdatingId(null);
  }
};

  const openMap = async (mapsLink: string) => {
    try {
      await Linking.openURL(mapsLink);
    } catch {
      showNotice("MAP ERROR", "COULD NOT OPEN THE MAP.");
    }
  };

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "DATE UNAVAILABLE";
    }

    return parsedDate.toLocaleString();
  };

  
const getStatusClasses = (status: SOSHistoryStatus) => {
  switch (status) {
    case "prepared":
      return {
        container: "bg-amber-500/15 border-amber-500/30",
        text: "text-amber-400",
        label: "PREPARED",
      };

    case "shared":
      return {
        container: "bg-emerald-500/15 border-emerald-500/30",
        text: "text-emerald-400",
        label: "SHARED",
      };

    case "cancelled":
      return {
        container: "bg-red-500/15 border-red-500/30",
        text: "text-red-400",
        label: "CANCELLED",
      };

    default:
      return {
        container: "bg-slate-700/60 border-slate-600",
        text: "text-slate-300",
        label: String(status).toUpperCase(),
      };
  }
};

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950 px-6">
        <View className="h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
          <ActivityIndicator size="large" color="#ef4444" />
        </View>

        <Text className="mt-5 text-lg font-bold text-white">
          LOADING SOS HISTORY
        </Text>

        <Text className="mt-2 text-center text-sm text-slate-400">
          RETRIEVING YOUR SAVED EMERGENCY RECORDS...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 48,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadHistory(true)}
          tintColor="#ef4444"
          colors={["#ef4444"]}
        />
      }
    >
      {/* BACK NAVIGATION */}
      <Pressable
        onPress={() => router.replace("/(tabs)")}
        className="mb-6 self-start flex-row items-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
      >
        <Text className="mr-2 text-lg text-white">←</Text>
        <Text className="font-semibold text-slate-200">
          BACK TO HOME
        </Text>
      </Pressable>

      {/* PAGE HEADER */}
      <View className="flex-row items-center">
        <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
          <Text className="text-2xl">🚨</Text>
        </View>

        <View className="flex-1">
          <Text className="text-3xl font-extrabold text-white">
            SOS HISTORY
          </Text>
          <Text className="mt-1 text-sm text-slate-400">
            YOUR SAVED EMERGENCY ACTIVITY
          </Text>
        </View>
      </View>

      <Text className="mt-5 text-sm leading-6 text-slate-400">
        REVIEW YOUR PREVIOUS SOS EVENTS, CHECK RECORDED LOCATIONS,
        AND MANAGE YOUR HISTORY.
      </Text>

      {/* SUMMARY */}
      <View className="mt-6 rounded-3xl border border-slate-700 bg-slate-900 p-5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-medium text-slate-400">
              TOTAL SAVED ALERTS
            </Text>

            <Text className="mt-2 text-4xl font-extrabold text-white">
              {alerts.length}
            </Text>

            <Text className="mt-2 text-xs text-slate-500">
              YOUR RECORDED SOS EVENTS
            </Text>
          </View>

          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
            <Text className="text-2xl">🛡️</Text>
          </View>
        </View>
      </View>

      {/* ERROR STATE */}
      {error !== "" && (
        <View className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-5">
          <Text className="text-base font-bold text-red-300">
            ERROR LOADING HISTORY
          </Text>

          <Text className="mt-2 text-sm leading-5 text-red-200">
            {error.toUpperCase()}
          </Text>

          <Pressable
            onPress={() => void loadHistory()}
            className="mt-4 self-start rounded-xl bg-red-600 px-5 py-3"
          >
            <Text className="font-bold text-white">TRY AGAIN</Text>
          </Pressable>
        </View>
      )}

      {/* ACTIVITY HEADER */}
      <View className="mb-1 mt-8 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-white">
          RECENT ACTIVITY
        </Text>

        <Pressable
          onPress={() => void loadHistory(true)}
          disabled={refreshing}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
        >
          <Text className="text-sm font-semibold text-slate-300">
            {refreshing ? "REFRESHING..." : "REFRESH"}
          </Text>
        </Pressable>
      </View>

      {/* EMPTY STATE */}
      {!error && alerts.length === 0 && (
        <View className="mt-5 items-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/70 px-6 py-10">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
            <Text className="text-3xl">🛡️</Text>
          </View>

          <Text className="mt-5 text-lg font-bold text-white">
            NO SOS ALERTS YET
          </Text>

          <Text className="mt-2 text-center text-sm leading-6 text-slate-400">
            YOUR SAVED SOS EVENTS WILL APPEAR HERE WHEN AN ALERT
            IS SUCCESSFULLY PREPARED.
          </Text>

          <Pressable
            onPress={() => router.replace("/(tabs)")}
            className="mt-5 rounded-xl bg-red-600 px-5 py-3"
          >
            <Text className="font-bold text-white">
              RETURN TO HOME
            </Text>
          </Pressable>
        </View>
      )}

      {/* HISTORY CARDS */}
      {alerts.map((item) => {
        const status = getStatusClasses(item.status);
        const isDeleting = deletingId === item._id;
        const isUpdating = updatingId === item._id;
        const isBusy = isDeleting || isUpdating;

        return (
          <View
            key={item._id}
            className="mt-5 rounded-3xl border border-slate-700 bg-slate-900 p-5"
          >
            {/* CARD HEADER */}
            <View className="flex-row items-start">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
                <Text className="text-xl">🚨</Text>
              </View>

              <View className="flex-1">
                <Text className="text-lg font-bold text-white">
                  SOS ALERT
                </Text>

                <Text className="mt-1 text-xs leading-5 text-slate-400">
                  {formatDate(item.createdAt)}
                </Text>
              </View>

              <View
                className={`rounded-full border px-3 py-1.5 ${status.container}`}
              >
                <Text className={`text-[10px] font-extrabold ${status.text}`}>
                  {status.label}
                </Text>
              </View>
            </View>

            {/* LOCATION DETAILS */}
            <View className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
                RECORDED LOCATION
              </Text>

              <View className="mt-3 flex-row items-center">
                <Text className="mr-2 text-base">📍</Text>

                <View className="flex-1">
                  <Text className="text-sm text-slate-300">
                    LATITUDE
                  </Text>

                  <Text
                    selectable
                    className="mt-1 text-sm font-semibold text-white"
                  >
                    {item.latitude}
                  </Text>
                </View>
              </View>

              <View className="mt-3 flex-row items-center">
                <Text className="mr-2 text-base">🌐</Text>

                <View className="flex-1">
                  <Text className="text-sm text-slate-300">
                    LONGITUDE
                  </Text>

                  <Text
                    selectable
                    className="mt-1 text-sm font-semibold text-white"
                  >
                    {item.longitude}
                  </Text>
                </View>
              </View>
            </View>

            {/* ALERT DETAILS */}
            {item.alertMessage ? (
              <View className="mt-4">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  ALERT DETAILS
                </Text>

                <Text className="mt-2 text-sm leading-6 text-slate-300">
                  {item.alertMessage}
                </Text>
              </View>
            ) : null}

            {/* MAP BUTTON */}
            <Pressable
              onPress={() => void openMap(item.mapsLink)}
              className="mt-5 flex-row items-center justify-center rounded-xl bg-red-600 px-4 py-4"
            >
              <Text className="mr-2 text-base">📍</Text>

              <Text className="font-bold text-white">
                VIEW LOCATION ON MAP
              </Text>
            </Pressable>

            {/* STATUS UPDATE */}
            <View className="mt-5">
              <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                UPDATE STATUS
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {(
                  ["prepared", "shared", "cancelled"] as const
                ).map((nextStatus) => {
                  const selected = item.status === nextStatus;

                  return (
                    <Pressable
                      key={nextStatus}
                      disabled={isBusy || selected}
                      onPress={() =>
                        void handleStatusUpdate(item, nextStatus)
                      }
                      className={`rounded-xl border px-3 py-3 ${
                        selected
                          ? "border-red-500 bg-red-500/15"
                          : "border-slate-700 bg-slate-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          selected
                            ? "text-red-400"
                            : "text-slate-300"
                        }`}
                      >
                        {nextStatus.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {isUpdating && (
                <View className="mt-3 flex-row items-center">
                  <ActivityIndicator size="small" color="#ef4444" />
                  <Text className="ml-2 text-xs text-slate-400">
                    UPDATING STATUS...
                  </Text>
                </View>
              )}
            </View>

            {/* DELETE BUTTON */}
            <Pressable
              onPress={() => handleDelete(item)}
              disabled={isBusy}
              className={`mt-4 flex-row items-center justify-center rounded-xl border px-4 py-3.5 ${
                isDeleting
                  ? "border-slate-700 bg-slate-800"
                  : "border-red-500/40 bg-red-500/5"
              }`}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#f87171" />
              ) : (
                <Text className="mr-2 text-base">🗑️</Text>
              )}

              <Text
                className={`font-bold ${
                  isDeleting ? "text-slate-400" : "text-red-400"
                }`}
              >
                {isDeleting ? "DELETING..." : "DELETE HISTORY"}
              </Text>
            </Pressable>
          </View>
        );
      })}

      {/* FOOTER NOTE */}
      {alerts.length > 0 && (
        <Text className="mt-6 text-center text-xs leading-5 text-slate-500">
          A PREPARED RECORD DOES NOT CONFIRM THAT AN SMS OR WHATSAPP
          MESSAGE WAS SENT OR DELIVERED. STATUS UPDATES ARE MANUAL.
        </Text>
      )}
    </ScrollView>
  );
}
