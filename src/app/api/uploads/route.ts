import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("file");

    if (!fileUrl) {
      return NextResponse.json({ error: "No file specified" }, { status: 400 });
    }

    // Estrarre id progetto e nome file dal percorso (es. /api/uploads/123/file.txt)
    const parts = fileUrl.split("/");
    const filename = parts.pop();
    const projectId = parts.pop();

    if (!filename || !projectId) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Sicurezza contro path traversal
    const safeFilename = path.basename(filename);
    const safeProjectId = path.basename(projectId);

    const filepath = path.join(process.cwd(), "data", "uploads", safeProjectId, safeFilename);

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
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "No project ID specified" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Prevent directory traversal
    const safeProjectId = path.basename(projectId);

    // Save to data/uploads/[projectId] directory
    const uploadDir = path.join(process.cwd(), "data", "uploads", safeProjectId);

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filename = `${Date.now()}-${sanitizedFilename}`;
    const filepath = path.join(uploadDir, filename);

    // Write file to data/uploads/[projectId]
    await writeFile(filepath, buffer);

    // Return the path for the API route
    return NextResponse.json({ path: `/api/uploads/${safeProjectId}/${filename}` }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
