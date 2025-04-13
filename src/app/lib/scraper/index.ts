/**
 * 4chan /x/ Scraper
 * 
 * This module handles fetching thread data from 4chan's API
 * following their rate limiting and API requirements.
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { Readable } from 'stream';
import { ensureDirectories, paths } from '@/app/utils/paths';
import { Thread, Post, isAxiosError } from '../../types/interfaces';
import { initializeAnalyzers, analyzeThreads, purgeOldResults } from '../analyzers';

// Base URL for 4chan API
const API_BASE_URL = 'https://a.4cdn.org/x';
const MEDIA_BASE_URL = 'https://i.4cdn.org/x';

// Configuration
const MAX_THREADS_PER_CATEGORY = 25; // Increased to capture more paranormal discussions
const THREAD_AGE_LIMIT_HOURS = 72; // Extended to 72 hours since /x/ threads tend to develop slower

// User agents to rotate through
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
];

/**
 * Get a random user agent from our list
 */
function getRandomUserAgent(): string {
  const index = Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[index];
}

/**
 * Sleep for a random amount of time between min and max milliseconds
 */
async function randomSleep(minMs = 250, maxMs = 750): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1) + minMs);
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create axios instance with proper headers
 */
function createApiClient() {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'User-Agent': getRandomUserAgent()
    }
  });
}

/**
 * Fetch data from 4chan API with proper headers and error handling
 */
async function fetchFromApi<T>(endpoint: string): Promise<T> {
  const client = createApiClient();
  
  try {
    console.log(`Fetching: ${endpoint}`);
    const response = await client.get<T>(endpoint);
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response?.status === 429) {
        console.log('Rate limited, waiting 30 seconds...');
        await randomSleep(30, 40);
        return fetchFromApi(endpoint);
      }
    }
    throw error;
  }
}

/**
 * Download OP image for a thread
 */
