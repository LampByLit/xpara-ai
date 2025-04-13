import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { paths } from '@/app/utils/paths';

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

    // Get the top post by reply count
    const topPost = data.results[0]?.sourcePost;
    if (!topPost) {
      throw new Error('No posts found');
    }

    return NextResponse.json({
      no: topPost.no,
      com: topPost.com || '',
      time: topPost.time,
      replies: data.results[0].replyCount || 0,
      tim: topPost.tim,
      filename: topPost.filename,
      ext: topPost.ext
    });
  } catch (error) {
    console.error('Error fetching top post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top post' },
      { status: 500 }
    );
  }
} 