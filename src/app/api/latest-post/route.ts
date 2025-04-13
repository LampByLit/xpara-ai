import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { paths } from '@/app/utils/paths';

interface Post {
  no: number;
  com?: string;
  time: number;
  replies?: number;
  getType?: string;
  tim?: number;
  filename?: string;
  ext?: string;
}

interface ResultItem {
  timestamp: number;
  sourcePost: Post;
  replyCount: number;
}

export async function GET() {
  try {
    // Read the results file
    const filePath = path.resolve(paths.dataDir, 'analysis', 'reply', 'results.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Ensure we have results
    if (!data || !data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid data structure in results.json');
    }

    // Get the most recent post by timestamp
    const latestPost = data.results
      .sort((a: ResultItem, b: ResultItem) => b.timestamp - a.timestamp)[0]?.sourcePost;

    if (!latestPost) {
      throw new Error('No posts found');
    }

    return NextResponse.json({
      no: latestPost.no,
      com: latestPost.com || '',
      time: latestPost.time,
      replies: data.results[0].replyCount || 0,
      tim: latestPost.tim,
      filename: latestPost.filename,
      ext: latestPost.ext
    });
  } catch (error) {
    console.error('Error fetching latest post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest post' },
      { status: 500 }
    );
  }
} 