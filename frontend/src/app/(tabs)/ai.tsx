
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { sendAIMessage } from "../../services/ai";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const suggestions = [
  {
    icon: "walk-outline" as const,
    title: "Walking alone",
    prompt: "How can I stay safe while walking alone at night?",
  },
  {
    icon: "car-outline" as const,
    title: "Safe travel",
    prompt: "Give me practical tips for safe solo travel.",
  },
  {
    icon: "location-outline" as const,
    title: "Location safety",
    prompt: "What should I do if I feel unsafe in an unfamiliar place?",
  },
  {
    icon: "alert-circle-outline" as const,
    title: "Emergency help",
    prompt: "What should I do during a personal safety emergency in India?",
  },
];

export default function AI() {
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const shouldScrollRef = useRef(false);
  const isNearBottomRef = useRef(true);

  const scrollToLatest = () => {
    shouldScrollRef.current = true;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
      shouldScrollRef.current = false;
      isNearBottomRef.current = true;
    });
  };

  const handleChatScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const { contentOffset, contentSize, layoutMeasurement } =
      event.nativeEvent;

    const distanceFromBottom =
      contentSize.height -
      (contentOffset.y + layoutMeasurement.height);

    isNearBottomRef.current = distanceFromBottom < 100;
  };

  const sendMessage = async (text?: string) => {
    const question = (text ?? input).trim();

    if (!question || isThinking) return;

    Keyboard.dismiss();
    setInput("");

    const previousMessages = messages.map(({ role, text }) => ({
      role,
      text,
    }));

    isNearBottomRef.current = true;

    setMessages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-user`,
        role: "user",
        text: question,
      },
    ]);

    // Scroll after React has rendered the new user message.
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);

    setIsThinking(true);

    try {
      const reply = await sendAIMessage(question, previousMessages);

      const shouldFollowLatest = isNearBottomRef.current;

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: reply,
        },
      ]);

      if (shouldFollowLatest) {
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    
    } catch (error: any) {
      const shouldFollowLatest = isNearBottomRef.current;

      const errorText =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to connect to ResQ AI. Please try again.";

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-error`,
          role: "assistant",
          text: errorText,
        },
      ]);

      if (shouldFollowLatest) {
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } finally {
      setIsThinking(false);
    }
  }
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";

    return (
      <View
        className={`mb-5 w-full flex-row ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        {!isUser && (
          <View className="mr-2 mt-1 h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15">
            <Ionicons
              name="shield-checkmark"
              size={19}
              color="#34D399"
            />
          </View>
        )}

        <View
          className={`max-w-[82%] rounded-3xl px-4 py-3 ${
            isUser
              ? "rounded-br-md bg-emerald-400"
              : "rounded-bl-md border border-white/10 bg-[#171D27]"
          }`}
        >
          {!isUser && (
            <Text className="mb-2 text-xs font-bold text-emerald-400">
              RESQ AI
            </Text>
          )}

          <Text
            className={`text-[15px] leading-6 ${
              isUser ? "text-[#07130F]" : "text-gray-100"
            }`}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, minHeight: 0 }}
      className="bg-[#0B1017]"
    >
      <KeyboardAvoidingView
        style={{ flex: 1, minHeight: 0 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Fixed header */}
        <View className="shrink-0 flex-row items-center justify-between border-b border-white/10 bg-[#0B1017] px-4 py-3">
          <View className="flex-row items-center">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400">
              <Ionicons
                name="shield-checkmark"
                size={24}
                color="#07130F"
              />
            </View>

            <View>
              <View className="flex-row items-center">
                <Text className="text-xl font-extrabold text-emerald-400">
                  ResQ
                </Text>
                <Text className="ml-1.5 text-xl font-bold text-white">
                  Assistant
                </Text>
              </View>

              <View className="mt-1 flex-row items-center">
                <View className="mr-2 h-2 w-2 rounded-full bg-emerald-400" />
                <Text className="text-xs text-gray-400">
                  AI safety companion
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/")}
            className="flex-row items-center rounded-full border border-red-400/25 bg-red-500/10 px-3 py-2"
          >
            <Ionicons name="alert-circle" size={17} color="#F87171" />
            <Text className="ml-1.5 text-xs font-bold text-red-400">
              SOS
            </Text>
          </Pressable>
        </View>

        {/* Chat gets the remaining height and scrolls independently */}
        <View style={{ flex: 1, minHeight: 0, width: "100%" }}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={{ flex: 1, minHeight: 0, width: "100%" }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 18,
              paddingBottom: 24,
              flexGrow: 1,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator
            onScroll={handleChatScroll}
            scrollEventThrottle={16}
            ListHeaderComponent={
              messages.length === 0 ? (
                <View className="pb-5">
                  <View className="mb-7 mt-5 items-center">
                    <View className="mb-5 h-20 w-20 items-center justify-center rounded-[26px] border border-emerald-300/20 bg-emerald-400/10">
                      <Ionicons
                        name="shield-checkmark"
                        size={42}
                        color="#34D399"
                      />
                    </View>

                    <Text className="text-center text-2xl font-bold text-white">
                      Your safety,{"\n"}our priority.
                    </Text>

                    <Text className="mt-3 max-w-[300px] text-center text-sm leading-6 text-gray-400">
                      Ask me about personal safety, travelling alone,
                      emergencies, or staying prepared.
                    </Text>

                    <View className="mt-4 flex-row items-center rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-2">
                      <Ionicons name="sparkles" size={14} color="#34D399" />
                      <Text className="ml-2 text-xs text-emerald-300">
                        Powered by Gemini AI
                      </Text>
                    </View>
                  </View>

                  <Text className="mb-3 text-sm font-semibold text-gray-300">
                    QUICK SAFETY GUIDES
                  </Text>

                  <View className="flex-row flex-wrap justify-between">
                    {suggestions.map((item) => (
                      <Pressable
                        key={item.title}
                        onPress={() => sendMessage(item.prompt)}
                        disabled={isThinking}
                        className="mb-3 w-[48%] rounded-2xl border border-white/10 bg-[#151B24] p-4"
                      >
                        <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
                          <Ionicons
                            name={item.icon}
                            size={21}
                            color="#34D399"
                          />
                        </View>

                        <Text className="text-sm font-semibold text-white">
                          {item.title}
                        </Text>

                        <View className="mt-2 flex-row items-center justify-between">
                          <Text className="text-xs text-gray-500">
                            Ask ResQ
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color="#34D399"
                          />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null
            }
            ListFooterComponent={
              isThinking ? (
                <View className="mb-5 flex-row items-start">
                  <View className="mr-2 h-9 w-9 items-center justify-center rounded-2xl bg-emerald-400/15">
                    <Ionicons
                      name="shield-checkmark"
                      size={19}
                      color="#34D399"
                    />
                  </View>

                  <View className="rounded-3xl rounded-bl-md border border-white/10 bg-[#171D27] px-4 py-3">
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="#34D399" />
                      <Text className="ml-3 text-sm text-gray-300">
                        ResQ is thinking...
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null
            }
          />
        </View>

        {/* Composer never participates in chat scrolling */}
        <View
          style={{ flexShrink: 0, width: "100%" }}
          className="border-t border-white/10 bg-[#0E141D] px-3 pb-2 pt-3"
        >
          <View className="flex-row items-end rounded-3xl border border-white/10 bg-[#171E28] px-2 py-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask anything about your safety..."
              placeholderTextColor="#7C8798"
              multiline
              maxLength={2000}
              editable={!isThinking}
              returnKeyType="default"
              blurOnSubmit={false}
              textAlignVertical="center"
              className="max-h-28 min-h-[44px] flex-1 px-3 py-3 text-[15px] leading-5 text-white"
            />

            <Pressable
              onPress={() => sendMessage()}
              disabled={!input.trim() || isThinking}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              className={`mb-0.5 ml-1 h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                input.trim() && !isThinking
                  ? "bg-emerald-400"
                  : "bg-white/10"
              }`}
            >
              <Ionicons
                name="arrow-up"
                size={23}
                color={input.trim() && !isThinking ? "#07130F" : "#667085"}
              />
            </Pressable>
          </View>

          <View className="mt-2 flex-row items-center justify-center">
            <Ionicons
              name="information-circle-outline"
              size={13}
              color="#788394"
            />
            <Text className="ml-1.5 text-center text-[11px] text-gray-500">
              For emergencies in India, call 112
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
