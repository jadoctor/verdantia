'use client';
import React from 'react';
import styles from './PremiumSubheader.module.css';

interface PremiumSubheaderProps {
  title: React.ReactNode;
  gradient?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  /** @deprecated isMobile is no longer needed. Responsiveness is handled 100% via CSS Container Queries */
  isMobile?: boolean;
}

export default function PremiumSubheader({
  title,
  gradient = 'linear-gradient(135deg, #0f766e, #10b981)',
  actions,
  children,
  // isMobile se ignora pacíficamente si se recibe
}: PremiumSubheaderProps) {
  return (
    <div className={styles.container}>
      <div 
        className={styles.wrapper}
        style={{ background: gradient }}
      >
        <div className={styles.row}>
          {/* Left Block: Title */}
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>
              {title}
            </h1>
          </div>

          {/* Right Block: Actions */}
          {actions && (
            <div className={styles.actionsBlock}>
              {actions}
            </div>
          )}
        </div>

        {/* Optional bottom area (e.g. for FilterTabs, DevInsights, etc) */}
        {children && (
          <div className={styles.childrenArea}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
