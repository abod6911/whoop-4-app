/**
 * Dynamic App Icon Generator for WHOOP 4.0
 * Renders the exact official WHOOP black squircle + white circle "W" monogram
 * onto an offscreen HTML5 <canvas> (512x512 and 180x180) on startup and injects
 * the resulting high-res PNG data URLs into <link rel="apple-touch-icon">,
 * <link rel="icon">, and PWA Web Manifest.
 */

export function generateWhoopIconDataUrl(size: number = 512): string {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const scale = size / 100;

  // 1. Clear background
  ctx.clearRect(0, 0, size, size);

  // 2. Pitch-black iOS squircle container
  const r = 22 * scale;
  const x = 2 * scale;
  const y = 2 * scale;
  const w = 96 * scale;
  const h = 96 * scale;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();

  ctx.fillStyle = '#000000';
  ctx.fill();

  // Subtle studio rim highlight
  ctx.lineWidth = 1.5 * scale;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.stroke();

  // 3. Crisp white circular ring
  ctx.beginPath();
  ctx.arc(50 * scale, 50 * scale, 33 * scale, 0, Math.PI * 2);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 5.5 * scale;
  ctx.stroke();

  // 4. Center "W" Monogram
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 6 * scale;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  // Stroke 1: Left downward diagonal (disconnected at bottom)
  ctx.beginPath();
  ctx.moveTo(32 * scale, 34 * scale);
  ctx.lineTo(40 * scale, 50 * scale);
  ctx.stroke();

  // Stroke 2: Long upward diagonal slash (bottom-left to top-center)
  ctx.beginPath();
  ctx.moveTo(35 * scale, 66 * scale);
  ctx.lineTo(51 * scale, 34 * scale);
  ctx.stroke();

  // Stroke 3: Right connected V
  ctx.beginPath();
  ctx.moveTo(46 * scale, 44 * scale);
  ctx.lineTo(58 * scale, 66 * scale);
  ctx.lineTo(68 * scale, 34 * scale);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

/**
 * Initializes the official WHOOP icons in the browser DOM
 */
export function initializeAppIcons(): void {
  if (typeof document === 'undefined') return;

  try {
    const icon180 = generateWhoopIconDataUrl(180);
    const icon512 = generateWhoopIconDataUrl(512);

    // Update <link rel="apple-touch-icon">
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = icon180;

    // Update <link rel="icon">
    let favIcon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (!favIcon) {
      favIcon = document.createElement('link');
      favIcon.rel = 'icon';
      document.head.appendChild(favIcon);
    }
    favIcon.href = icon180;
    favIcon.type = 'image/png';

    // Provide dynamic manifest if needed
    const manifestBlob = new Blob(
      [
        JSON.stringify({
          name: 'WHOOP 4.0',
          short_name: 'WHOOP',
          description: 'Official WHOOP 4.0 Local Web Bluetooth App with real biometric telemetry.',
          start_url: window.location.pathname || './',
          display: 'standalone',
          background_color: '#000000',
          theme_color: '#000000',
          icons: [
            {
              src: icon180,
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: icon512,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        }),
      ],
      { type: 'application/json' }
    );

    const manifestUrl = URL.createObjectURL(manifestBlob);
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestUrl;
  } catch (err) {
    console.warn('Failed to dynamically generate app icons:', err);
  }
}
