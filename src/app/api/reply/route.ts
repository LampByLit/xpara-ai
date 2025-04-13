import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import fs_sync from 'fs';
import path from 'path';
import { paths } from '@/app/utils/paths';

interface SourcePost {
  no: number;
  com?: string;
  time: number;
  filename?: string;
  ext?: string;
  tim?: number;
  // Add other possible fields
  sub?: string;
  name?: string;
  trip?: string;
  resto?: number;
}

interface ReplyResult {
  sourcePost: SourcePost;
  replyCount?: number;
  threadId?: number;
  timestamp?: number;
}

interface ReplyData {
  results: ReplyResult[];
}

export async function GET() {
  console.log('=== Reply API Debug Info ===');
  console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
  console.log('CWD:', process.cwd());
  console.log('Data Dir:', paths.dataDir);

  try {
    // Read the results file
    const filePath = path.resolve(paths.analysisDir, 'reply', 'results.json');
    console.log('Reply analysis path:', filePath);

    // Log directory structure
    console.log('Directory exists check:');
    console.log('- Analysis dir exists:', fs_sync.existsSync(path.dirname(filePath)));
    console.log('- Analysis file exists:', fs_sync.existsSync(filePath));

    // Return 404 if file doesn't exist
    if (!fs_sync.existsSync(filePath)) {
      console.log('Reply analysis file does not exist');
      return NextResponse.json(
        { error: 'No reply data available' },
        { status: 404 }
      );
    }

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent) as ReplyData;

      // Ensure we have results
      if (!data || !data.results || !Array.isArray(data.results)) {
        console.error('Invalid data structure in results.json');
        return NextResponse.json(
          { error: 'Invalid data structure' },
          { status: 500 }
        );
      }

      // Sort by reply count (if available) and take top 3
      const sortedResults = data.results
        // First deduplicate by post number
        .filter((post, index, self) => 
          index === self.findIndex((p) => p.sourcePost.no === post.sourcePost.no)
        )
        // Filter out posts with repeating digits at the end
        .filter(post => {
          const postNo = post.sourcePost.no.toString();
          // Check last two digits - if they're the same, filter out
          return postNo.slice(-2).charAt(0) !== postNo.slice(-2).charAt(1);
        })
        .filter((post): post is ReplyResult => post && post.sourcePost !== undefined)
        .sort((a, b) => (b.replyCount || 0) - (a.replyCount || 0))
        .slice(0, 3);

      if (sortedResults.length === 0) {
        console.log('No valid reply posts found');
        return NextResponse.json(
          { error: 'No valid reply data available' },
          { status: 404 }
        );
      }

      // Log the top 3 posts for debugging
      console.log('Top 3 most replied posts (no trailing repeating digits):', 
        sortedResults.map(p => ({
          no: p.sourcePost.no,
          replies: p.replyCount,
        }))
      );

      // Return array of top 3 posts
      return NextResponse.json(sortedResults.map(post => ({
        no: post.sourcePost.no,
        com: post.sourcePost.com || '',
        replies: post.replyCount || 0,
        time: post.sourcePost.time,
        filename: post.sourcePost.filename,
        ext: post.sourcePost.ext,
        tim: post.sourcePost.tim,
        sub: post.sourcePost.sub,
        name: post.sourcePost.name,
        trip: post.sourcePost.trip,
        resto: post.sourcePost.resto,
        threadId: post.threadId,
        timestamp: post.timestamp
      })));
    } catch (error) {
      console.error('Error reading reply data:', error);
      return NextResponse.json(
        { error: 'Failed to read reply data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in reply API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 