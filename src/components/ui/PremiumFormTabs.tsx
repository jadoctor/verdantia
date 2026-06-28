'use client';
import React from 'react';

export interface FormTab {
  id: string;
  label: React.ReactNode;
  hasNotification?: boolean;
}

interface PremiumFormTabsProps {
  tabs: FormTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  style?: React.CSSProperties;
}

export default function PremiumFormTabs({
  tabs,
  activeTab,
  onTabChange,
  style
}: PremiumFormTabsProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      paddingBottom: '12px',
      marginBottom: '24px',
      borderBottom: '1px solid #e2e8f0',
      scrollbarWidth: 'none',
      WebkitOverflowScrolling: 'touch',
      ...style
    }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            style={{
              position: 'relative',
              padding: '10px 16px',
              border: 'none',
              background: isActive ? '#f8fafc' : 'transparent',
              color: isActive ? '#0f766e' : '#64748b',
              fontWeight: isActive ? 'bold' : '500',
              fontSize: '0.9rem',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              borderBottom: isActive ? '3px solid #0f766e' : '3px solid transparent'
            }}
            onMouseOver={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = '#334155';
                e.currentTarget.style.background = '#f1f5f9';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {tab.label}
            {tab.hasNotification && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#8b5cf6',
                boxShadow: '0 0 0 2px white'
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
