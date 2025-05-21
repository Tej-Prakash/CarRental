
// /src/app/api/upload/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import fs from 'fs/promises'; // Using promises API for fs
import path from 'path';

// formidable dependency and bodyParser config are no longer needed

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'assets', 'images');
const MAX_FILE_SIZE_MB = 5; // 5 MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Ensure the upload directory exists
const ensureUploadDirExists = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      console.log(`Created upload directory: ${UPLOAD_DIR}`);
    } else {
      throw error; // Re-throw other errors
    }
  }
};

export async function POST(req: NextRequest) {
  try {
    await ensureUploadDirExists();

    const formData = await req.formData();
    const file = formData.get('file') as File | null; // 'file' is the input field name from client

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded or field name is not "file".' }, { status: 400 });
    }

    // Check if it's actually a file
    if (!(file instanceof File)) {
        return NextResponse.json({ success: false, message: 'Uploaded data is not a file.' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ success: false, message: `File is too large. Max size: ${MAX_FILE_SIZE_MB}MB` }, { status: 413 });
    }

    // Sanitize and create unique filename
    const originalFilename = file.name;
    const sanitizedOriginalName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `${Date.now()}-${sanitizedOriginalName}`;
    
    const fullPath = path.join(UPLOAD_DIR, uniqueFilename);

    // Read file content and write to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(fullPath, buffer);

    const publicFilePath = `/assets/images/${uniqueFilename}`;

    return NextResponse.json({ success: true, filePath: publicFilePath, originalName: file.name }, { status: 201 });

  } catch (error: any) {
    console.error('File upload error:', error);
    // Check for specific errors if possible, e.g., from fs.writeFile
    if (error.code === 'EACCES') {
        return NextResponse.json({ success: false, message: 'Permission denied to write file.' }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: error.message || 'File upload failed.' }, { status: 500 });
  }
}
