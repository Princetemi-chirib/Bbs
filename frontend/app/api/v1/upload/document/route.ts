import { NextRequest, NextResponse } from 'next/server';
import { cloudinaryService } from '@/lib/server/cloudinaryService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if Cloudinary is configured
    if (!cloudinaryService.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Document upload service is not configured. Please configure Cloudinary.',
          },
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'bbs/documents';

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: 'No file uploaded' } },
        { status: 400 }
      );
    }

    // Validate file type (PDF or images)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { message: 'Only PDF and image files (JPG, PNG) are allowed' } },
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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload document
    const result = await cloudinaryService.uploadDocument(buffer, folder);

    return NextResponse.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        bytes: result.bytes,
      },
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to upload document',
        },
      },
      { status: 500 }
    );
  }
}
