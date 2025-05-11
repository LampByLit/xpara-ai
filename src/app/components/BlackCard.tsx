import React, { useEffect, useState } from 'react';
import { Tweet } from 'react-tweet';

export default function BlackCard() {
  const [tweetId, setTweetId] = useState<string | null>(null);
  const [tweetUrl, setTweetUrl] = useState<string | null>(null);
  const [embedError, setEmbedError] = useState(false);

  useEffect(() => {
    fetch('https://xposter-production.up.railway.app/latest/xpara')
      .then(res => res.text())
      .then(url => {
        setTweetUrl(url);
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
      {tweetId && !embedError ? (
        <Tweet id={tweetId} onError={() => setEmbedError(true)} />
      ) : embedError && tweetUrl ? (
        <div style={{ color: '#fff', textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem' }}>
            This Post&#39;s visibility is limited; this Post may violate X&#39;s rules against Hateful Conduct.<br />
            <a href={tweetUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1da1f2', textDecoration: 'underline' }}>
              Click Here to view this Post on X.com.
            </a>
          </p>
        </div>
      ) : (
        <div style={{ color: '#fff' }}>Loading...</div>
      )}
    </div>
  );
} 