
import SOSAlert from "../models/SOSAlert.js";

export const createSOSHistory = async (req, res) => {
  try {
    const { latitude, longitude, status = "prepared", alertMessage = "" } =
      req.body;

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

    if (!["prepared", "shared", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid SOS status.",
      });
    }

    const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

    const alert = await SOSAlert.create({
      user: req.userId,
      latitude,
      longitude,
      mapsLink,
      status,
      alertMessage,
    });

    return res.status(201).json({
      success: true,
      message: "SOS history saved successfully.",
      alert,
    });
  } catch (error) {
    console.error("Create SOS history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save SOS history.",
    });
  }
};

export const getSOSHistory = async (req, res) => {
  try {
    const alerts = await SOSAlert.find({
      user: req.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error("Get SOS history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch SOS history.",
    });
  }
};



export const deleteSOSHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await SOSAlert.findOneAndDelete({
      _id: id,
      user: req.userId,
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "SOS history record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "SOS history deleted successfully.",
    });
  } catch (error) {
    console.error("Delete SOS history error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid SOS history ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to delete SOS history.",
    });
  }
};



export const updateSOSHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["prepared", "shared", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid SOS status.",
      });
    }

    const alert = await SOSAlert.findOneAndUpdate(
      {
        _id: id,
        user: req.userId,
      },
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "SOS history record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "SOS status updated successfully.",
      alert,
    });
  } catch (error) {
    console.error("Update SOS history error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid SOS history ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update SOS status.",
    });
  }
};

