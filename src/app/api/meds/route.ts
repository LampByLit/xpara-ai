import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { paths } from '@/app/utils/paths';

interface MedsPost {
  postId: number;
  threadId: number;
  comment: string;
  timestamp: number;
  name: string;
}

export async function GET() {
  console.log('=== Meds API Debug Info ===');
  console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
  console.log('CWD:', process.cwd());
  console.log('Data Dir:', paths.dataDir);

  try {
    const resultsPath = path.resolve(paths.dataDir, 'analysis', 'slur', 'results.json');
    console.log('Meds analysis path:', resultsPath);

    // Log directory structure
    console.log('Directory exists check:');
    console.log('- Data dir exists:', fs.existsSync(paths.dataDir));
    console.log('- Analysis dir exists:', fs.existsSync(path.dirname(resultsPath)));
    console.log('- Analysis file exists:', fs.existsSync(resultsPath));

    // Return 404 if file doesn't exist
    if (!fs.existsSync(resultsPath)) {
      console.log('Meds analysis file does not exist');
      return NextResponse.json(
        { error: 'No meds data available' },
        { status: 404 }
      );
    }

    try {
      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      console.log('Successfully read meds data file');
      
      const latestResult = Array.isArray(data.results) ? data.results[0] : null;
      
      if (!latestResult || !Array.isArray(latestResult.medsPosts)) {
        console.log('No valid meds posts found in data');
        return NextResponse.json(
          { error: 'No valid meds data available' },
          { status: 404 }
        );
      }

      // Convert meds posts to the format expected by StagePost
      const formattedPosts = latestResult.medsPosts.map((post: MedsPost) => ({
        no: post.postId,
        time: Math.floor(post.timestamp / 1000),
        name: post.name,
        com: post.comment,
        replies: 0,
        threadId: post.threadId
      }));

      console.log(`Returning ${formattedPosts.length} formatted meds posts`);
      return NextResponse.json(formattedPosts);
    } catch (error) {
      console.error('Error reading meds results:', error);
      return NextResponse.json(
        { error: 'Failed to read meds data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in meds API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 