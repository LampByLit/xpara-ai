import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { paths } from '@/app/utils/paths';

interface GetResult {
  metadata: {
    postNo: number;
    comment: string;
    checkCount: number;
    hasImage?: boolean;
    filename?: string;
    ext?: string;
    tim?: number;
  };
  getType: string;
  digitCount: number;
}

export async function GET() {
  try {
    const filePath = path.resolve(paths.dataDir, 'analysis', 'gets', 'results.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data || !data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid data structure in results.json');
    }

    // Sort by check count and significance
    const sortedResults = data.results
      .sort((a: GetResult, b: GetResult) => {
        // First prioritize check count
        const checkDiff = b.metadata.checkCount - a.metadata.checkCount;
        if (checkDiff !== 0) return checkDiff;
        // Then prioritize digit count
        return b.digitCount - a.digitCount;
      });

    // Take top 3 gets
    const gets = sortedResults.slice(0, 3).map((result: GetResult) => ({
      postNumber: result.metadata.postNo.toString(),
      comment: result.metadata.comment,
      checkCount: result.metadata.checkCount,
      getType: result.getType,
      hasImage: result.metadata.hasImage,
      filename: result.metadata.filename,
      ext: result.metadata.ext,
      tim: result.metadata.tim
    }));

    return NextResponse.json(gets);
  } catch (error) {
    console.error('Error fetching GETs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GETs' },
      { status: 500 }
    );
  }
} 