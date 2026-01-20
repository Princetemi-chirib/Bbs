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
            message: 'Image upload service is not configured. Please configure Cloudinary.',
          },
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'bbs/images';
    const type = (formData.get('type') as string) || 'general'; // general, profile, service

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: 'No file uploaded' } },
        { status: 400 }
      );
    }

    // Validate file type (only images)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { message: 'Only image files (JPG, PNG, WebP, GIF) are allowed' } },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { message: 'File size must be less than 5MB' } },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload based on type
    let result;
    switch (type) {
      case 'profile':
        const userId = formData.get('userId') as string;
        result = await cloudinaryService.uploadProfilePicture(buffer, userId || 'temp');
        break;
      case 'service':
        const serviceId = formData.get('serviceId') as string;
        const imageType = (formData.get('imageType') as 'before' | 'after') || 'before';
        result = await cloudinaryService.uploadServiceImage(
          buffer,
          serviceId || 'temp',
          imageType
        );
        break;
      default:
        result = await cloudinaryService.uploadImage(buffer, folder);
    }

    return NextResponse.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to upload image',
        },
      },
      { status: 500 }
    );
  }
}
