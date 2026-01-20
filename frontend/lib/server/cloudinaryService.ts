import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
// Cloudinary SDK automatically reads CLOUDINARY_URL from environment variables
// If not present, it will use individual credentials
if (!process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}
// If CLOUDINARY_URL is set, Cloudinary SDK will automatically use it

export interface UploadOptions {
  folder?: string;
  resource_type?: 'image' | 'raw' | 'video' | 'auto';
  transformation?: any[];
  public_id?: string;
  overwrite?: boolean;
}

export interface UploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
}

class CloudinaryService {
  /**
   * Upload a file buffer to Cloudinary
   */
  async uploadBuffer(
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'bbs',
          resource_type: options.resource_type || 'auto',
          transformation: options.transformation,
          public_id: options.public_id,
          overwrite: options.overwrite || false,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              url: result.url,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes,
            });
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Upload a file from a data URL (base64)
   */
  async uploadDataUrl(
    dataUrl: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    return cloudinary.uploader.upload(dataUrl, {
      folder: options.folder || 'bbs',
      resource_type: options.resource_type || 'auto',
      transformation: options.transformation,
      public_id: options.public_id,
      overwrite: options.overwrite || false,
    }) as Promise<UploadResult>;
  }

  /**
   * Upload an image with automatic optimization
   */
  async uploadImage(
    buffer: Buffer,
    folder: string = 'bbs/images',
    transformations?: any[]
  ): Promise<UploadResult> {
    return this.uploadBuffer(buffer, {
      folder,
      resource_type: 'image',
      transformation: [
        {
          quality: 'auto',
          fetch_format: 'auto',
          ...(transformations?.[0] || {}),
        },
        ...(transformations?.slice(1) || []),
      ],
    });
  }

  /**
   * Upload a profile picture with automatic cropping and optimization
   */
  async uploadProfilePicture(
    buffer: Buffer,
    userId: string,
    width: number = 400,
    height: number = 400
  ): Promise<UploadResult> {
    return this.uploadImage(buffer, 'bbs/profiles', [
      {
        width,
        height,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto',
        fetch_format: 'auto',
      },
    ]);
  }

  /**
   * Upload a service image (before/after)
   */
  async uploadServiceImage(
    buffer: Buffer,
    serviceId: string,
    type: 'before' | 'after',
    width?: number,
    height?: number
  ): Promise<UploadResult> {
    const transformations: any[] = [
      {
        quality: 'auto',
        fetch_format: 'auto',
      },
    ];

    if (width || height) {
      transformations[0].width = width;
      transformations[0].height = height;
      transformations[0].crop = 'limit';
    }

    return this.uploadImage(
      buffer,
      `bbs/services/${serviceId}`,
      transformations
    );
  }

  /**
   * Upload a document (PDF, etc.)
   */
  async uploadDocument(
    buffer: Buffer,
    folder: string = 'bbs/documents'
  ): Promise<UploadResult> {
    return this.uploadBuffer(buffer, {
      folder,
      resource_type: 'raw',
    });
  }

  /**
   * Delete an asset from Cloudinary
   */
  async deleteAsset(publicId: string): Promise<void> {
    return cloudinary.uploader.destroy(publicId);
  }

  /**
   * Generate a responsive image URL with transformations
   */
  getImageUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    } = {}
  ): string {
    return cloudinary.url(publicId, {
      width: options.width,
      height: options.height,
      crop: options.crop || 'limit',
      quality: options.quality || 'auto',
      fetch_format: options.format || 'auto',
      secure: true,
    });
  }

  /**
   * Generate a logo URL for emails
   */
  getLogoUrl(size: number = 200): string {
    const logoPublicId = process.env.CLOUDINARY_LOGO_PUBLIC_ID || 'bbs/logo';
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL?.match(/@([^.]+)/)?.[1] || 'dqigh6mt2';
    
    // If logo exists in Cloudinary, use it; otherwise fallback
    if (this.isConfigured()) {
      return cloudinary.url(logoPublicId, {
        width: size,
        height: size,
        crop: 'limit',
        quality: 'auto',
        fetch_format: 'auto',
        secure: true,
      });
    }
    
    // Fallback to local logo
    return `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/images/logo.png`;
  }

  /**
   * Check if Cloudinary is configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET)
    );
  }
}

export const cloudinaryService = new CloudinaryService();
