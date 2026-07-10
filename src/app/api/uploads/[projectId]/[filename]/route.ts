import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { readFile } from "fs/promises";
import path from "path";

// Simple mime type map
const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    case 'svg': return 'image/svg+xml';
    case 'csv': return 'text/csv';
    case 'txt': return 'text/plain';
    case 'doc':
    case 'docx': return 'application/msword';
    case 'xls':
    case 'xlsx': return 'application/vnd.ms-excel';
    default: return 'application/octet-stream';
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; filename: string }> }
) {
  // 1. Verify authentication
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await verifyAuth(token);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const { projectId, filename } = resolvedParams;

  if (!projectId || !filename) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // Prevent directory traversal
  const safeFilename = path.basename(filename);
  const safeProjectId = path.basename(projectId);

  // 2. Read the file
  const filepath = path.join(process.cwd(), "data", "uploads", safeProjectId, safeFilename);

  try {
    const fileBuffer = await readFile(filepath);

    // 3. Determine MIME type and headers for inline display
    const mimeType = getMimeType(safeFilename);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        // Using "inline" attempts to open it in browser instead of downloading
        "Content-Disposition": `inline; filename="${safeFilename}"`,
        "Cache-Control": "public, max-age=86400"
      },
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
