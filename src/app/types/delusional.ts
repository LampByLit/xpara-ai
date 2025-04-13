export interface DelusionalTheme {
  name: string;
  frequency: number;
  keywords: string[];
  examples: string[];  // Sanitized examples for research
}

export interface DelusionalStatistics {
  mean: number;
  median: number;
  totalAnalyzed: number;
  totalDelusional: number;
}

export interface DelusionalTrend {
  timestamp: number;
  percentage: number;
  threadCount: number;
}

export interface DelusionalMatrix {
  statistics: DelusionalStatistics;
  themes: DelusionalTheme[];
  trends: DelusionalTrend[];
  generatedAt: number;
} 