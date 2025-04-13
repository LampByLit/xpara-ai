'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Header.module.css';

export const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className={styles.header}>
      <Link href="https://lampbylit.com" target="_blank" rel="noopener noreferrer">
        <Image
          src="/logo.png"
          alt="Logo"
          width={120}
          height={40}
          priority
          className={styles.logo}
        />
      </Link>

      <div className={styles.dropdownContainer}>
        <button 
          className={styles.dropdownButton}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-expanded={isDropdownOpen}
        >
          /x/ ▾
        </button>
        {isDropdownOpen && (
          <div className={styles.dropdown}>
            <a 
              href="https://xpara-ai-production.up.railway.app/"
              className={styles.dropdownItem}
            >
              /x/
            </a>
            <a 
              href="https://pol-ai-production.up.railway.app/"
              className={styles.dropdownItem}
            >
              /pol/
            </a>
          </div>
        )}
      </div>
    </header>
  );
}; 