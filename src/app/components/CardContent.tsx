'use client';

import React from 'react';
import { DelusionalStats } from './DelusionalStats';
import StagePost from './StagePost';
import { Card3 } from './Card3';
import Card4 from './Card4';
import Card6 from './Card6';
import { ArticleCard } from './ArticleCard';
import BigPictureArticle from './BigPictureArticle';
import SparklingLogo from './SparklingLogo';
import { GCPDotCard } from './GCPDotCard';
import { ThreadCount } from './ThreadCount';
import { ScraperButton } from './ScraperButton';
import { SummarizerButton } from './SummarizerButton';
import BlackCard from './BlackCard';
import ChanCatalogView from './ChanCatalogView';

type CardType = 'content' | 'control' | 'status';

interface BaseCard {
  id: string;
  type: CardType;
  title: string;
}

interface ContentCard extends BaseCard {
  type: 'content';
  content: string;
}

interface ControlCard extends BaseCard {
  type: 'control';
  component: 'scraper';
}

interface StatusCard extends BaseCard {
  type: 'status';
  component: 'thread-count';
}

type CardItem = ContentCard | ControlCard | StatusCard;

interface CardContentProps {
  card: CardItem;
}

export const CardContent: React.FC<CardContentProps> = ({ card }) => {
  switch (card.type) {
    case 'content':
      if (card.id === 'content-0') {
        return <DelusionalStats />;
      }
      if (card.id === 'content-1') {
        return (
          <>
            <h2 style={{ textAlign: 'left' }}>{card.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <StagePost position="top" cardType="gets" />
              <StagePost position="middle" cardType="gets" />
              <StagePost position="bottom" cardType="gets" />
            </div>
          </>
        );
      }
      if (card.id === 'content-2') {
        return <Card3 />;
      }
      if (card.id === 'content-3') {
        return <Card4 />;
      }
      if (card.id === 'content-4') {
        return (
          <>
            <h2>{card.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <StagePost position="top" cardType="insights" />
              <StagePost position="middle" cardType="insights" />
              <StagePost position="bottom" cardType="insights" />
            </div>
          </>
        );
      }
      if (card.id === 'content-5') {
        return <Card6 />;
      }
      if (card.id === 'content-6') {
        return <GCPDotCard title={card.title} />;
      }
      if (card.id === 'content-7') {
        return (
          <>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'white' }}>Discourse Overview</h2>
            <BigPictureArticle />
          </>
        );
      }
      if (card.id === 'content-8') {
        return (
          <>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{card.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              {/* Empty card ready for new content */}
            </div>
          </>
        );
      }
      if (card.id === 'content-9') {
        return (
          <>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{card.title}</h2>
            <ThreadCount />
          </>
        );
      }
      if (card.id === 'content-10') {
        return <SparklingLogo />;
      }
      if (card.id === 'content-11') {
        return (
          <>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{card.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              {/* Empty card ready for new content */}
            </div>
          </>
        );
      }
      if (card.id === 'content-12') {
        return <ArticleCard index={0} />;
      }
      if (card.id.startsWith('content-') && parseInt(card.id.split('-')[1]) >= 13 && parseInt(card.id.split('-')[1]) <= 23) {
        const articleIndex = parseInt(card.id.split('-')[1]) - 13;
        return <ArticleCard index={articleIndex} />;
      }
      if (card.id === 'content-24') {
        return <ArticleCard index={11} />;
      }
      if (card.id === 'bottom-left-card') {
        return (
          <div style={{ width: '100%', background: '#1a1a1a' }}>
            <BlackCard />
          </div>
        );
      }
      if (card.id === 'bottom-right-card') {
        return (
          <div style={{ position: 'relative', minHeight: '800px', width: '100%', margin: 0, padding: 0 }}>
            <ChanCatalogView />
          </div>
        );
      }
      return (
        <>
          <h2>{card.title}</h2>
          {card.id !== 'content-9' && <p>{card.content}</p>}
        </>
      );
    case 'control':
      return (
        <>
          <h2 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1rem', 
            color: 'inherit',
            textAlign: 'center',
            width: '100%'
          }}>
            2050 © &amp
          </h2>
          <div style={{ display: 'none' }}>
            <ScraperButton />
            <div style={{ marginTop: '1rem' }}>
              <SummarizerButton />
            </div>
          </div>
        </>
      );
    case 'status':
      return (
        <>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#333', fontWeight: 500 }}>{card.title}</h2>
          <ThreadCount />
        </>
      );
  }
}; 