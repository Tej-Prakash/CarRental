
// /src/app/api/upload/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import fs from 'fs/promises'; 
import path from 'path';

const MAX_FILE_SIZE_MB = 5; 
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

const UPLOAD_DIR_BASE = path.join(process.cwd(), 'public', 'assets');

// Ensure the base upload directory exists
const ensureUploadDirExists = async (dirPath: string) => {
  try {
    await fs.access(dirPath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`Created upload directory: ${dirPath}`);
    } else {
      throw error; 
    }
  }
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded or field name is not "file".' }, { status: 400 });
    }

    if (!(file instanceof File)) {
        return NextResponse.json({ success: false, message: 'Uploaded data is not a file.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ success: false, message: `File is too large. Max size: ${MAX_FILE_SIZE_MB}MB` }, { status: 413 });
    }
    
    const destinationFolder = req.nextUrl.searchParams.get('destination') || 'images';
    if (!['images', 'documents'].includes(destinationFolder)) {
        return NextResponse.json({ success: false, message: 'Invalid upload destination.' }, { status: 400 });
    }

    const UPLOAD_DIR = path.join(UPLOAD_DIR_BASE, destinationFolder);
    await ensureUploadDirExists(UPLOAD_DIR);


    const originalFilename = file.name;
    const sanitizedOriginalName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `${Date.now()}-${sanitizedOriginalName}`;
    
    const fullPath = path.join(UPLOAD_DIR, uniqueFilename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(fullPath, buffer);

    const publicFilePath = `/assets/${destinationFolder}/${uniqueFilename}`;

    return NextResponse.json({ success: true, filePath: publicFilePath, originalName: file.name }, { status: 201 });

  } catch (error: any) {
    console.error('File upload error:', error);
    if (error.code === 'EACCES') {
        return NextResponse.json({ success: false, message: 'Permission denied to write file.' }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: error.message || 'File upload failed.' }, { status: 500 });
  }
}
