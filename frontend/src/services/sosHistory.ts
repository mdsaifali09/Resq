
import { API } from "./api";

export type SOSHistoryStatus = "prepared" | "shared" | "cancelled";

export type SOSHistoryItem = {
  _id: string;
  latitude: number;
  longitude: number;
  mapsLink: string;
  status: SOSHistoryStatus;
  alertMessage: string;
  createdAt: string;
  updatedAt: string;
};

type CreateSOSHistoryData = {
  latitude: number;
  longitude: number;
  status?: SOSHistoryStatus;
  alertMessage?: string;
};

export const createSOSHistory = async (
  data: CreateSOSHistoryData
): Promise<SOSHistoryItem> => {
  const response = await API.post("/sos-history", data);
  return response.data.alert as SOSHistoryItem;
};

export const getSOSHistory = async (): Promise<SOSHistoryItem[]> => {
  const response = await API.get("/sos-history");
  return response.data.alerts as SOSHistoryItem[];
};

export const deleteSOSHistory = async (id: string): Promise<void> => {
  await API.delete(`/sos-history/${id}`);
};

export const updateSOSHistory = async (
  id: string,
  status: SOSHistoryStatus
): Promise<SOSHistoryItem> => {
  const response = await API.patch(`/sos-history/${id}`, { status });
  return response.data.alert as SOSHistoryItem;
};
