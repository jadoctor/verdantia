'use client';
import React from 'react';

interface PremiumSubheaderProps {
  title: React.ReactNode;
  gradient?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  isMobile?: boolean;
}

export default function PremiumSubheader({
  title,
  gradient = 'linear-gradient(135deg, #0f766e, #10b981)',
  actions,
  children,
  isMobile = false
}: PremiumSubheaderProps) {
  return (
    <div style={{
      background: gradient,
      borderRadius: '16px',
      padding: isMobile ? '16px 20px' : '24px 28px',
      marginBottom: '24px',
      color: 'white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '16px' : '24px',
        flexWrap: 'wrap'
      }}>
        {/* Left Block: Title & Subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: isMobile ? '1.3rem' : '1.6rem', 
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {title}
          </h1>
        </div>

        {/* Right Block: Actions */}
        {actions && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            alignItems: 'center',
            justifyContent: isMobile ? 'center' : 'flex-end',
            width: isMobile ? '100%' : 'auto'
          }}>
            {actions}
          </div>
        )}
      </div>

      {/* Optional bottom area (e.g. for FilterTabs or additional elements) */}
      {children && (
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          {children}
        </div>
      )}
    </div>
  );
}
