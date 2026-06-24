"use client";

import React, { useEffect, useRef } from 'react';

type Props = {
  commentCount: number;
  width?: number;
  height?: number;
  imageUrl?: string;
  baseOpacity?: number; // độ mờ nền cờ (0..1)
};

// Vẽ dần các pixel của lá cờ theo số lượng comment
export function FlagReveal({
  commentCount,
  width = 600,
  height = 360,
  imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/2/21/Flag_of_Vietnam.svg',
  baseOpacity = 0.28,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isCancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      if (isCancelled) return;
      // Vẽ nền cờ với độ mờ
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = baseOpacity;
      ctx.drawImage(img, 0, 0, width, height);
      ctx.globalAlpha = 1;

      // Vùng pixel cần vẽ rõ theo số comment
      const totalPixels = width * height; // 1 pixel = 1 đơn vị
      const revealPixels = Math.max(0, Math.min(commentCount, totalPixels));

      // Đọc ảnh vào buffer ẩn để lấy màu chính xác
      const off = document.createElement('canvas');
      off.width = width;
      off.height = height;
      const offCtx = off.getContext('2d');
      if (!offCtx) return;
      offCtx.drawImage(img, 0, 0, width, height);
      const imgData = offCtx.getImageData(0, 0, width, height);

      // Vẽ các pixel rõ nét tuần tự từ trái sang phải, trên xuống dưới
      const revealImageData = ctx.createImageData(width, height);
      const src = imgData.data;
      const dst = revealImageData.data;

      for (let i = 0; i < revealPixels; i++) {
        const idx = i * 4;
        dst[idx] = src[idx];
        dst[idx + 1] = src[idx + 1];
        dst[idx + 2] = src[idx + 2];
        dst[idx + 3] = 255; // opaque
      }

      // Phần còn lại giữ trong suốt (để thấy nền mờ bên dưới)
      ctx.putImageData(revealImageData, 0, 0);
    };

    return () => {
      isCancelled = true;
    };
  }, [commentCount, width, height, imageUrl, baseOpacity]);

  return (
    <div className="w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-xl shadow-2xl"
        aria-label="Quốc kỳ hiển thị theo số lượng bình luận"
      />
    </div>
  );
}




