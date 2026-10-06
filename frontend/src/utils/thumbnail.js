/**
 * Video thumbnail extractor & fallback poster generator
 * Provides crisp, reliable thumbnail image frames from video files / URLs
 */

export async function extractVideoThumbnail(videoSource, seekTime = 0.5) {
  if (!videoSource) return '';

  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';

      let objectUrl = null;
      if (videoSource instanceof Blob || videoSource instanceof File) {
        objectUrl = URL.createObjectURL(videoSource);
        video.src = objectUrl;
      } else if (typeof videoSource === 'string') {
        video.src = videoSource;
      } else {
        return resolve('');
      }

      const cleanup = () => {
        if (objectUrl) {
          try { URL.revokeObjectURL(objectUrl); } catch (e) {}
        }
        video.remove();
      };

      const timer = setTimeout(() => {
        cleanup();
        resolve(getVideoPosterFallback('Video Preview', String(Date.now())));
      }, 6000);

      video.addEventListener('loadedmetadata', () => {
        const duration = video.duration || 1;
        // Grab frame at seekTime or 20% into video
        video.currentTime = Math.min(seekTime, duration * 0.25);
      });

      video.addEventListener('seeked', () => {
        try {
          const width = video.videoWidth || 640;
          const height = video.videoHeight || 360;
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(width, 720);
          canvas.height = Math.round((canvas.width / width) * height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            clearTimeout(timer);
            cleanup();
            return resolve(dataUrl);
          }
        } catch (err) {
          console.warn('Video frame capture failed (CORS or canvas error):', err);
        }
        clearTimeout(timer);
        cleanup();
        resolve(getVideoPosterFallback('Video Reel', String(Date.now())));
      });

      video.addEventListener('error', () => {
        clearTimeout(timer);
        cleanup();
        resolve(getVideoPosterFallback('Video Reel', String(Date.now())));
      });

      video.load();
    } catch (e) {
      resolve(getVideoPosterFallback('Video Reel', String(Date.now())));
    }
  });
}

/**
 * Generate a clean, modern video preview poster SVG data URI
 */
export function getVideoPosterFallback(title = 'Video Reel', id = '') {
  const gradients = [
    ['#1e293b', '#0f172a', '#E60023'],
    ['#2d3748', '#1a202c', '#ff4757'],
    ['#18181b', '#09090b', '#e11d48']
  ];
  const charCode = id ? id.charCodeAt(id.length - 1) % gradients.length : 0;
  const [stop1, stop2, accent] = gradients[charCode] || gradients[0];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${stop1}" />
        <stop offset="100%" stop-color="${stop2}" />
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accent}" />
        <stop offset="100%" stop-color="#ffffff" />
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#g)" rx="24"/>
    <circle cx="300" cy="270" r="54" fill="rgba(255,255,255,0.95)" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.3))"/>
    <polygon points="288,245 324,270 288,295" fill="${accent}"/>
    <text x="300" y="370" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" text-anchor="middle" letter-spacing="1.5">HYPERLEDGER VIDEO</text>
    <text x="300" y="405" fill="#94a3b8" font-family="monospace" font-size="13" text-anchor="middle">VERIFIED KEYFRAME PREVIEW</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
