
import { API } from "./api";

export type AIChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export async function sendAIMessage(
  message: string,
  history: AIChatMessage[] = []
): Promise<string> {
  try {
    const response = await API.post("/ai/chat", {
      message,
      history,
    });

    if (!response.data?.reply) {
      throw new Error("AI did not return a response. Please try again.");
    }

    return response.data.reply;
  } catch (error: any) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 429) {
      throw new Error(
        serverMessage || "AI request limit reached. Please try later."
      );
    }

    if (status === 503 || status === 502 || status === 504) {
      throw new Error(
        serverMessage || "AI is temporarily busy. Please try again shortly."
      );
    }

    if (!error?.response) {
      throw new Error(
        "Cannot connect to the backend. Check that your server is running and API URL is correct."
      );
    }

    throw new Error(
      serverMessage || "Unable to get an AI response right now."
    );
  }
}
