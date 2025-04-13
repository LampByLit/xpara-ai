import { Thread, Post } from '../../../types/interfaces';
import { BaseAnalyzer } from '../base';
import { SlurAnalyzerResult, MedsPost } from './types';

/**
 * Analyzer for tracking occurrences of "meds" in posts
 */
export class SlurAnalyzer extends BaseAnalyzer<SlurAnalyzerResult> {
  name = 'slur';
  description = 'Tracks occurrences of "meds" mentions in posts';

  // Term to track (case-insensitive)
  private static TRACKED_TERM = 'meds';
  private static MAX_POSTS = 3;

  /**
   * Check if text contains the word "meds"
   */
  private hasMeds(text: string): boolean {
    const regex = new RegExp(`\\b${SlurAnalyzer.TRACKED_TERM}\\b`, 'gi');
    return regex.test(text.toLowerCase());
  }

  /**
   * Process a post to track meds mentions
   */
  private processPost(
    post: Post,
    thread: Thread,
    medsPostsSet: Set<MedsPost>
  ): void {
    if (!post.com) return;

    if (this.hasMeds(post.com)) {
      const medsPost: MedsPost = {
        postId: post.no,
        threadId: thread.no,
        comment: post.com,
        timestamp: post.time * 1000, // Convert to milliseconds
        name: post.name || 'Anonymous'
      };
      medsPostsSet.add(medsPost);
    }
  }

  /**
   * Analyze threads for meds mentions
   */
  async analyze(threads: Thread[]): Promise<SlurAnalyzerResult[]> {
    console.log('Starting meds analysis...');
    
    const medsPostsSet = new Set<MedsPost>();
    let totalPosts = 0;

    // Process each thread
    for (const thread of threads) {
      if (!thread.posts) continue;

      // Process OP post
      if (thread.com) {
        this.processPost(
          {
            no: thread.no,
            resto: 0,
            time: thread.time,
            name: thread.name || 'Anonymous',
            com: thread.com
          },
          thread,
          medsPostsSet
        );
        totalPosts++;
      }

      // Process each reply
      for (const post of thread.posts) {
        this.processPost(post, thread, medsPostsSet);
        totalPosts++;
      }
    }

    // Convert Set to Array and sort by timestamp (newest first)
    const medsPosts = Array.from(medsPostsSet)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, SlurAnalyzer.MAX_POSTS);

    // Create single result
    return [{
      timestamp: Date.now(),
      threadId: threads[0]?.no || -1,
      postId: threads[0]?.posts?.[0]?.no || -1,
      medsPosts,
      metadata: {
        totalPostsAnalyzed: totalPosts,
        postsWithMeds: medsPostsSet.size,
        lastAnalysis: Date.now()
      }
    }];
  }
} 