'use client';

import React from 'react';

interface YoutubePlayerProps {
  url?: string;
  videoId?: string;
  title?: string;
}

/**
 * Parses different formats of YouTube URLs to extract the 11-character video ID.
 * Supports standard URLs, shorts, embed URLs, and shared mobile links.
 */
export function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  
  // If it's already a direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = cleanUrl.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function YoutubePlayer({ url, videoId, title = 'Reproductor de video YouTube' }: YoutubePlayerProps) {
  const finalId = videoId || (url ? extractYoutubeId(url) : null);

  if (!finalId) {
    return (
      <div 
        style={{
          padding: '20px',
          background: '#f8fafc',
          border: '2px dashed #e2e8f0',
          borderRadius: '16px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.9rem',
          margin: '16px 0'
        }}
      >
        ⚠️ Enlace de YouTube no válido
      </div>
    );
  }

  // Use GDPR-compliant youtube-nocookie.com domain now that next.config.ts COEP restrictions have been removed
  const embedUrl = `https://www.youtube-nocookie.com/embed/${finalId}?rel=0&modestbranding=1&playsinline=1`;

  return (
    <div 
      className="youtube-player-container"
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%', // 16:9 Aspect Ratio
        height: 0,
        overflow: 'hidden',
        borderRadius: '16px',
        boxShadow: '0 10px 30px -5px rgba(0,0,0,0.06), 0 4px 12px -2px rgba(0,0,0,0.04)',
        backgroundColor: '#0f172a',
        margin: '24px 0',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        transition: 'transform 0.25s ease'
      }}
    >
      <iframe
        src={embedUrl}
        title={title}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 0,
          borderRadius: '16px'
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
