
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Alert } from "react-native";

type Coordinates = {
  latitude: number;
  longitude: number;
};

export default function MapScreen() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState("Location not fetched yet");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getLocation = async () => {
    setLoading(true);
    setError("");

    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setError(
          "Location permission is required to find your current position."
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      setLocation(coords);

      try {
        const places = await Location.reverseGeocodeAsync(coords);
        const place = places[0];

        if (place) {
          const label = [
            place.name,
            place.street,
            place.district,
            place.city,
            place.region,
          ]
            .filter(Boolean)
            .filter((value, index, array) => array.indexOf(value) === index)
            .join(", ");

          setAddress(label || "Current location detected");
        } else {
          setAddress("Current location detected");
        }
      } catch {
        setAddress("Current location detected");
      }
    } catch {
      setError(
        "Unable to get your location. Check GPS, internet and app permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void getLocation();
  }, []);

  const openMap = async (query: string) => {
    const destination = location
      ? `${query} near ${location.latitude},${location.longitude}`
      : query;

    const url =
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;

    try {
      await Linking.openURL(url);
    } catch {
      setError("Could not open Maps. Please try again.");
    }
  };

  const openCurrentLocation = async () => {
    if (!location) {
      await getLocation();
      return;
    }

    const url =
      `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;

    try {
      await Linking.openURL(url);
    } catch {
      setError("Could not open Maps. Please try again.");
    }
  };

  const openSOS = () => {
    router.push("/");
  };

  
const openNearbyPlaces = async (
  place: "hospital" | "police station" | "pharmacy"
) => {
  try {
    const query = encodeURIComponent(`nearby ${place}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;

    await Linking.openURL(url);
  } catch {
    Alert.alert("Unable to open Maps", "Please try again.");
  }
};


  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pb-5 pt-5">
          <Text className="text-sm font-bold tracking-widest text-emerald-400">
            RESQ SAFETY
          </Text>

          <Text className="mt-2 text-3xl font-bold text-white">
            Safety Map 🗺️
          </Text>

          <Text className="mt-2 text-sm text-slate-400">
            Find your location and nearby emergency services.
          </Text>
        </View>

        {/* Current location */}
        <View className="mx-5 rounded-3xl border border-emerald-400/20 bg-slate-900 p-5">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10">
              <Text className="text-2xl">📍</Text>
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-white">
                Your Current Location
              </Text>
              <Text className="mt-1 text-xs text-slate-400">
                {location ? "GPS location detected" : "Waiting for GPS"}
              </Text>
            </View>

            <View
              className={`h-3 w-3 rounded-full ${
                location ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
          </View>


          
<View className="mt-5 rounded-3xl border border-white/10 bg-[#171923] p-5">
  <Text className="text-lg font-extrabold text-white">
    Nearby Emergency Places
  </Text>

  <Text className="mt-1 text-sm text-gray-400">
    Find nearby help using Google Maps.
  </Text>

  <Pressable
    onPress={() => openNearbyPlaces("hospital")}
    className="mt-4 rounded-2xl bg-red-500/10 p-4"
  >
    <Text className="font-bold text-red-300">
      🏥 Find Hospitals
    </Text>
  </Pressable>

  <Pressable
    onPress={() => openNearbyPlaces("police station")}
    className="mt-3 rounded-2xl bg-blue-500/10 p-4"
  >
    <Text className="font-bold text-blue-300">
      🚔 Find Police Stations
    </Text>
  </Pressable>

  <Pressable
    onPress={() => openNearbyPlaces("pharmacy")}
    className="mt-3 rounded-2xl bg-emerald-500/10 p-4"
  >
    <Text className="font-bold text-emerald-300">
      💊 Find Pharmacies
    </Text>
  </Pressable>
</View>


          <View className="my-4 h-px bg-slate-800" />

          {loading ? (
            <View className="flex-row items-center py-2">
              <ActivityIndicator color="#34D399" />
              <Text className="ml-3 text-sm text-slate-300">
                Getting your location...
              </Text>
            </View>
          ) : (
            <Text className="text-sm leading-6 text-slate-300">
              {address}
            </Text>
          )}

          {location && (
            <View className="mt-3 rounded-xl bg-slate-950 p-3">
              <Text className="text-xs text-slate-400">
                Latitude: {location.latitude.toFixed(6)}
              </Text>
              <Text className="mt-1 text-xs text-slate-400">
                Longitude: {location.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          {error ? (
            <Text className="mt-3 text-sm leading-5 text-red-400">
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={getLocation}
            disabled={loading}
            className="mt-4 flex-row items-center justify-center rounded-2xl bg-emerald-400 py-4"
          >
            <Text className="mr-2 text-lg">↻</Text>
            <Text className="font-bold text-slate-950">
              {loading ? "Fetching Location..." : "Refresh Location"}
            </Text>
          </Pressable>

          <Pressable
            onPress={openCurrentLocation}
            className="mt-3 items-center rounded-2xl border border-slate-700 py-3"
          >
            <Text className="font-semibold text-white">
              Open Location in Google Maps ↗
            </Text>
          </Pressable>
        </View>

        {/* Nearby emergency services */}
        <View className="mx-5 mt-7">
          <Text className="text-xl font-bold text-white">
            Emergency Services
          </Text>

          <Text className="mt-1 text-sm text-slate-400">
            Search for nearby help using Google Maps.
          </Text>

          <Pressable
            onPress={() => openMap("hospitals")}
            className="mt-4 flex-row items-center rounded-2xl border border-slate-800 bg-slate-900 p-4"
          >
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
              <Text className="text-3xl">🏥</Text>
            </View>

            <View className="ml-4 flex-1">
              <Text className="text-base font-bold text-white">
                Nearby Hospitals
              </Text>
              <Text className="mt-1 text-xs text-slate-400">
                Find hospitals and medical assistance
              </Text>
            </View>

            <Text className="text-xl text-slate-500">›</Text>
          </Pressable>

          <Pressable
            onPress={() => openMap("police stations")}
            className="mt-3 flex-row items-center rounded-2xl border border-slate-800 bg-slate-900 p-4"
          >
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
              <Text className="text-3xl">🚓</Text>
            </View>

            <View className="ml-4 flex-1">
              <Text className="text-base font-bold text-white">
                Nearby Police Stations
              </Text>
              <Text className="mt-1 text-xs text-slate-400">
                Find local police stations
              </Text>
            </View>

            <Text className="text-xl text-slate-500">›</Text>
          </Pressable>

          <Pressable
            onPress={() => openMap("pharmacies")}
            className="mt-3 flex-row items-center rounded-2xl border border-slate-800 bg-slate-900 p-4"
          >
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Text className="text-3xl">💊</Text>
            </View>

            <View className="ml-4 flex-1">
              <Text className="text-base font-bold text-white">
                Nearby Pharmacies
              </Text>
              <Text className="mt-1 text-xs text-slate-400">
                Search for medical stores
              </Text>
            </View>

            <Text className="text-xl text-slate-500">›</Text>
          </Pressable>
        </View>

        {/* Safety reminder */}
        <View className="mx-5 mt-7 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
          <Text className="text-base font-bold text-amber-300">
            ⚠️ Safety Reminder
          </Text>
          <Text className="mt-2 text-sm leading-6 text-slate-300">
            Always verify the destination and available services. In an
            emergency in India, call 112 directly. Do not wait for the
            map or internet connection.
          </Text>
        </View>

        {/* SOS shortcut */}
        <Pressable
          onPress={openSOS}
          className="mx-5 mt-6 flex-row items-center justify-center rounded-2xl bg-red-600 py-4"
        >
          <Text className="mr-2 text-xl">🚨</Text>
          <Text className="font-bold text-white">
            Open Emergency SOS
          </Text>
        </Pressable>

        <Text className="mt-5 text-center text-xs text-slate-600">
          ResQ Safety Assistant • Stay safe, stay aware
        </Text>
      </ScrollView>
    </View>
  );
}
