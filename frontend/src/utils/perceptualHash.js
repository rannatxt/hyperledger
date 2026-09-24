/* Client-side Perceptual Hashing using HTML5 Canvas & dHash/blockhash */

/**
 * 64-bit difference hash (dHash) computed in browser
 * 9x8 pixel canvas -> 8x8 comparison grid = 64 bits = 16 hex chars
 */
export async function computeClientPerceptualHash(imageSource) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const width = 9;
        const height = 8;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height).data;

        // Convert to grayscale luminance
        const gray = [];
        for (let i = 0; i < imgData.length; i += 4) {
          const luma = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
          gray.push(luma);
        }

        // 1. Normal dHash (left pixel > right pixel)
        let bits = '';
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const left = gray[y * 9 + x];
            const right = gray[y * 9 + (x + 1)];
            bits += left > right ? '1' : '0';
          }
        }

        // 2. Horizontally reversed (flipped) dHash
        let flippedBits = '';
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            // Horizontal mirror: read from right to left
            const leftFlipped = gray[y * 9 + (8 - x)];
            const rightFlipped = gray[y * 9 + (8 - (x + 1))];
            flippedBits += leftFlipped > rightFlipped ? '1' : '0';
          }
        }

        const pHash = binaryToHex(bits);
        const pHashReversed = binaryToHex(flippedBits);

        resolve({ pHash, pHashReversed });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => reject(new Error('Failed to load image for perceptual fingerprinting'));

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof Blob || imageSource instanceof File) {
      img.src = URL.createObjectURL(imageSource);
    } else {
      reject(new Error('Invalid image source'));
    }
  });
}

function binaryToHex(binaryStr) {
  let hex = '';
  for (let i = 0; i < binaryStr.length; i += 4) {
    const chunk = binaryStr.slice(i, i + 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex.padStart(16, '0');
}

/**
 * Compute Hamming distance between two hex hash strings
 */
export function computeHammingDistance(hexA, hexB) {
  if (!hexA || !hexB) return 64;
  const a = hexA.trim().toLowerCase();
  const b = hexB.trim().toLowerCase();
  const len = Math.min(a.length, b.length);
  let dist = 0;

  for (let i = 0; i < len; i++) {
    let xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (xor > 0) {
      dist += (xor & 1);
      xor >>= 1;
    }
  }
  dist += Math.abs(a.length - b.length) * 4;
  return dist;
}

/**
 * Normalized similarity percentage (0% to 100%)
 */
export function computeSimilarityPercent(hexA, hexB) {
  const dist = computeHammingDistance(hexA, hexB);
  const score = Math.max(0, 1 - (dist / 64));
  return Math.round(score * 100);
}
