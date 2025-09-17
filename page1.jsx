"use client"

import React, { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function RAGApp() {
  const [darkMode, setDarkMode] = useState(false)
  const [fileContent, setFileContent] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    setLoading(true)

    const newMsg = {
      id: Date.now(),
      sender: "user",
      text: input,
    }
    setMessages((prev) => [...prev, newMsg])
    setInput("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMsg.text }),
      })

      const data = await res.json()

      const botMsg = {
        id: Date.now() + 1,
        sender: "bot",
        text: data.reply || "⚠️ No response from AI",
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      console.error("Error fetching AI response:", err)
      const errorMsg = {
        id: Date.now() + 2,
        sender: "bot",
        text: "❌ Failed to get AI response",
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()

      const indexReq = await fetch("/api/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: data.filePath }),
      })
      await indexReq.json()
      setFileName(file.name)
    } catch (err) {
      console.error(err)
    }
  }

  // Button style (green accent, adaptive to theme)
  const buttonClass =
    "bg-[#39ff14] hover:bg-[#32e212] text-black font-semibold px-4 py-2 rounded-lg shadow-md transition disabled:opacity-50 dark:bg-[#2ecc71] dark:hover:bg-[#27ae60] dark:text-white"

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 p-6 transition-colors">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#4a5d48] dark:text-[#96a793]">
          RAG Application
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm">🌞 Light</span>
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          <span className="text-sm">🌙 Dark</span>
        </div>
      </header>

      {/* Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Add Data */}
          <Card className="bg-white dark:bg-gray-900 border border-[#4a5d48]/40 dark:border-[#96a793]/40">
            <CardHeader>
              <CardTitle className="text-[#4a5d48] dark:text-[#96a793]">
                Add Data
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Textarea
                placeholder="Paste text content..."
                className="bg-gray-100 dark:bg-gray-800 border border-[#4a5d48]/40 dark:border-[#96a793]/40 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <Button className={buttonClass}>Add Text</Button>

              {/* File Input */}
              <Input
                type="file"
                onChange={handleFileUpload}
                className="text-sm bg-gray-100 dark:bg-gray-800 border border-[#4a5d48]/40 dark:border-[#96a793]/40 text-gray-900 dark:text-gray-100"
              />

              {fileName && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Uploaded: {fileName}
                </p>
              )}

              <Input
                placeholder="https://example.com"
                className="bg-gray-100 dark:bg-gray-800 border border-[#4a5d48]/40 dark:border-[#96a793]/40 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <Button className={buttonClass}>Submit</Button>
            </CardContent>
          </Card>

          {/* Data Store */}
          <Card className="bg-white dark:bg-gray-900 border border-[#4a5d48]/40 dark:border-[#96a793]/40">
            <CardHeader>
              <CardTitle className="text-[#4a5d48] dark:text-[#96a793]">
                Data Store
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fileContent ? (
                <pre className="text-gray-700 dark:text-gray-300 text-xs whitespace-pre-wrap">
                  {fileContent.substring(0, 200)}...
                </pre>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No data sources yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Chat */}
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col bg-white dark:bg-gray-950 border border-[#96a793]/40">
            <CardHeader>
              <CardTitle className="text-[#4a5d48] dark:text-[#96a793]">
                Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.sender === "bot" && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-[#96a793] text-black">
                          AI
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`px-3 py-2 rounded-2xl max-w-xs text-sm shadow-md ${
                        msg.sender === "user"
                          ? "bg-[#39ff14] text-black dark:bg-[#2ecc71] dark:text-white"
                          : "bg-[#96a793] text-black dark:bg-[#555d50] dark:text-white"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {msg.sender === "user" && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-[#39ff14] text-black dark:bg-[#2ecc71] dark:text-white">
                          U
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>

              {/* Input box */}
              <div className="flex gap-2 mt-4">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your data..."
                  className="bg-white dark:bg-gray-900 border border-[#96a793]/60 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-[#39ff14] dark:focus:ring-[#2ecc71]"
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  disabled={loading}
                />
                <Button
                  className={buttonClass}
                  onClick={sendMessage}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
