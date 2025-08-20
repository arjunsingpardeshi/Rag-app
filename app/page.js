"use client"

import React, { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

export default function RAGApp() {
  const [darkMode, setDarkMode] = useState(false)
  const [fileContent, setFileContent] = useState(null) // store processed file text
  const [fileName, setFileName] = useState(null)

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
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      console.log("Uploaded file path:", data.filePath)
     // const fileurl = `/api/file?name=${encodeURIComponent(data.fileName)}`

     const indexReq = await fetch("/api/indexing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath:data.filePath })
     })
     console.log('index  = ',indexReq);
     const indexRes = indexReq.json()
     console.log('index res = ',indexRes);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
      console.error(err)
        return new Response(JSON.stringify({ error: err.message }), {
          status:500,
        })
    }
}

  const buttonClass =
    "bg-[#39ff14] hover:bg-[#32e212] text-black font-semibold px-4 py-2 rounded-lg shadow-md transition"

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

              {/* File Input */}
              <Input
                type="file"
                onChange={handleFileUpload}
                className="text-sm bg-gray-800 border border-[#96a793]/40"
              />

              {/* Show uploaded file name */}
              {fileName && (
                <p className="text-xs text-gray-400 mt-1">Uploaded: {fileName}</p>
              )}

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
              {fileContent ? (
                <pre className="text-gray-300 text-xs whitespace-pre-wrap">
                  {fileContent.substring(0, 200)}... {/* show preview */}
                </pre>
              ) : (
                <p className="text-gray-400">No data sources yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Chat */}
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col bg-gray-900 border border-[#96a793]">
            <CardHeader>
              <CardTitle className="text-[#96a793]">Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>Ask questions about your data...</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Ask about your data..."
                  className="bg-gray-800 border border-[#96a793]/40"
                />
                <Button className={buttonClass}>Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
