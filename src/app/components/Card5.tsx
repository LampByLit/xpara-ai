'use client';

import React from 'react';
import styles from './Card5.module.css';
import StagePost from './StagePost';

export default function Card5() {
  return (
    <div className={styles.container}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Key Insights</h2>
      <div className={styles.content}>
        <StagePost position="top" cardType="insights" />
        <StagePost position="middle" cardType="insights" />
        <StagePost position="bottom" cardType="insights" />
      </div>
    </div>
  );
} 