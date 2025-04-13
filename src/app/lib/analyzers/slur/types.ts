import { AnalyzerResult } from '../../../types/interfaces';

/**
 * Structure for a post containing "meds"
 */
export interface MedsPost {
  postId: number;        // ID of the post
  threadId: number;      // ID of the thread containing this post
  comment: string;       // The post content
  timestamp: number;     // When the post was made
  name: string;         // Name of the poster
}

/**
 * Result structure for Meds analysis
 */
export interface SlurAnalyzerResult extends AnalyzerResult {
  medsPosts: MedsPost[];  // Posts containing "meds"
  metadata: {
    totalPostsAnalyzed: number;     // Total number of posts processed
    postsWithMeds: number;          // Number of posts containing "meds"
    lastAnalysis: number;           // Timestamp of previous analysis
  };
} 