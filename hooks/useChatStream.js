// hooks/useChatStream.js
import { useState } from "react";

export function useChatStream() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (message) => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
      headers: { "Content-Type": "application/json" },
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      assistantMessage += decoder.decode(value, { stream: true });
      setMessages((prev) => {
        const newMsgs = [...prev];
        const last = newMsgs[newMsgs.length - 1];
        if (last?.role === "assistant") {
          last.content = assistantMessage;
        } else {
          newMsgs.push({ role: "assistant", content: assistantMessage });
        }
        return [...newMsgs];
      });
    }

    setLoading(false);
  };

  return { messages, sendMessage, loading };
}
