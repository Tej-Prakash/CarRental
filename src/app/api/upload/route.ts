
// /src/app/api/upload/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs/promises'; // Using promises API for fs
import path from 'path';

// Disable Next.js body parsing for this route, as formidable will handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

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

    const form = formidable({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // Convert MB to bytes
      filter: function ({ name, originalFilename, mimetype }) {
        // Keep only images
        const isValidType = mimetype && ALLOWED_MIME_TYPES.includes(mimetype);
        if (!isValidType) {
          console.warn(`Upload rejected: Invalid file type - ${mimetype} for ${originalFilename}`);
          // To reject a file, return false. But formidable v3 needs a bit more care here.
          // We'll check this again after parsing.
        }
        return isValidType; // This filter helps, but we also check after parse
      },
      filename: (name, ext, part, form) => {
        const originalFilename = part.originalFilename || 'untitled';
        // Sanitize filename: replace non-alphanumeric chars (except dot and hyphen) with underscore
        const sanitizedOriginalName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
        return `${Date.now()}-${sanitizedOriginalName}`;
      }
    });

    const [fields, files] = await form.parse(req as any); // Need `as any` due to NextRequest vs IncomingMessage incompatibility

    const uploadedFile = files.file?.[0]; // Assuming the file input field name is 'file'

    if (!uploadedFile) {
      return NextResponse.json({ success: false, message: 'No file uploaded or field name is not "file".' }, { status: 400 });
    }

    // Double check mimetype after formidable has processed it
    if (!uploadedFile.mimetype || !ALLOWED_MIME_TYPES.includes(uploadedFile.mimetype)) {
       // If an invalid file type got through, delete it
      await fs.unlink(uploadedFile.filepath);
      return NextResponse.json({ success: false, message: `Invalid file type: ${uploadedFile.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` }, { status: 400 });
    }
    

    const publicFilePath = `/assets/images/${uploadedFile.newFilename}`;

    return NextResponse.json({ success: true, filePath: publicFilePath, originalName: uploadedFile.originalFilename }, { status: 201 });

  } catch (error: any) {
    console.error('File upload error:', error);
    if (error.message.includes('maxFileSize exceeded')) {
      return NextResponse.json({ success: false, message: `File is too large. Max size: ${MAX_FILE_SIZE_MB}MB` }, { status: 413 });
    }
    return NextResponse.json({ success: false, message: error.message || 'File upload failed.' }, { status: 500 });
  }
}
