
import { API } from "./api";

export type SOSAlertResponse = {
  success: boolean;
  message: string;
  testMode: boolean;
  mapsLink: string;
  alertMessage: string;
  recipients: {
    name: string;
    phone: string;
  }[];
};

export const prepareSOSAlert = async (
  latitude: number,
  longitude: number
): Promise<SOSAlertResponse> => {
  const response = await API.post("/sos/alert", {
    latitude,
    longitude,
  });

  return response.data as SOSAlertResponse;
};
