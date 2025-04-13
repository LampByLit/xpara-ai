import { Summarizer } from './Summarizer';
import cron from 'node-cron';
import { scrape } from './scraper';
import { loadAllThreads } from '../utils/fileLoader';
import { selectThreads } from '../utils/threadSelector';
import { paths, ensureDirectories } from '../lib/utils/paths';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runScraperJob() {
    console.log('=== Starting scheduled scraper job ===');
    console.log('Time:', new Date().toISOString());
    console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
    
    try {
        await scrape();
        console.log('Scheduled scraper job completed successfully');
    } catch (error) {
        console.error('Scraper job failed:', error);
        // Don't throw here to keep the cron job running
    }
}

async function runSummarizerJob() {
  console.log('=== Starting scheduled summarizer job ===');
  console.log('Time:', new Date().toISOString());
  console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
  
  try {
    // Ensure API key is available
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY environment variable is not set');
    }

    // Ensure directories exist
    console.log('Ensuring directories exist...');
    await ensureDirectories();

    // Verify threads directory exists
    console.log('Looking for threads in:', paths.threadsDir);
    try {
      await fs.access(paths.threadsDir);
      console.log('Threads directory exists');
    } catch (e) {
      console.error('Threads directory not found:', e);
      throw new Error(`Threads directory not found at ${paths.threadsDir}`);
    }

    // Initialize summarizer
    const summarizer = new Summarizer(process.env.DEEPSEEK_API_KEY);
    
    // Load and validate threads
    console.log('Loading threads...');
    const allThreads = await loadAllThreads(paths.threadsDir);
    console.log(`Loaded ${allThreads.length} threads`);
    
    if (allThreads.length === 0) {
      throw new Error('No threads found to analyze');
    }

    // Select threads for analysis
    console.log('Selecting threads for analysis...');
    const selection = selectThreads(allThreads);
    const threadsToAnalyze = [
      ...selection.topByPosts,
      ...selection.mediumHighPosts,
      ...selection.mediumPosts,
      ...selection.lowPosts
    ];

    // Run summarization
    console.log(`Starting analysis of ${threadsToAnalyze.length} threads...`);
    await summarizer.summarize(threadsToAnalyze);
    console.log('Scheduled summarizer job completed successfully');

    // Run the publisher
    console.log('Running publisher...');
    try {
      await execAsync('npm run publish');
      console.log('Publisher completed successfully');
    } catch (publishError) {
      console.error('Publisher failed:', publishError);
      // Don't throw here, we still want to consider the summarizer job successful
    }
  } catch (error) {
    console.error('Scheduled summarizer job failed:', error);
    // Don't throw here to keep the cron job running
  }
}

export class Scheduler {
  private static instance: Scheduler | null = null;
  private scrapeJob: cron.ScheduledTask | null = null;
  private summarizeJob: cron.ScheduledTask | null = null;

  private constructor() {
    console.log('=== Initializing Scheduler ===');
    console.log('Time:', new Date().toISOString());
    console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
    this.initializeJobs();
  }

  public static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }

  private initializeJobs() {
    console.log('Initializing scheduled jobs...');
    
    // Schedule jobs at specific times
    this.scrapeJob = cron.schedule('0 */2 * * *', async () => {
      console.log('Triggering scheduled scraper job');
      await runScraperJob().catch(error => {
        console.error('Scraper job error:', error);
      });
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.summarizeJob = cron.schedule('30 21 * * *', async () => {
      console.log('Triggering scheduled summarizer job');
      await runSummarizerJob().catch(error => {
        console.error('Summarizer job error:', error);
      });
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    console.log('Jobs initialized with schedules:');
    console.log('- Scraper: every 2 hours (0 */2 * * *)');
    console.log('- Summarizer: daily at 21:30 UTC (30 21 * * *)');
  }

  async start(): Promise<void> {
    try {
      // Ensure directories exist on startup
      console.log('Ensuring directories exist before starting scheduler...');
      await ensureDirectories();
      
      // Start the jobs
      this.scrapeJob?.start();
      this.summarizeJob?.start();
      console.log('Started all scheduled jobs');
      
      // Run scraper job immediately on startup
      console.log('Running initial scraper job...');
      await runScraperJob();
    } catch (error) {
      console.error('Failed to start jobs:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      this.scrapeJob?.stop();
      this.summarizeJob?.stop();
      console.log('Stopped all scheduled jobs');
    } catch (error) {
      console.error('Failed to stop jobs:', error);
      throw error;
    }
  }

  async runScrapeManually() {
    console.log('Running scrape job manually');
    await runScraperJob();
  }

  async runSummarizeManually() {
    console.log('Running summarize job manually');
    await runSummarizerJob();
  }
}

// Remove the exported instance since we're using getInstance() now
// export const scheduler = new Scheduler(); 