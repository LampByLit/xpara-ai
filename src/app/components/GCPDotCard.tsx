'use client';

import React, { useEffect, useRef } from 'react';
import styles from './GCPDotCard.module.css';

interface GCPDotCardProps {
  title: string;
}

export const GCPDotCard: React.FC<GCPDotCardProps> = ({ title }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Force iframe reload
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.dotContainer}>
        <iframe 
          ref={iframeRef}
          src="https://global-mind.org/gcpdot/gcp.html" 
          scrolling="no"
          frameBorder="0"
          className={styles.dot}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}; 