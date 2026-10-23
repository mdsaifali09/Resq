import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#7B8498",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "web" ? 12 : 20,
          left: 12,
          right: 12,
          height: 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === "web" ? 8 : 10,
          paddingHorizontal: 4,
          backgroundColor: "#FFFFFF",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#E8ECF4",
          elevation: 8,
          shadowColor: "#1E293B",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarItemStyle: {
          borderRadius: 15,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "map" : "map-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ai"
        options={{
          title: "AI",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "sparkles" : "sparkles-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}