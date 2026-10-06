/**
 * Video thumbnail extractor & fallback poster generator
 * Provides crisp, reliable thumbnail image frames from video files / URLs
 * Tailored for iOS Safari, WebKit, and desktop browsers.
 */

export async function extractVideoThumbnail(videoSource, seekTime = 0.5) {
  if (!videoSource) return '';

  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.preload = 'auto';

      let objectUrl = null;
      if (videoSource instanceof Blob || videoSource instanceof File) {
        objectUrl = URL.createObjectURL(videoSource);
        video.src = objectUrl;
      } else if (typeof videoSource === 'string') {
        video.src = videoSource;
      } else {
        return resolve('');
      }

      let resolved = false;

      const cleanup = () => {
        if (objectUrl) {
          try { URL.revokeObjectURL(objectUrl); } catch (e) {}
        }
        video.remove();
      };

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(getVideoPosterFallback('Reels Video', String(Date.now())));
        }
      }, 5000);

      const captureFrame = () => {
        if (resolved) return;
        try {
          const width = video.videoWidth || 640;
          const height = video.videoHeight || 360;
          if (width > 0 && height > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(width, 720);
            canvas.height = Math.round((canvas.width / width) * height);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
              resolved = true;
              clearTimeout(timer);
              cleanup();
              return resolve(dataUrl);
            }
          }
        } catch (err) {
          console.warn('Video frame capture failed (CORS or canvas error):', err);
        }
      };

      video.addEventListener('loadedmetadata', () => {
        const duration = video.duration || 1;
        video.currentTime = Math.min(seekTime, duration * 0.2);
      });

      video.addEventListener('seeked', () => {
        captureFrame();
      });

      video.addEventListener('canplay', () => {
        if (!resolved) {
          captureFrame();
        }
      });

      video.addEventListener('error', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          cleanup();
          resolve(getVideoPosterFallback('Reels Video', String(Date.now())));
        }
      });

      video.load();
    } catch (e) {
      resolve(getVideoPosterFallback('Reels Video', String(Date.now())));
    }
  });
}

/**
 * Generate a clean, modern iOS Instagram-style video preview poster SVG data URI
 */
export function getVideoPosterFallback(title = 'Reel', id = '') {
  const gradients = [
    ['#1a1a1a', '#000000', '#0095F6'],
    ['#262626', '#121212', '#E1306C'],
    ['#1f1f1f', '#0d0d0d', '#5851DB'],
    ['#2c3437', '#151b1e', '#405DE6']
  ];
  const charCode = id ? id.charCodeAt(id.length - 1) % gradients.length : 0;
  const [stop1, stop2, accent] = gradients[charCode] || gradients[0];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${stop1}" />
        <stop offset="100%" stop-color="${stop2}" />
      </linearGradient>
      <linearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f09433" />
        <stop offset="25%" stop-color="#e6683c" />
        <stop offset="50%" stop-color="#dc2743" />
        <stop offset="75%" stop-color="#cc2366" />
        <stop offset="100%" stop-color="#bc1888" />
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#bg)" rx="0"/>
    <circle cx="300" cy="270" r="48" fill="rgba(255,255,255,0.92)" filter="drop-shadow(0 6px 14px rgba(0,0,0,0.35))"/>
    <polygon points="292,250 320,270 292,290" fill="#262626"/>
    <text x="300" y="365" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" font-size="19" font-weight="700" text-anchor="middle" letter-spacing="1">HYPERLEDGER REEL</text>
    <text x="300" y="398" fill="#a8a8a8" font-family="monospace" font-size="12" text-anchor="middle">VERIFIED KEYFRAME PREVIEW</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
