'use client';

import React, { useEffect, useState } from 'react';
import styles from './BigPictureArticle.module.css';

interface BigPictureData {
  overview: {
    article: string;
    generatedAt: number;
  };
}

function processQuotes(text: string): React.ReactNode[] {
  const segments = text.split(/(".*?")/g);
  return segments.map((segment, index) => {
    if (segment.startsWith('"') && segment.endsWith('"')) {
      return <span key={index} className={styles.quote}>{segment}</span>;
    }
    return segment;
  });
}

export default function BigPictureArticle() {
  const [article, setArticle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch('/api/analysis/big-picture');
        if (!response.ok) {
          throw new Error('Failed to fetch article data');
        }
        const data: BigPictureData = await response.json();
        setArticle(data.overview.article);
      } catch (error) {
        console.error('Error fetching article:', error);
        setError('Failed to load article');
      }
    };

    fetchArticle();
  }, []);

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!article) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Split paragraphs and render them with proper spacing
  const paragraphs = article.split('\n\n');

  return (
    <div className={styles.container}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={styles.paragraph}>
          {processQuotes(paragraph)}
        </p>
      ))}
    </div>
  );
} 