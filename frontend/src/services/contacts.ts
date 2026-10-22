
import { API } from "./api";

export type EmergencyContact = {
  _id: string;
  name: string;
  phone: string;
  relationship: string;
  createdAt?: string;
};

type ContactInput = {
  name: string;
  phone: string;
  relationship: string;
};

export const addContact = async (data: ContactInput) => {
  const response = await API.post("/contacts", data);
  return response.data.contact as EmergencyContact;
};

export const getContacts = async () => {
  const response = await API.get("/contacts");
  return response.data.contacts as EmergencyContact[];
};

export const deleteContact = async (id: string) => {
  const response = await API.delete(`/contacts/${id}`);
  return response.data;
};



export const updateContact = async (
  id: string,
  data: ContactInput
) => {
  const response = await API.put(`/contacts/${id}`, data);
  return response.data.contact as EmergencyContact;
};
