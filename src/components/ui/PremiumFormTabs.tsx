'use client';
import React from 'react';

import styles from './PremiumFormTabs.module.css';

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
    <div 
      className={styles.container}
      style={style}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`${styles.tabBtn} ${isActive ? styles.active : ''}`}
          >
            {tab.label}
            {tab.hasNotification && (
              <span className={styles.notification} />
            )}
          </button>
        );
      })}
    </div>
  );
}
