/**
 * Camera and File Upload Service
 * Handles camera, gallery, and file picker for all platforms
 */

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { nativePlatform } from './nativePlatform';

export interface CameraOptions {
  source?: CameraSource;
  resultType?: CameraResultType;
  quality?: number;
  width?: number;
  height?: number;
  correctOrientation?: boolean;
}

export interface ImageData {
  data: string | Blob;
  mimeType: string;
  width?: number;
  height?: number;
  fileName?: string;
}

export class CameraAndUploadService {
  private static instance: CameraAndUploadService;

  private constructor() {}

  static getInstance(): CameraAndUploadService {
    if (!CameraAndUploadService.instance) {
      CameraAndUploadService.instance = new CameraAndUploadService();
    }
    return CameraAndUploadService.instance;
  }

  /**
   * Take photo from camera
   */
  async takeCameraPhoto(options?: Partial<CameraOptions>): Promise<ImageData> {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        ...options,
      });

      return {
        data: photo.dataUrl as string,
        mimeType: photo.format === 'jpeg' ? 'image/jpeg' : 'image/png',
        width: photo.width,
        height: photo.height,
      };
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        throw new Error(`Camera error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Pick photo from gallery
   */
  async pickFromGallery(options?: Partial<CameraOptions>): Promise<ImageData> {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        ...options,
      });

      return {
        data: photo.dataUrl as string,
        mimeType: photo.format === 'jpeg' ? 'image/jpeg' : 'image/png',
        width: photo.width,
        height: photo.height,
      };
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        throw new Error(`Gallery error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Pick file (works on web and native)
   */
  async pickFile(acceptedTypes?: string[]): Promise<ImageData> {
    if (nativePlatform.isWeb()) {
      return await this.pickFileWeb(acceptedTypes);
    }

    // On native, use gallery picker for images
    return await this.pickFromGallery();
  }

  /**
   * Web file picker
   */
  private pickFileWeb(acceptedTypes?: string[]): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = acceptedTypes?.join(',') || 'image/*';

      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            data: reader.result as string,
            mimeType: file.type,
            fileName: file.name,
          });
        };
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
      };

      input.onerror = () => {
        reject(new Error('File picker cancelled'));
      };

      input.click();
    });
  }

  /**
   * Convert base64 to Blob
   */
  base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64.split(',')[1] || base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Validate image file
   */
  validateImage(
    imageData: ImageData,
    maxSizeInMB: number = 5
  ): { valid: boolean; error?: string } {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    // Check MIME type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageData.mimeType)) {
      return {
        valid: false,
        error: 'Invalid image format. Please use JPEG, PNG, or WebP.',
      };
    }

    // Check size (rough estimate from base64)
    if (typeof imageData.data === 'string') {
      const sizeInBytes = (imageData.data.length * 3) / 4;
      if (sizeInBytes > maxSizeInBytes) {
        return {
          valid: false,
          error: `Image too large. Maximum size is ${maxSizeInMB}MB.`,
        };
      }
    }

    return { valid: true };
  }
}

export const cameraAndUpload = CameraAndUploadService.getInstance();
