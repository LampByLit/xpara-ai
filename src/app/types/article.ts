export interface ArticleStats {
  analyzedComments: number;
  delusionalComments: number;
  percentage: number;
}

export interface ArticleAnalysis {
  threadId: string;
  headline: string;
  article: string;
  delusionalStats: ArticleStats;
  generatedAt: number;
}

export interface ArticleGeneratorConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface ArticleGeneratorOptions {
  config?: Partial<ArticleGeneratorConfig>;
  forceRegenerate?: boolean;
}

export interface ArticleBatch {
  articles: ArticleAnalysis[];
  batchStats: {
    totalThreads: number;
    totalAnalyzedPosts: number;
    averageDelusionalPercentage: number;
    generatedAt: number;
  };
} 