import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("file");

    if (!fileUrl) {
      return NextResponse.json({ error: "No file specified" }, { status: 400 });
    }

    // Estrarre il nome del file dal percorso (es. /uploads/123-file.txt -> 123-file.txt)
    const filename = fileUrl.split("/").pop();
    if (!filename) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const filepath = path.join(process.cwd(), "public", "uploads", filename);

    // Tentativo di eliminazione del file
    await unlink(filepath);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete file error:", error);
    // Anche se il file non esiste, per noi è OK (potrebbe essere stato già rimosso)
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(uploadDir, filename);

    // Write file to public/uploads
    await writeFile(filepath, buffer);

    // Return the path relative to public directory for URL access
    return NextResponse.json({ path: `/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
