'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './ImageCarousel.module.css';

export const ImageCarousel = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  // Function to get a random index different from the current one
  const getNextRandomIndex = (currentIndex: number, length: number) => {
    if (length <= 1) return 0;
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * length);
    } while (nextIndex === currentIndex);
    return nextIndex;
  };

  useEffect(() => {
    // Fetch the list of images when component mounts
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images');
        const data = await response.json();
        setImages(data.images);
        // Set initial random index
        setCurrentImageIndex(Math.floor(Math.random() * data.images.length));
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    if (images.length === 0) return;

    // Rotate through images randomly every 4 seconds
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex => getNextRandomIndex(prevIndex, images.length));
    }, 4000);

    return () => clearInterval(interval);
  }, [images]);

  if (images.length === 0) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.imageWrapper}>
        <Image
          src={`/api/images?file=${encodeURIComponent(images[currentImageIndex])}`}
          alt="Rotating Image"
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          priority
          style={{ objectFit: 'cover' }}
        />
      </div>
    </div>
  );
}; 