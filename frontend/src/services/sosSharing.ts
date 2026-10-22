
import { Linking, Platform, Share } from "react-native";

export const createSOSMessage = (
  latitude: number,
  longitude: number
) => {
  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    `🚨 SOS EMERGENCY ALERT!\n\n` +
    `I may need help. Please contact me and check that I am safe.\n\n` +
    `My current location:\n${mapsLink}`
  );
};

export const shareSOSViaWhatsApp = async (message: string) => {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;

  await Linking.openURL(url);
};



export const shareSOSViaSMS = async (message: string) => {
  if (Platform.OS === "web") {
    // Try opening the default SMS application on desktop.
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;

    try {
      window.location.href = smsUrl;
      return "opened";
    } catch (error) {
      // If SMS is not configured, try copying the message.
      await navigator.clipboard.writeText(message);
      return "copied";
    }
  }

  const url = `sms:?body=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
  return "opened";
};
