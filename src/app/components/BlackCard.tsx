import React, { useEffect, useState } from 'react';
import { Tweet } from 'react-tweet';

export default function BlackCard() {
  const [tweetId, setTweetId] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://xposter-production.up.railway.app/latest/xpara')
      .then(res => res.text())
      .then(url => {
        const id = url.split('status/')[1];
        if (id) setTweetId(id);
      });
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '400px',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem'
    }}>
      {tweetId ? <Tweet id={tweetId} /> : <div style={{ color: '#fff' }}>Loading...</div>}
    </div>
  );
} 