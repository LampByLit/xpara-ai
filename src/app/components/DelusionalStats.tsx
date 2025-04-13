'use client';

import { useEffect, useState } from 'react';
import styles from './ArticleCard.module.css';

interface DelusionalStats {
  level: 'low' | 'medium' | 'high' | 'extreme';
  percentage: number;
  trend: {
    direction: 'up' | 'down' | 'stable';
    amount: number;
  };
}

export const DelusionalStats = () => {
  const [stats, setStats] = useState<DelusionalStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/delusional-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className={styles.statsContainer}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'left' }}>Schizophrenia Per Post</h2>
        <div className={styles.loading}>Loading stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.statsContainer}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'left' }}>Schizophrenia Per Post</h2>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.statsContainer}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'left' }}>Schizophrenia Per Post</h2>
        <div className={styles.error}>No stats available</div>
      </div>
    );
  }

  const { level, percentage, trend } = stats;
  const trendSymbol = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '↑';
  const trendColor = trend.direction === 'up' ? '#ff4444' : trend.direction === 'down' ? '#44ff44' : '#ffffff';

  return (
    <div className={styles.statsContainer}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'left' }}>Schizophrenia Per Post</h2>
      <div className={styles.statsContent}>
        <div className={styles.mainStat}>
          <div style={{ fontSize: '4rem', lineHeight: '1', fontWeight: 'bold' }}>
            {percentage.toFixed(1)}% <span style={{ fontSize: '1rem' }}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
          </div>
        </div>
        <div className={styles.trendStat} style={{ color: trendColor }}>
          {trendSymbol} {trend.amount.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}; 