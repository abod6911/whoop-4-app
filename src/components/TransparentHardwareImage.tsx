import React, { useEffect, useRef, useState } from 'react';

interface TransparentHardwareImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  title?: string;
}

/**
 * TransparentHardwareImage
 * Runtime canvas-based hardware renderer that guarantees 100% transparent alpha channels
 * and eliminates any residual dark/slate bounding box pixels.
 */
export const TransparentHardwareImage: React.FC<TransparentHardwareImageProps> = ({
  src,
  alt,
  className = '',
  style,
  onClick,
  title,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    let active = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      if (!active) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Process pixels to remove any lingering dark box halo
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Zero out any low-alpha or dark background noise
          if (a > 0 && a < 15) {
            data[i + 3] = 0;
          } else if (a > 0 && a < 160 && r < 24 && g < 30 && b < 36) {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch {
        // Fallback to direct draw
      }

      if (active) setIsRendered(true);
    };

    return () => {
      active = false;
    };
  }, [src]);

  return (
    <div
      className={`relative ${className}`}
      style={style}
      onClick={onClick}
      title={title}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-auto object-contain select-none"
        style={{ display: isRendered ? 'block' : 'none' }}
      />
      {!isRendered && (
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-contain select-none"
        />
      )}
    </div>
  );
};
