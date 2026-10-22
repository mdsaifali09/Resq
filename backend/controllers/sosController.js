
import Contact from "../models/Contact.js";

export const prepareSOSAlert = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid GPS coordinates are required.",
      });
    }

    const contacts = await Contact.find({
      user: req.userId,
    }).select("name phone relationship");

    if (contacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add an emergency contact first.",
      });
    }

    const mapsLink =
      `https://www.google.com/maps?q=${latitude},${longitude}`;

    const message =
      `SOS ALERT: I may need help. ` +
      `My current location: ${mapsLink}. ` +
      `Please try to contact me and check that I am safe.`;

    return res.status(200).json({
      success: true,
      message: "SOS alert prepared successfully. No SMS was sent.",
      testMode: true,
      mapsLink,
      alertMessage: message,
      recipients: contacts.map((contact) => ({
        name: contact.name,
        phone: contact.phone,
      })),
    });
  } catch (error) {
    console.error("Prepare SOS alert error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to prepare SOS alert.",
    });
  }
};
