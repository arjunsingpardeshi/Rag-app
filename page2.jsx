"use client"

import React, { useState, useEffect, useRef } from "react"
import { Message, MessageContent, MessageAvatar } from "@/components/ai-element/message"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"


export default function RAGApp() {
  const [darkMode, setDarkMode] = useState(false)
  const [fileContent, setFileContent] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [textData, setTextData] = useState("")
  const messagesEndRef = useRef(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    setLoading(true)

    const newMsg = { id: Date.now(), sender: "user", text: input }
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
        sender: "assistant",
        text: data.reply || "⚠️ No response from AI",
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      console.error("Error fetching AI response:", err)
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, sender: "assistant", text: "❌ Failed to get AI response" },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  const handleText = async (e) => {
    
    
    if(!textData.trim())return

    console.log("add Button click",textData)

    setTextData("")
  }
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()

      await fetch("/api/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: data.filePath }),
      })

      setFileName(file.name)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-6 transition-colors">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          RAG Application
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <span>🌞 Light</span>
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          <span>🌙 Dark</span>
        </div>
      </header>

      {/* Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Add Data */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-gray-200">Add Data</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Textarea
                value = {textData}
                onChange = {(e) => setTextData(e.target.value)}
                placeholder="Paste text content..."
                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <Button variant="default"
              onClick={handleText}
              >Add Text</Button>

              {/* File Input */}
              <Input
                type="file"
                onChange={handleFileUpload}
                className="text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
              {fileName && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Uploaded: {fileName}
                </p>
              )}

              <Input
                placeholder="https://example.com"
                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <Button variant="default">Submit</Button>
            </CardContent>
          </Card>

          {/* Data Store */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-gray-200">Data Store</CardTitle>
            </CardHeader>
            <CardContent>
              {fileContent ? (
                <pre className="text-gray-700 dark:text-gray-300 text-xs whitespace-pre-wrap">
                  {fileContent.substring(0, 200)}...
                </pre>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No data sources yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Chat */}
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-gray-200">Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-center gap-3 ${
                        msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {msg.sender === "assistant" && (
                        <MessageAvatar src="/ai.png" name="AI" />
                      )}
                      {msg.sender === "user" && (
                        <MessageAvatar src="/user.png" name="U" />
                      )}
                      <Message from={msg.sender}>
                        <MessageContent
                          variant="contained"
                          className={`px-3 py-2 rounded-lg shadow-sm ${
                            msg.sender === "user"
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {msg.text}
                        </MessageContent>
                      </Message>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input box */}
              <div className="flex gap-2 mt-4">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your data..."
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-green-500"
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  disabled={loading}
                />
                <Button
                  variant="default"
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
