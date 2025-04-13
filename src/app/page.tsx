import { Card } from './components/Card';
import { CardGrid } from './components/CardGrid';
import { Header } from './components/Header';
import { FlippableCard } from './components/FlippableCard';
import { CardContent } from './components/CardContent';
import WarningOverlay from './components/WarningOverlay';
import styles from './page.module.css';

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

export default function Home() {
  // Regular content cards (first 25 cards)
  const contentCards: ContentCard[] = Array.from({ length: 25 }, (_, i) => ({
    id: `content-${i}`,
    type: 'content',
    title: i === 0 ? 'Delusional Content Per Post' : 
           i === 1 ? 'Most Significant GETs' :
           i === 4 ? 'Key Insights' :
           i === 6 ? 'Real-time GCP Dot' :
           i === 8 ? '' :
           i === 9 ? 'Thread Count' :
           i === 11 ? '' :
           i === 12 ? '' :
           (i >= 13 && i <= 23) || i === 24 ? '' :  // Clear titles for article cards
           `Card ${i + 1}`,
    content: i === 0 ? '9.4% Medium' : 
             i === 1 ? '' :
             i === 4 ? '' :
             i === 6 ? '' :
             i === 8 ? '' :
             i === 9 ? '' :
             i === 11 ? '' :
             i === 12 ? '' :
             i >= 13 ? '' :  // Clear content for article cards
             'Sample content for this card. Will be replaced with real data.'
  }));

  // Scraper control card (15th card)
  const scraperCard: ControlCard = {
    id: 'scraper-control',
    type: 'control',
    title: '',
    component: 'scraper'
  };

  // Combine all cards in the same order as before
  const cardLayout: CardItem[] = [
    ...contentCards,
    scraperCard,
    {
      id: 'bottom-left-card',
      type: 'content',
      title: 'Live Catalog View',
      content: ''
    },
    {
      id: 'bottom-right-card',
      type: 'content',
      title: '4chan Catalog View',
      content: ''
    }
  ];

  return (
    <>
      <WarningOverlay />
      <Header />
      <main className={styles.main}>
        <CardGrid>
          {cardLayout.map((card, index) => {
            if (index === 0) {
              return (
                <FlippableCard key={card.id} className={styles.pinkCard}>
                  <CardContent card={card} />
                </FlippableCard>
              );
            }
            
            if (index === 1) {
              return (
                <FlippableCard key={card.id} className={styles.neonCard} backContent="About">
                  <CardContent card={card} />
                </FlippableCard>
              );
            }
            
            return (
              <Card key={card.id} className={`
                ${index === 2 ? styles.blackCard : ''}
                ${index === 3 ? styles.cyanCard : ''}
                ${(index === 4 || index === 5) ? styles.orangeCard : ''}
                ${index === 6 ? styles.purpleCard : ''}
                ${index === 7 ? styles.blackCard : ''}
                ${index === 8 ? styles.hidden : ''}
                ${index === 9 ? styles.blackCard : ''}
                ${index === 10 ? styles.blackCard : ''}
                ${index === 11 ? styles.hidden : ''}
                ${index === 12 ? styles.neonGreenCard : ''}
                ${index === 15 ? styles.brightBlueCard : ''}
                ${index === 16 ? styles.magentaCard : ''}
                ${index === 17 ? styles.goldCard : ''}
                ${index === 18 ? styles.indigoCard : ''}
                ${index === 19 ? styles.limeCard : ''}
                ${index === 20 ? styles.crimsonCard : ''}
                ${index === 21 ? styles.turquoiseCard : ''}
                ${index === 22 ? styles.hidden : ''}
                ${index === 23 ? styles.brightGreenCard : ''}
                ${index === 24 ? styles.purpleCard : ''}
                ${index === cardLayout.length - 1 ? styles.transparentCard : ''}
                ${index === cardLayout.length - 1 ? styles.noPadding : ''}
              `}>
                <CardContent card={card} />
              </Card>
            );
          })}
        </CardGrid>
      </main>
    </>
  );
}
