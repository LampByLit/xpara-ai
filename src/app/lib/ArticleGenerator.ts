import { DeepSeekClient } from './deepseek';
import { ArticleAnalysis, ArticleGeneratorConfig, ArticleGeneratorOptions, ArticleStats } from '../types/article';
import { paths } from '../utils/paths';
import path from 'path';
import fs from 'fs/promises';

const DEFAULT_CONFIG: ArticleGeneratorConfig = {
  maxTokens: 1000,
  temperature: 0.7,
  topP: 0.9,
  frequencyPenalty: 0.5,
  presencePenalty: 0.5
};

export class ArticleGenerator {
  private client: DeepSeekClient;
  private outputPath: string;

  constructor(apiKey: string) {
    this.client = new DeepSeekClient(apiKey);
    this.outputPath = path.resolve(paths.dataDir, 'articles');
  }

  private async loadExistingArticle(threadId: string): Promise<ArticleAnalysis | null> {
    try {
      const filePath = path.resolve(this.outputPath, `${threadId}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private async saveArticle(article: ArticleAnalysis) {
    const filePath = path.resolve(this.outputPath, `${article.threadId}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(article, null, 2), 'utf-8');
  }

  private async generateArticle(threadId: string, posts: string[], config: ArticleGeneratorConfig): Promise<ArticleAnalysis> {
    console.log(`Generating article for thread ${threadId}...`);
    
    const response = await this.client.chat({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are an expert journalist summarizing online discussions.
Your task is to analyze a thread of posts and generate:
1. A clear, concise headline of 4 to 6 words.
2. A detailed article summarizing the key points and themes (175 - 200 words).

Focus on identifying paranoid and delusional thought patterns, conspiracy theories, and extreme beliefs.
Maintain a neutral, academic tone.
Always directly quote comments verbatim in quotation marks.
Be sure to include lots of quotes.
Never contextualize the content with words like "online" or "forum". Never mention the discussion itself, only what was discussed.
Be sure that your headline and article are within the word limits.
Format your response as:
HEADLINE: [your headline]
ARTICLE: [your article]`
        },
        {
          role: 'user',
          content: `Analyze and summarize this thread:\n\n${posts.join('\n\n')}`
        }
      ],
      ...config
    });

    const content = response.choices[0].message.content;
    const headline = content.match(/HEADLINE: (.*)/)?.[1] || 'Untitled Thread';
    const article = content.match(/ARTICLE: ([\s\S]*)/)?.[1]?.trim() || 'No content generated';

    return {
      threadId,
      headline,
      article,
      delusionalStats: await this.analyzeDelusionalContent(posts),
        generatedAt: Date.now()
    };
  }

  private async analyzeDelusionalContent(posts: string[]): Promise<ArticleStats> {
    console.log('Analyzing posts for delusional content...');
    
    const response = await this.client.chat({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are an expert psychiatrist analyzing online discussions.
Your task is to identify posts that exhibit signs of paranoid or delusional thinking.
Common indicators include:
- Conspiracy theories
- Persecution complexes
- Grandiose delusions
- Bizarre beliefs without evidence
- Extreme paranoia
- Disorganized thinking

For each post, determine if it shows clear signs of delusional content. Be very liberal with your interpretation.
Maintain strict clinical objectivity.
Respond with ONLY a number indicating how many posts contain clear delusional content.`
        },
        {
          role: 'user',
          content: `Analyze these ${posts.length} posts for delusional content:\n\n${posts.join('\n\n')}`
        }
      ],
      temperature: 0.3
    });

    const delusionalCount = parseInt(response.choices[0].message.content, 10) || 0;
    
    return {
      analyzedComments: posts.length,
      delusionalComments: delusionalCount,
      percentage: (delusionalCount / posts.length) * 100
    };
  }

  async generate(threadId: string, posts: string[], options: ArticleGeneratorOptions = {}): Promise<ArticleAnalysis> {
    console.log(`Processing thread ${threadId}...`);
    
    // Check for existing article unless force regenerate is true
    if (!options.forceRegenerate) {
      const existing = await this.loadExistingArticle(threadId);
      if (existing) {
        console.log(`Found existing article for thread ${threadId}`);
        return existing;
      }
    }

    const config = { ...DEFAULT_CONFIG, ...options.config };
    const article = await this.generateArticle(threadId, posts, config);
    await this.saveArticle(article);
    
    return article;
  }
} 