'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { CameraOff } from 'lucide-react';

interface ImageWithFallbackProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  fallbackText?: string;
  containerClassName?: string;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  fallbackText = 'Imagen no disponible',
  containerClassName = '',
  ...props 
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  // Si no hay src, o si hubo error al cargar, mostramos el fallback estético
  if (!src || error) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 border border-slate-200 ${containerClassName}`}
        style={{ width: props.width || '100%', height: props.height || '100%', minHeight: '120px' }}
      >
        <CameraOff className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-xs font-medium px-2 text-center">{fallbackText}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      <Image
        src={src}
        alt={alt || fallbackText}
        onError={() => setError(true)}
        {...props}
      />
    </div>
  );
}
