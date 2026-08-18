import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface BrandAssets {
  colorLogoPng?: string | null;
  whiteLogoPng?: string | null;
  blackLogoPng?: string | null;
  faviconPng?: string | null;
  updatedAt?: string;
  updatedBy?: string;
}

const BRAND_DOC_PATH = 'system/brand_assets';
const LOCAL_STORAGE_KEY = 'asg_brand_assets_cache_v1';

// In-memory cache for instant synchronous access
let cachedAssets: BrandAssets = {
  colorLogoPng: null,
  whiteLogoPng: null,
  blackLogoPng: null,
  faviconPng: null
};

// Load initial from local storage if available
try {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    cachedAssets = { ...cachedAssets, ...JSON.parse(saved) };
    applyFavicon(cachedAssets.faviconPng || cachedAssets.colorLogoPng);
  }
} catch (e) {
  // Ignore local storage error
}

export function getCachedBrandAssets(): BrandAssets {
  return cachedAssets;
}

export function applyFavicon(pngDataUrl?: string | null) {
  if (typeof document === 'undefined') return;

  const iconHref = pngDataUrl || '/favicon.svg';
  
  // Find or create favicon link
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  
  if (pngDataUrl) {
    link.type = 'image/png';
  } else {
    link.type = 'image/svg+xml';
  }
  link.href = iconHref;

  // Also update apple-touch-icon
  let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
  if (appleLink) {
    appleLink.href = iconHref;
  }
}

export function subscribeToBrandAssets(callback: (assets: BrandAssets) => void): () => void {
  // Initial callback with cache
  callback(cachedAssets);

  try {
    const docRef = doc(db, 'system', 'brand_assets');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as BrandAssets;
        cachedAssets = {
          colorLogoPng: data.colorLogoPng ?? null,
          whiteLogoPng: data.whiteLogoPng ?? null,
          blackLogoPng: data.blackLogoPng ?? null,
          faviconPng: data.faviconPng ?? null,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        };
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cachedAssets));
        } catch (e) {}

        applyFavicon(cachedAssets.faviconPng || cachedAssets.colorLogoPng);
        callback(cachedAssets);
      }
    }, (error) => {
      console.warn('Brand assets listener warning:', error);
    });

    return unsubscribe;
  } catch (err) {
    console.error('Error subscribing to brand assets:', err);
    return () => {};
  }
}

export async function updateBrandAsset(
  variant: 'colorLogoPng' | 'whiteLogoPng' | 'blackLogoPng' | 'faviconPng',
  pngDataUrl: string | null,
  userEmail?: string
): Promise<void> {
  const docRef = doc(db, 'system', 'brand_assets');
  const updateData: Partial<BrandAssets> = {
    [variant]: pngDataUrl,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail || 'Administrator'
  };

  // If updating color logo and favicon is not custom set, optionally update favicon
  if (variant === 'colorLogoPng' && !cachedAssets.faviconPng) {
    applyFavicon(pngDataUrl);
  } else if (variant === 'faviconPng') {
    applyFavicon(pngDataUrl || cachedAssets.colorLogoPng);
  }

  await setDoc(docRef, updateData, { merge: true });

  cachedAssets = {
    ...cachedAssets,
    ...updateData
  };
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cachedAssets));
  } catch (e) {}
}

export function processPngFile(file: File, maxDimension = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    // Strict PNG verification
    if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
      return reject(new Error('Only PNG image files (.png) are supported for logo uploads.'));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize down if too large to ensure fast loading & firestore limit compliance
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
          return resolve(event.target?.result as string);
        }

        // Draw image cleanly
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Export as PNG
        const pngBase64 = canvas.toDataURL('image/png');
        resolve(pngBase64);
      };
      img.onerror = () => reject(new Error('Failed to parse PNG image.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}
