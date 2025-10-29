import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { chatService, ChatMessage } from "@/firebase/services";
import { auth } from "@/firebase/config";
import { Ionicons } from "@expo/vector-icons";

export default function ChatScreen() {
  const { id } = useLocalSearchParams(); // conversation ID
  const [messages, setMessages] = useState<(ChatMessage & { id: string })[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  useEffect(() => {
    if (!id) return;
    const unsub = chatService.subscribeToConversation(id, setMessages);
    return () => unsub && unsub();
  }, [id]);

  const sendMessage = async () => {
    if (!text.trim() || !id) return;
    await chatService.sendMessage(id, {
      senderId: auth?.currentUser?.uid,
      senderName: auth?.currentUser?.email || auth?.currentUser?.uid,
      message: text.trim(),
      isRead: false,
      repliedTo: replyTo
        ? { message: replyTo.message, senderName: replyTo.senderName }
        : null,
    });
    setText("");
    setReplyTo(null);
  };

  const deleteMessage = async (messageId: string) => {
    Alert.alert("Delete Message", "Are you sure you want to delete this message?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await chatService.deleteMessage(id as string, messageId);
        },
      },
    ]);
  };

  const renderMessage = ({ item }: { item: ChatMessage & { id: string } }) => {
    const isMe = item.senderId === auth?.currentUser?.uid;

    return (
      <TouchableOpacity
        onLongPress={() => deleteMessage(item.id)}
        onPress={() => setReplyTo(item)}
        activeOpacity={0.8}
        style={[
          styles.messageContainer,
          isMe ? styles.messageRight : styles.messageLeft,
        ]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.senderName?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>

        <View
          style={[
            styles.bubble,
            isMe ? styles.bubbleRight : styles.bubbleLeft,
          ]}
        >
          {item.repliedTo && (
            <View
              style={[
                styles.replyContainer,
                isMe ? styles.replyRight : styles.replyLeft,
              ]}
            >
              <Text style={styles.replyName}>{item.repliedTo.senderName}</Text>
              <Text
                numberOfLines={1}
                style={styles.replyText}
              >
                {item.repliedTo.message}
              </Text>
            </View>
          )}
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.timeText}>
            {new Date(item.timestamp?.seconds * 1000).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 10 }}
        inverted
      />

      {replyTo && (
        <View style={styles.replyPreview}>
          <Text style={styles.replyTitle}>Replying to {replyTo.senderName}</Text>
          <Text numberOfLines={1} style={styles.replyPreviewText}>
            {replyTo.message}
          </Text>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Ionicons name="close" size={20} color="#555" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="اكتب رسالة..."
          value={text}
          onChangeText={setText}
          style={styles.input}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FA" },

  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 4,
  },
  messageLeft: { alignSelf: "flex-start" },
  messageRight: { alignSelf: "flex-end", flexDirection: "row-reverse" },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  avatarText: { color: "#fff", fontWeight: "600" },

  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 10,
    elevation: 1,
  },
  bubbleLeft: { backgroundColor: "#E9ECF1", borderTopLeftRadius: 2 },
  bubbleRight: { backgroundColor: "#3B82F6", borderTopRightRadius: 2 },

  messageText: {
    color: "#fff",
    fontSize: 15,
  },

  replyContainer: {
    borderLeftWidth: 3,
    paddingLeft: 6,
    marginBottom: 6,
  },
  replyLeft: { borderColor: "#3B82F6" },
  replyRight: { borderColor: "#fff" },
  replyName: {
    fontWeight: "600",
    fontSize: 12,
    color: "#222",
  },
  replyText: {
    fontSize: 12,
    color: "#555",
  },

  timeText: {
    fontSize: 10,
    alignSelf: "flex-end",
    marginTop: 4,
    opacity: 0.8,
    color: "#fff",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 15,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 25,
    padding: 10,
  },

  replyPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E5EAF1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  replyTitle: { fontWeight: "600", fontSize: 13 },
  replyPreviewText: { color: "#555", flex: 1, marginHorizontal: 6 },
});
