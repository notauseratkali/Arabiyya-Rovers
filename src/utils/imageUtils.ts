/**
 * Utility functions for handling, compressing, and formatting images in notes.
 */

export interface InsertImageOptions {
  src: string;
  alt?: string;
  caption?: string;
  placement: 'center' | 'left' | 'right' | 'full';
  size: 'small' | 'medium' | 'large' | 'full';
}

/**
 * Compresses an image file client-side using HTML5 Canvas to ensure 
 * fast rendering and efficient Firestore storage (staying well within limits).
 */
export async function compressImageFile(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's an SVG, read directly as data URL without rasterizing
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original data URL if canvas context unavailable
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for high compression, fallback to JPEG
        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };

      img.onerror = (e) => reject(new Error('Failed to load image file for processing.'));
      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Generates semantic HTML figure/img markup with custom placement and styling.
 */
export function generateImageMarkup(options: InsertImageOptions): string {
  const { src, alt = 'Rover Note Photo', caption, placement, size } = options;

  let widthStyle = '100%';
  if (size === 'small') widthStyle = '280px';
  else if (size === 'medium') widthStyle = '460px';
  else if (size === 'large') widthStyle = '680px';
  else if (size === 'full') widthStyle = '100%';

  let containerStyle = '';
  let imgStyle = `width: 100%; max-width: ${widthStyle}; height: auto; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.08); display: block; object-fit: cover;`;

  if (placement === 'left') {
    containerStyle = `float: left; margin: 8px 20px 14px 0; max-width: ${size === 'full' ? '50%' : widthStyle}; clear: left;`;
  } else if (placement === 'right') {
    containerStyle = `float: right; margin: 8px 0 14px 20px; max-width: ${size === 'full' ? '50%' : widthStyle}; clear: right;`;
  } else {
    // center or full
    containerStyle = `display: block; margin: 18px auto; max-width: ${widthStyle}; clear: both; text-align: center;`;
    imgStyle += ' margin: 0 auto;';
  }

  const cleanCaption = caption ? caption.trim() : '';

  const figureHTML = `
    <figure class="note-image-container note-img-${placement}" style="${containerStyle}" contenteditable="false">
      <img src="${src}" alt="${alt.replace(/"/g, '&quot;')}" style="${imgStyle}" loading="lazy" />
      ${cleanCaption ? `<figcaption style="margin-top: 6px; font-size: 0.8rem; color: #64748b; font-style: italic; text-align: center; line-height: 1.4;">${cleanCaption}</figcaption>` : ''}
    </figure>
    <p><br></p>
  `;

  return figureHTML;
}
