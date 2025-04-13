import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { paths, ensureDirectories } from '@/app/utils/paths';

interface GetAnalyzerResult {
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

function isValidGetResult(result: unknown): result is GetAnalyzerResult {
  if (!result || typeof result !== 'object') {
    return false;
  }

  const candidate = result as Record<string, unknown>;
  
  if (!candidate.metadata || typeof candidate.metadata !== 'object') {
    return false;
  }

  const metadata = candidate.metadata as Record<string, unknown>;

  return (
    typeof metadata.postNo === 'number' &&
    typeof metadata.comment === 'string' &&
    typeof metadata.checkCount === 'number' &&
    typeof candidate.getType === 'string'
  );
}

export async function GET() {
  console.log('=== Significant GETs API Debug Info ===');
  console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
  console.log('CWD:', process.cwd());
  console.log('Data Dir:', paths.dataDir);
  
  try {
    // Ensure all directories exist first
    console.log('Ensuring directories exist...');
    await ensureDirectories();
    console.log('Directories ensured');
    
    const analysisPath = path.resolve(paths.dataDir, 'analysis', 'get', 'results.json');
    console.log('Analysis path:', analysisPath);
    
    // Log directory structure
    console.log('Directory exists check:');
    console.log('- Data dir exists:', fs.existsSync(paths.dataDir));
    console.log('- Analysis dir exists:', fs.existsSync(path.dirname(analysisPath)));
    console.log('- Analysis file exists:', fs.existsSync(analysisPath));

    // Return 404 if file doesn't exist
    if (!fs.existsSync(analysisPath)) {
      console.log('Analysis file does not exist');
      return NextResponse.json(
        { error: 'No GETs data available' },
        { status: 404 }
      );
    }

    // Try to read and parse data
    try {
      const content = fs.readFileSync(analysisPath, 'utf-8');
      const data = JSON.parse(content);
      
      if (!data.results || !Array.isArray(data.results)) {
        console.error('Invalid data structure in results.json');
        return NextResponse.json(
          { error: 'Invalid data structure' },
          { status: 500 }
        );
      }

      const validResults = data.results.filter(isValidGetResult);
      console.log(`Found ${validResults.length} valid GET results`);

      // Return 404 if no valid results
      if (validResults.length === 0) {
        console.log('No valid results found');
        return NextResponse.json(
          { error: 'No valid GETs data available' },
          { status: 404 }
        );
      }

      // Sort by check count and significance
      const sortedResults = validResults
        .sort((a: GetAnalyzerResult, b: GetAnalyzerResult) => {
          // First prioritize check count
          const checkDiff = b.metadata.checkCount - a.metadata.checkCount;
          if (checkDiff !== 0) return checkDiff;
          // Then prioritize digit count
          return b.digitCount - a.digitCount;
        })
        // Filter out duplicates based on postNo
        .filter((result: GetAnalyzerResult, index: number, self: GetAnalyzerResult[]) => 
          index === self.findIndex((r: GetAnalyzerResult) => r.metadata.postNo === result.metadata.postNo)
        );

      // Take top 3 unique gets
      const [getOne, getTwo, getThree] = sortedResults;

      return NextResponse.json({
        getOne: getOne ? {
          postNumber: getOne.metadata.postNo.toString(),
          comment: getOne.metadata.comment,
          checkCount: getOne.metadata.checkCount,
          getType: getOne.getType,
          hasImage: getOne.metadata.hasImage,
          filename: getOne.metadata.filename,
          ext: getOne.metadata.ext,
          tim: getOne.metadata.tim
        } : null,
        getTwo: getTwo ? {
          postNumber: getTwo.metadata.postNo.toString(),
          comment: getTwo.metadata.comment,
          checkCount: getTwo.metadata.checkCount,
          getType: getTwo.getType,
          hasImage: getTwo.metadata.hasImage,
          filename: getTwo.metadata.filename,
          ext: getTwo.metadata.ext,
          tim: getTwo.metadata.tim
        } : null,
        getThree: getThree ? {
          postNumber: getThree.metadata.postNo.toString(),
          comment: getThree.metadata.comment,
          checkCount: getThree.metadata.checkCount,
          getType: getThree.getType,
          hasImage: getThree.metadata.hasImage,
          filename: getThree.metadata.filename,
          ext: getThree.metadata.ext,
          tim: getThree.metadata.tim
        } : null
      });

    } catch (err) {
      console.error('Error reading or parsing analysis file:', err);
      return NextResponse.json(
        { error: 'Failed to read GETs data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in significant-gets API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 