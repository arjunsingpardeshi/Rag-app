import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { writeFile } from "fs/promises"

// define a temp directory inside project
const uploadDir = path.join(process.cwd(), "tmp")

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // ensure tmp directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = path.join(uploadDir, file.name)

    await writeFile(filePath, buffer)

    return NextResponse.json({ filePath })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
