
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Primary model first; fallback models are tried if needed.
const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
];

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const getErrorStatus = (error) => {
  const directStatus =
    error?.status ??
    error?.code ??
    error?.error?.code ??
    error?.response?.status;

  if (Number.isFinite(Number(directStatus))) {
    return Number(directStatus);
  }

  // Some errors contain a JSON response inside error.message.
  try {
    const parsed = JSON.parse(error?.message || "");
    return Number(parsed?.error?.code) || 500;
  } catch {
    return 500;
  }
};

const isRetryable = (status) =>
  [408, 429, 500, 502, 503, 504].includes(status);

const generateAIResponse = async (request) => {
  let lastError;

  for (const model of MODELS) {
    // Two attempts per model, with exponential backoff.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Trying ResQ AI model: ${model}`);

        const response = await ai.models.generateContent({
          ...request,
          model,
        });

        const reply = response.text?.trim();

        if (reply) {
          return reply;
        }

        throw new Error("The AI returned an empty response.");
      } catch (error) {
        lastError = error;
        const status = getErrorStatus(error);

        console.error("Gemini attempt failed:", {
          model,
          attempt,
          status,
          message: error?.message,
        });

        // Don't retry permanent request or authentication errors.
        if (
          status === 400 ||
          status === 401 ||
          status === 403
        ) {
          throw error;
        }

        // Try again for temporary errors.
        if (isRetryable(status) && attempt < 2) {
          await sleep(1000 * 2 ** (attempt - 1));
          continue;
        }

        // For a model-specific error, try the next model.
        break;
      }
    }
  }

  throw lastError || new Error("All AI models failed.");
};

export const chatWithAI = async (req, res) => {
  try {
    const { message, history = [] } = req.body ?? {};

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message.",
      });
    }

    const previousMessages = Array.isArray(history)
      ? history
          .filter(
            (item) =>
              ["user", "assistant"].includes(item?.role) &&
              typeof item?.text === "string" &&
              item.text.trim()
          )
          .slice(-10)
          .map((item) => ({
            role:
              item.role === "assistant" ? "model" : "user",
            parts: [
              { text: item.text.slice(0, 2000) },
            ],
          }))
      : [];

    const request = {
      contents: [
        ...previousMessages,
        {
          role: "user",
          parts: [
            { text: message.trim().slice(0, 4000) },
          ],
        },
      ],
      config: {
        systemInstruction: `
You are ResQ, a helpful AI Safety Assistant.
Give clear, practical safety guidance in simple English.
For emergencies in India, advise the user to call 112.
For immediate danger, prioritize getting to a safe place
and contacting emergency services or a trusted person.
Do not claim you have contacted anyone or sent an SOS.
Do not present yourself as a substitute for emergency services.
If a situation is unclear, ask a short clarifying question.
        `,
      },
    };

    const reply = await generateAIResponse(request);

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    const status = getErrorStatus(error);

    console.error("ResQ AI failed after retries:", {
      status,
      message: error?.message,
    });

    if (status === 429) {
      return res.status(429).json({
        success: false,
        message:
          "AI usage limit reached. Please wait a little and try again.",
      });
    }

    if ([408, 500, 502, 503, 504].includes(status)) {
      return res.status(503).json({
        success: false,
        message:
          "ResQ AI is temporarily unavailable. Please try again shortly.",
      });
    }

    if (status === 401 || status === 403) {
      return res.status(status).json({
        success: false,
        message:
          "AI configuration or API key issue. Please check the backend configuration.",
      });
    }

    if (status === 404) {
      return res.status(503).json({
        success: false,
        message:
          "No configured AI model is currently available. Check the model names and API access.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to generate an AI response. Please try again.",
    });
  }
};
