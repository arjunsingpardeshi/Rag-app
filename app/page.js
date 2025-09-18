"use client";

import React, { useState, useEffect, useRef } from "react";
import { Message, MessageContent, MessageAvatar } from "@/components/ai-element/message";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { type } from "os";

export default function RAGApp() {
  const [darkMode, setDarkMode] = useState(false);
  const [fileContent, setFileContent] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [textData, setTextData] = useState("");
  const messagesEndRef = useRef(null);
  const [dataSources, setDataSources] = useState([]);
  const [link, setLink] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Streaming sendMessage
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);

    // Add user message
    const newMsg = { id: Date.now(), sender: "user", text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMsg.text }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      // Streaming tokens
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantMessage += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const newMsgs = [...prev];
          const last = newMsgs[newMsgs.length - 1];
          if (last?.sender === "assistant") {
            last.text = assistantMessage;
          } else {
            newMsgs.push({
              id: Date.now() + 1,
              sender: "assistant",
              text: assistantMessage,
            });
          }
          return [...newMsgs];
        });
      }
    } catch (err) {
      console.error("Error fetching AI response:", err);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, sender: "assistant", text: "❌ Failed to get AI response" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleText = async () => {
    if (!textData.trim()) return;
    const tempId = Date.now();
    const sourceName = `text${tempId}`
    setDataSources((prev) => [
      ...prev,
      { id: tempId, type: "text", name: sourceName, content: textData, status: "indexing" }
    ]);
    setTextData("");

    try {
      const res = await fetch("/api/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textData, type: "rawText" ,textName: sourceName}),
      });

      //console.log("res in text = ", res)
      if(res.ok){
        setDataSources((prev) =>
        prev.map((ds) => (ds.id === tempId ? { ...ds, status: "done" } : ds))
      );
      }
      else{
        setDataSources((prev) =>
        prev.map((ds) => (ds.id === tempId ? { ...ds, status: "error" } : ds))
      );
      }
    } catch (err) {
      setDataSources((prev) =>
        prev.map((ds) => (ds.id === tempId ? { ...ds, status: "error" } : ds))
      );
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tempId = Date.now();
    setDataSources((prev) => [
      ...prev, 
      {id: tempId, type: "pdf", name: file.name, status: "indexing"}
    ])

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      const response = await fetch("/api/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: data.filePath, type: "pdf" }),
      });

     setFileName(file.name);
     if(response.ok){
    
      setDataSources((prev) =>
            prev.map((ds) => (ds.id === tempId ? { ...ds, status: "done" } : ds))
      );     
     }
     else{
        setDataSources((prev) =>
        prev.map((ds) => (ds.id === tempId ? { ...ds, status: "error" } : ds))
      );
    }
    } catch (err) {

      setDataSources((prev) =>
      prev.map((ds) => (ds.id === tempId ? { ...ds, status: "error" } : ds))
    );
      console.error(err);
    }
  };
const handleLink = async () => {
  if (!link.trim()) return;
  const tempId = Date.now();
  
  setDataSources((prev) => [
    ...prev,
    { id: tempId, type: "link", name: link, status: "indexing" }
  ]);
  setLink("");

  try {
    const res = await fetch("/api/indexing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: link, type: "link" }),
    });

    
      if(res.ok){
    
      setDataSources((prev) =>
            prev.map((ds) => (ds.id === tempId ? { ...ds, status: "done" } : ds))
      );     
     }
     else{
      setDataSources((prev) =>
      prev.map((ds) => (ds.id === tempId ? { ...ds, status: "error" } : ds))
    );
     }
  } catch (err) {
    setDataSources((prev) =>
      prev.map((ds) => (ds.id === tempId ? { ...ds, status: "error" } : ds))
    );
  }
  
};

const handleDataStore = async (ds) => {
    console.log("ds = ", ds)

  try {
    
  
    // Call backend API to delete from Qdrant
    const res = await fetch("/api/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceName: ds.name }), // or ds.source if you're storing filename/url
    })
  
    if(res.ok){
      // Update local state (remove from UI)
    setDataSources((prev) => prev.filter((item) => item.id !== ds.id));
      console.log(`source file with name ${ds.name} is deleted`)
    }
    else{
        console.log(`source file with name ${ds.name} is not deleted`)
    }
  
  } catch (error) {
    console.log("error in deletin file", error)
  }
}
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-6 transition-colors">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">RAG Application</h1>
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
                value={textData}
                onChange={(e) => setTextData(e.target.value)}
                placeholder="Paste text content..."
                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <Button variant="default" onClick={handleText}>
                Add Text
              </Button>

              {/* File Input */}
              <Input
                type="file"
                onChange={handleFileUpload}
                className="text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
              {fileName && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Uploaded: {fileName}</p>
              )}

              <Input
                placeholder="https://example.com"
                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <Button variant="default"
                onClick = {handleLink}
              >Submit</Button>
            </CardContent>
          </Card>

          {/* Data Store */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-gray-200">Data Store</CardTitle>
            </CardHeader>
            <CardContent>
                  {dataSources.length > 0 ? (
                  <ul className="space-y-3">
                    {dataSources.map((ds) => (
                      <li
                        key={ds.id}
                        className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {ds.type === "pdf" && <span>📄</span>}
                          {ds.type === "text" && <span>✍️</span>}
                          {ds.type === "link" && <span>🔗</span>}
                          <span className="truncate max-w-[200px]">{ds.name}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {ds.status === "indexing" && (
                            <span className="animate-pulse text-blue-500">Indexing...</span>
                          )}
                          {ds.status === "done" && <span className="text-green-500">✅ Done</span>}
                          {ds.status === "error" && <span className="text-red-500">❌ Error</span>}

                          <Button
                            className={"cursor-pointer"}
                            disabled = {ds.status === "indexing"}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDataStore(ds)}
                          >
                            Remove
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
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
                          className={`px-3 py-2 rounded-lg shadow-sm max-w-[75ch] overflow-x-auto ${
                            msg.sender === "user"
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || "");
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              a({ node, ...props }) {
                                return (
                                  <a
                                    {...props}
                                    className="text-blue-500 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  />
                                );
                              },
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
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
                <Button variant="default" onClick={sendMessage} disabled={loading}>
                  {loading ? "Sending..." : "Send"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
