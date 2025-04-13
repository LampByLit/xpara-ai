import { NextResponse } from 'next/server';
import { loadEnvConfig } from '@next/env';
import { Summarizer } from '@/app/lib/Summarizer';
import { loadAllThreads } from '@/app/utils/fileLoader';
import { selectThreads } from '@/app/utils/threadSelector';
import { paths, ensureDirectories } from '@/app/lib/utils/paths';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load environment variables
loadEnvConfig(process.cwd());

export async function POST() {
  try {
    console.log('Starting summarizer process...');
    
    // Check API key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is not set');
    }
    console.log('API key verified');

    // Ensure directories exist
    console.log('Ensuring directories exist...');
    await ensureDirectories();

    // Load all threads from the threads directory
    console.log('Looking for threads in:', paths.threadsDir);
    
    // Check if directory exists
    try {
      await fs.access(paths.threadsDir);
      console.log('Threads directory exists');
    } catch (e) {
      console.error('Threads directory not found:', e);
      throw new Error(`Threads directory not found at ${paths.threadsDir}`);
    }

    const allThreads = await loadAllThreads(paths.threadsDir);
    console.log(`Loaded ${allThreads.length} threads`);
    
    if (allThreads.length === 0) {
      throw new Error('No threads found to analyze');
    }

    // Select threads based on criteria
    console.log('Selecting threads for analysis...');
    const selection = selectThreads(allThreads);
    const threadsToAnalyze = [
      ...selection.topByPosts,
      ...selection.mediumHighPosts,
      ...selection.mediumPosts,
      ...selection.lowPosts
    ];

    if (threadsToAnalyze.length !== 12) {
      throw new Error(`Expected 12 threads for analysis, but got ${threadsToAnalyze.length}`);
    }
    console.log(`Selected ${threadsToAnalyze.length} threads for analysis`);

    // Initialize and run summarizer
    console.log('Initializing summarizer...');
    const summarizer = new Summarizer(apiKey);
    console.log('Starting analysis...');
    const { articles, matrix, bigPicture } = await summarizer.summarize(threadsToAnalyze);
    console.log('Analysis complete');

    // Save results using paths utility
    const outputPath = paths.analyzerResultsFile('latest-summary');
    
    // Ensure the directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Write the results to file
    await fs.writeFile(
      outputPath,
      JSON.stringify({ articles, matrix, bigPicture }, null, 2),
      'utf-8'
    );
    console.log('Results saved to:', outputPath);

    // Run the publisher
    console.log('Running publisher...');
    try {
      await execAsync('npm run publish');
      console.log('Publisher completed successfully');
    } catch (publishError) {
      console.error('Publisher failed:', publishError);
      // Don't throw here, we still want to return the summarizer results
    }

    return NextResponse.json({ 
      message: 'Summarizer completed successfully',
      threadsAnalyzed: articles.batchStats.totalThreads,
      matrixStats: {
        meanPercentage: matrix.statistics.mean,
        medianPercentage: matrix.statistics.median,
        totalAnalyzed: matrix.statistics.totalAnalyzed,
        themeCount: matrix.themes.length
      },
      bigPictureStats: {
        themeCount: bigPicture.themes.length,
        sentimentCount: bigPicture.sentiments.length,
        overviewLength: bigPicture.overview.article.length
      }
    });
  } catch (error) {
    console.error('Failed to run summarizer:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run summarizer' },
      { status: 500 }
    );
  }
} 