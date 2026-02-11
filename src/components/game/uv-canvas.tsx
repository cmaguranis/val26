import { useEffect, useRef } from 'react';
import type { BufferGeometry } from 'three';

interface UVCanvasProps {
  geometry: BufferGeometry;
  width?: number;
  height?: number;
  className?: string;
}

export function UVCanvas({
  geometry,
  width = 300,
  height = 300,
  className,
}: UVCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid background
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const p = (i / 10) * width;
      ctx.moveTo(p, 0);
      ctx.lineTo(p, height);
      const q = (i / 10) * height;
      ctx.moveTo(0, q);
      ctx.lineTo(width, q);
    }
    ctx.stroke();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const uvAttribute = geometry.attributes.uv;
    const indexAttribute = geometry.index;

    if (!uvAttribute) return;

    const drawLine = (u1: number, v1: number, u2: number, v2: number) => {
      const x1 = u1 * width;
      const y1 = (1 - v1) * height;
      const x2 = u2 * width;
      const y2 = (1 - v2) * height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    if (indexAttribute) {
      // Indexed geometry
      for (let i = 0; i < indexAttribute.count; i += 3) {
        const a = indexAttribute.getX(i);
        const b = indexAttribute.getX(i + 1);
        const c = indexAttribute.getX(i + 2);

        const u1 = uvAttribute.getX(a);
        const v1 = uvAttribute.getY(a);
        const u2 = uvAttribute.getX(b);
        const v2 = uvAttribute.getY(b);
        const u3 = uvAttribute.getX(c);
        const v3 = uvAttribute.getY(c);

        drawLine(u1, v1, u2, v2);
        drawLine(u2, v2, u3, v3);
        drawLine(u3, v3, u1, v1);
      }
    } else {
      // Non-indexed geometry
      for (let i = 0; i < uvAttribute.count; i += 3) {
        const u1 = uvAttribute.getX(i);
        const v1 = uvAttribute.getY(i);
        const u2 = uvAttribute.getX(i + 1);
        const v2 = uvAttribute.getY(i + 1);
        const u3 = uvAttribute.getX(i + 2);
        const v3 = uvAttribute.getY(i + 2);

        drawLine(u1, v1, u2, v2);
        drawLine(u2, v2, u3, v3);
        drawLine(u3, v3, u1, v1);
      }
    }
  }, [geometry, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ background: '#222', borderRadius: '8px' }}
    />
  );
}
