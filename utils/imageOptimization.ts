/**
 * Image optimization utilities
 * Compresses and resizes images before upload to improve performance
 */

/**
 * Compress and resize an image file
 * @param file - The original image file
 * @param maxWidth - Maximum width (default: 1920)
 * @param maxHeight - Maximum height (default: 1920)
 * @param quality - JPEG quality 0-1 (default: 0.85)
 * @returns Promise<File> - Compressed image file
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Create new File with compressed data
            const compressedFile = new File(
              [blob],
              file.name,
              {
                type: 'image/jpeg', // Always convert to JPEG for better compression
                lastModified: Date.now(),
              }
            );
            
            console.log(`📦 Compressed image: ${(file.size / 1024).toFixed(2)} KB → ${(compressedFile.size / 1024).toFixed(2)} KB (${((1 - compressedFile.size / file.size) * 100).toFixed(1)}% reduction)`);
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a thumbnail version of an image
 * @param file - The original image file
 * @param maxSize - Maximum width/height for thumbnail (default: 400)
 * @returns Promise<string> - Data URL of thumbnail
 */
export async function generateThumbnail(
  file: File,
  maxSize: number = 400
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate thumbnail dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Return as data URL
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Check if file is an image and if it needs compression
 * @param file - File to check
 * @returns boolean - True if file is an image that should be compressed
 */
export function shouldCompressImage(file: File): boolean {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!imageTypes.includes(file.type)) {
    return false;
  }
  
  // Compress if file is larger than 500KB
  return file.size > 500 * 1024;
}

