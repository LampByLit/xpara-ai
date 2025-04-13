import { Thread } from '../types/interfaces';
import { ArticleGenerator } from './ArticleGenerator';
import { ArticleBatch, ArticleAnalysis } from '../types/article';
import { DelusionalMatrix } from '../types/delusional';
import { DelusionalMatrixAnalyzer } from './analyzers/DelusionalMatrix';
import { BigPictureGenerator } from './analyzers/BigPictureGenerator';
import { BigPictureAnalysis } from '../types/bigpicture';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { paths } from '@/app/utils/paths';
import { DeepSeekClient } from './deepseek';

interface Summary {
  articles: ArticleBatch;
  matrix: DelusionalMatrix;
  bigPicture: BigPictureAnalysis;
  timestamp?: number;
}

export class Summarizer {
  private articleGenerator: ArticleGenerator;
  private matrixAnalyzer: DelusionalMatrixAnalyzer;
  private bigPictureGenerator: BigPictureGenerator;
  private outputFile: string;
  private client: DeepSeekClient;
  private outputPath: string;
  private articles: ArticleAnalysis[];
  private matrix: DelusionalMatrix;
  private batchStats: ArticleBatch['batchStats'];

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('DeepSeek API key is required');
    }
    this.articleGenerator = new ArticleGenerator(apiKey);
    this.matrixAnalyzer = new DelusionalMatrixAnalyzer(apiKey);
    this.bigPictureGenerator = new BigPictureGenerator(apiKey);
    this.outputFile = path.resolve(paths.dataDir, 'analysis', 'latest-summary.json');
    this.client = new DeepSeekClient(apiKey);
    this.outputPath = path.resolve(paths.dataDir, 'analysis');
    this.articles = [];
    this.matrix = {
      statistics: { mean: 0, median: 0, totalAnalyzed: 0, totalDelusional: 0 },
      themes: [],
      trends: [],
      generatedAt: 0
    };
    this.batchStats = {
      totalThreads: 0,
      totalAnalyzedPosts: 0,
      averageDelusionalPercentage: 0,
      generatedAt: 0
    };
  }

  private async saveSummary(summary: Summary): Promise<void> {
    const tempFile = `${this.outputFile}.tmp`;
    try {
      await fs.mkdir(path.dirname(this.outputFile), { recursive: true });
      await fs.writeFile(tempFile, JSON.stringify({
        ...summary,
        timestamp: Date.now()
      }, null, 2));
      await fs.rename(tempFile, this.outputFile);
      console.log(`Summary saved to: ${this.outputFile}`);

      // Save delusional stats separately
      const delusionalStatsPath = path.resolve(paths.dataDir, 'analysis', 'latest-delusional.json');
      const delusionalStats = {
        statistics: {
          analyzedComments: summary.articles.batchStats.totalAnalyzedPosts,
          delusionalComments: Math.round(summary.articles.batchStats.totalAnalyzedPosts * (summary.articles.batchStats.averageDelusionalPercentage / 100)),
          percentage: summary.articles.batchStats.averageDelusionalPercentage
        },
        generatedAt: Date.now()
      };
      await fs.writeFile(delusionalStatsPath, JSON.stringify(delusionalStats, null, 2));
      console.log(`Delusional stats saved to: ${delusionalStatsPath}`);

    } catch (error) {
      console.error('Failed to save summary:', error);
      if (existsSync(tempFile)) {
        await fs.unlink(tempFile).catch(() => {});
      }
      throw error;
    }
  }

  async summarize(threads: Thread[]): Promise<Summary> {
    console.log('\nGenerating summaries...');
    
    // Generate articles for each thread
    const articles: ArticleBatch = {
      articles: [],
      batchStats: {
        totalThreads: 0,
        totalAnalyzedPosts: 0,
        averageDelusionalPercentage: 0,
        generatedAt: Date.now()
      }
    };

    for (const thread of threads) {
      try {
        if (thread.posts) {
          const article = await this.articleGenerator.generate(
            thread.no.toString(),
            thread.posts.map(p => p.com || '').filter(Boolean),
            { forceRegenerate: true }
          );
          articles.articles.push(article);
        }
      } catch (error) {
        console.error(`Failed to generate article for thread ${thread.no}:`, error);
      }
    }

    // Calculate batch statistics
    articles.batchStats.totalThreads = articles.articles.length;
    articles.batchStats.totalAnalyzedPosts = articles.articles.reduce(
      (sum, a) => sum + a.delusionalStats.analyzedComments, 
      0
    );
    articles.batchStats.averageDelusionalPercentage = articles.articles.reduce(
      (sum, a) => sum + a.delusionalStats.percentage, 
      0
    ) / articles.articles.length;
    articles.batchStats.generatedAt = Date.now();

    // Generate matrix analysis
    const matrix = await this.matrixAnalyzer.analyze(articles.articles);

    // Generate big picture analysis
    const bigPicture = await this.bigPictureGenerator.analyze(threads, articles.articles);

    // Save the complete summary
    const summary = {
      articles,
      matrix,
      bigPicture,
      timestamp: Date.now()
    };

    await this.saveSummary(summary);

    // Log analysis results
    console.log('\nAnalysis complete:');
    console.log(`- Analyzed ${articles.batchStats.totalAnalyzedPosts} posts across ${articles.batchStats.totalThreads} threads`);
    console.log(`- Average delusional content: ${articles.batchStats.averageDelusionalPercentage.toFixed(2)}%`);
    console.log(`- Identified ${matrix.themes.length} delusional themes`);
    console.log(`- Mean delusional percentage: ${matrix.statistics.mean.toFixed(2)}%`);
    console.log(`- Median delusional percentage: ${matrix.statistics.median.toFixed(2)}%`);
    console.log(`- Generated big picture overview with ${bigPicture.themes.length} general themes`);
    console.log(`- Identified ${bigPicture.sentiments.length} major sentiments`);

    return summary;
  }
} 