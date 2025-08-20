"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function RAGApp() {
  const [darkMode, setDarkMode] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const buttonClass =
    "bg-[#39ff14] hover:bg-[#32e212] text-black font-semibold px-4 py-2 rounded-lg shadow-md transition";

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      const botMessage = {
        sender: "bot",
        text: `You said: "${userMessage.text}" 🤖`,
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#96a793]">RAG Application</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm">🌸 Neon</span>
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          <span className="text-sm">🌙 Dark</span>
        </div>
      </header>

      {/* Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Add Data */}
          <Card className="bg-gray-900 border border-[#96a793]">
            <CardHeader>
              <CardTitle className="text-[#96a793]">Add Data</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Textarea
                placeholder="Paste text content..."
                className="bg-gray-800 border border-[#96a793]/40"
              />
              <Button className={buttonClass}>Add Text</Button>
              <Input
                type="file"
                className="text-sm bg-gray-800 border border-[#96a793]/40"
              />
              <Input
                placeholder="https://example.com"
                className="bg-gray-800 border border-[#96a793]/40"
              />
              <Button className={buttonClass}>Submit</Button>
            </CardContent>
          </Card>

          {/* Data Store */}
          <Card className="bg-gray-900 border border-[#96a793]">
            <CardHeader>
              <CardTitle className="text-[#96a793]">Data Store</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">No data sources yet</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Chat */}
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col bg-gray-900 border border-[#96a793]">
            <CardHeader>
              <CardTitle className="text-[#96a793]">Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto space-y-4 p-2">
                {messages.length === 0 && (
                  <p className="text-gray-500 text-center">
                    Ask questions about your data...
                  </p>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* Avatar */}
                    {msg.sender === "bot" && (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white">
                        🤖
                      </div>
                    )}
                    <div
                      className={`p-2 rounded-lg max-w-[70%] ${
                        msg.sender === "user"
                          ? "bg-[#39ff14] text-black"
                          : "bg-gray-800 text-gray-200"
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.sender === "user" && (
                      <div className="w-10 h-10 rounded-full bg-[#39ff14] flex items-center justify-center text-black font-bold">
                        U
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Input Box */}
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Ask about your data..."
                  className="bg-gray-800 border border-[#96a793]/40"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button className={buttonClass} onClick={handleSend}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