async function downloadOpImage(thread: Thread): Promise<void> {
  // Only proceed if thread has an image
  if (!thread.tim || !thread.ext) {
    return;
  }

  // Skip video files
  const videoExtensions = ['.webm', '.mp4', '.mov', '.avi', '.wmv', '.flv'];
  if (videoExtensions.includes(thread.ext.toLowerCase())) {
    console.log(`Skipping video file for thread ${thread.no} (${thread.ext})`);
    return;
  }

  const imageUrl = `${MEDIA_BASE_URL}/${thread.tim}${thread.ext}`;
  const imagePath = path.join(paths.dataDir, 'media', 'OP', `${thread.no}${thread.ext}`);

  // Create media directory if it doesn't exist
  const mediaDir = path.join(paths.dataDir, 'media', 'OP');
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  try {
    const response = await axios<Readable>({
      method: 'get',
      url: imageUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(imagePath);
    const stream = response.data;
    
    stream.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Error downloading image for thread ${thread.no}:`, error);
  }
}

/**
 * Get catalog and extract threads we want to track
 */
async function getTargetThreads(): Promise<Thread[]> {
  interface CatalogPage {
    page: number;
    threads: Thread[];
  }

  try {
    // Fetch the catalog
    const catalog = await fetchFromApi<CatalogPage[]>('/catalog.json');
    
    // Flatten all threads from all pages
    const allThreads = catalog.flatMap(page => page.threads)
      .filter(thread => !thread.sticky && !thread.closed); // Exclude stickied and closed threads
    
    // Get top threads by replies
    const topThreads = [...allThreads]
      .sort((a, b) => (b.replies || 0) - (a.replies || 0))
      .slice(0, MAX_THREADS_PER_CATEGORY);
    
    // Get threads with images (paranormal evidence, etc.)
    const imageThreads = [...allThreads]
      .filter(thread => thread.tim && !thread.ext?.toLowerCase().match(/\.(webm|mp4|mov|avi|wmv|flv)$/))
      .sort((a, b) => b.no - a.no)
      .slice(0, MAX_THREADS_PER_CATEGORY);
    
    // Get newest threads
    const newestThreads = [...allThreads]
      .sort((a, b) => b.no - a.no)
      .slice(0, MAX_THREADS_PER_CATEGORY);
    
    // Combine and deduplicate threads
    const uniqueThreads = Array.from(new Map(
      [...topThreads, ...imageThreads, ...newestThreads].map(thread => [thread.no, thread])
    ).values());
    
    // Sort by post number (descending)
    return uniqueThreads.sort((a, b) => b.no - a.no);
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return [];
  }
}

/**
 * Fetch full thread data including all replies
 */
async function fetchFullThread(threadId: number): Promise<Thread | null> {
  try {
    interface ThreadResponse {
      posts: (Post & Partial<Thread>)[];
    }
    
    const data = await fetchFromApi<ThreadResponse>(`/thread/${threadId}.json`);
    
    // First post is always the OP
    const [op, ...replies] = data.posts;
    
    // Ensure we have the 'now' field
    if (!op.now) {
      console.error(`Thread ${threadId} missing 'now' field`);
      return null;
    }
    
    // Construct full thread object
    const thread: Thread = {
      ...op,
      no: op.no,
      time: op.time,
      name: op.name || 'Anonymous',
      now: op.now,
      replies: replies.length,
      images: replies.filter(post => post.tim).length,
      posts: replies,
      lastModified: Date.now() / 1000
    };
    
    return thread;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      console.log(`Thread ${threadId} was pruned`);
      return null;
    }
    throw error;
  }
}

/**
 * Save thread data to disk
 */
function saveThread(thread: Thread): void {
  const filePath = paths.threadFile(thread.no.toString());
  
  try {
    // Write to temporary file first
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(thread, null, 2));
    
    // Rename to final path (atomic operation)
    fs.renameSync(tempPath, filePath);
    
    console.log(`Thread ${thread.no} saved to ${filePath}`);
  } catch (error) {
    console.error(`Error saving thread ${thread.no}:`, error);
    throw error;
  }
}

/**
 * Parse 4chan date format to timestamp
 * Format: "MM/DD/YY(Day)HH:MM:SS"
 */
function parseThreadDate(dateStr: string): number {
  try {
    // Extract date parts from format "03/15/25(Sat)10:49:41"
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{2})\([^)]+\)(\d{2}):(\d{2}):(\d{2})/);
    if (!match) return Date.now(); // Return current time if format doesn't match

    const [, month, day, year, hours, minutes, seconds] = match;
    
    // Convert to full year (assuming current century)
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    let fullYear = currentCentury + parseInt(year);
    
    // If the resulting date would be in the future, use previous century
    const proposedDate = new Date(
      fullYear,
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    );
    
    if (proposedDate.getTime() > Date.now()) {
      fullYear -= 100;
    }
    
    return new Date(
      fullYear,
      parseInt(month) - 1, // JS months are 0-based
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    ).getTime();
  } catch (error) {
    console.error(`Error parsing thread date ${dateStr}:`, error);
    return Date.now(); // Return current time on error
  }
}

/**
 * Get thread age in hours
 */
function getThreadAgeHours(thread: Thread): number {
  if (!thread.now) return 0;
  
  const threadTime = parseThreadDate(thread.now);
  const ageMs = Date.now() - threadTime;
  return ageMs / (1000 * 60 * 60);
}

/**
 * Clean up old threads that are no longer active
 */
async function cleanOldThreads(): Promise<void> {
  try {
    const files = await fs.promises.readdir(paths.threadsDir);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = path.join(paths.threadsDir, file);
      try {
        const data = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
        const ageHours = getThreadAgeHours(data);
        
        // Remove threads older than the age limit
        if (ageHours > THREAD_AGE_LIMIT_HOURS) {
          console.log(`Removing old thread: ${file} (${ageHours.toFixed(1)} hours old)`);
          await fs.promises.unlink(filePath);
          
          // Also remove associated media
          const threadId = path.basename(file, '.json');
          const mediaPath = path.join(paths.mediaDir, 'OP', `${threadId}.jpg`);
          if (fs.existsSync(mediaPath)) {
            await fs.promises.unlink(mediaPath);
          }
        }
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Error cleaning old threads:', error);
  }
}

/**
 * Main scraper function
 */
async function scrape(): Promise<void> {
  console.log('Starting 4chan /x/ scraper...');
  
  // Ensure our data directories exist
  ensureDirectories();
  
  try {
    // Clean up old threads first
    await cleanOldThreads();
    
    // Initialize analyzers
    await initializeAnalyzers();
    
    // Get target threads from catalog
    const targetThreads = await getTargetThreads();
    console.log(`Found ${targetThreads.length} threads to process`);
    
    // Collect all thread data first
    const collectedThreads: Thread[] = [];
    
    // Process each thread
    for (const thread of targetThreads) {
      console.log(`Processing thread ${thread.no}...`);
      
      try {
        // Fetch full thread data
        const fullThread = await fetchFullThread(thread.no);
        if (!fullThread) continue;
        
        // Download OP image
        await downloadOpImage(fullThread);
        
        // Save thread data
        saveThread(fullThread);
        
        // Add to collected threads
        collectedThreads.push(fullThread);
        
        // Sleep before next request
        await randomSleep();
      } catch (error) {
        console.error(`Error processing thread ${thread.no}:`, error);
        // Continue with next thread
      }
    }
    
    console.log('Thread collection complete. Running analyzers...');
    
    // Run analyzers on all collected threads
    try {
      await analyzeThreads(collectedThreads);
    } catch (error) {
      console.error('Error analyzing threads:', error);
    }
    
    // Clean up old analysis results
    await purgeOldResults();
    
    console.log('Scraping and analysis complete!');
  } catch (error) {
    console.error('Scraper failed:', error);
    throw error;
  }
}

// If this file is run directly (not imported)
if (require.main === module) {
  scrape()
    .then(() => console.log('Scraper finished successfully'))
    .catch(error => {
      console.error('Scraper failed:', error);
      process.exit(1);
    });
}

// Export for use in other modules
export { scrape }; 