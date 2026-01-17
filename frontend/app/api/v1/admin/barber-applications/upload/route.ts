import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: 'No file uploaded' } },
        { status: 400 }
      );
    }

    // Validate file type (PDF or JPG/JPEG)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { message: 'Only PDF and JPG files are allowed' } },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { message: 'File size must be less than 10MB' } },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || (file.type === 'application/pdf' ? 'pdf' : 'jpg');
    const filename = `barber-app-${timestamp}-${randomStr}.${fileExtension}`;

    // For Vercel/serverless: save to /tmp directory or use cloud storage
    // For local development: save to public/uploads
    const uploadDir = process.env.NODE_ENV === 'production' 
      ? '/tmp/uploads' 
      : join(process.cwd(), 'public', 'uploads', 'applications');
    
    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filepath = join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filepath, buffer);

    // Return the public URL
    // In production, you'd upload to cloud storage (S3, Cloudinary, etc.)
    const publicUrl = process.env.NODE_ENV === 'production'
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/uploads/applications/${filename}`
      : `/uploads/applications/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename: filename,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to upload file',
        },
      },
      { status: 500 }
    );
  }
}
