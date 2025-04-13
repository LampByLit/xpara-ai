/**
 * Centralized path management for the application
 * 
 * This utility ensures consistent path handling across all environments
 * (local development, production, Railway deployment)
 */

import path from 'path';
import { ensureDir } from './fs';
import { isRailway, getDataDir } from './env';

// Debug logging function
function logPathInfo(label: string, value: string) {
  console.log(`[PATHS] ${label}: ${value}`);
}

// Get the data directory from environment
const DATA_DIR = getDataDir();

// Log environment information
logPathInfo('Environment', isRailway() ? 'Railway' : 'Local');
logPathInfo('Data Directory', DATA_DIR);
logPathInfo('Process CWD', process.cwd());

// Define all application paths
export interface Paths {
  dataDir: string;
  threadsDir: string;
  summariesDir: string;
  analysisDir: string;
  mediaDir: string;
  mediaOpDir: string;
  logsDir: string;
  articlesDir: string;
  threadFile: (threadId: string) => string;
  analyzerResultsFile: (analyzer: string) => string;
}

export const paths: Paths = {
  dataDir: DATA_DIR,
  threadsDir: path.resolve(DATA_DIR, 'threads'),
  summariesDir: path.resolve(DATA_DIR, 'summaries'),
  analysisDir: path.resolve(DATA_DIR, 'analysis'),
  mediaDir: path.resolve(DATA_DIR, 'media'),
  mediaOpDir: path.resolve(DATA_DIR, 'media-op'),
  logsDir: path.resolve(DATA_DIR, 'logs'),
  articlesDir: path.resolve(DATA_DIR, 'articles'),
  threadFile: (threadId: string) => path.resolve(paths.threadsDir, `${threadId}.json`),
  analyzerResultsFile: (analyzer: string) => path.resolve(paths.analysisDir, analyzer, 'results.json'),
};

/**
 * Ensures all required directories exist
 * This should be called during application startup
 */
export async function ensureDirectories(): Promise<void> {
  try {
    // Create base directories
    const directories = [
      paths.dataDir,
      paths.threadsDir,
      paths.summariesDir,
      paths.analysisDir,
      paths.mediaDir,
      paths.mediaOpDir,
      paths.logsDir,
      paths.articlesDir,
      path.resolve(paths.analysisDir, 'get'),
      path.resolve(paths.analysisDir, 'reply'),
      path.resolve(paths.analysisDir, 'link'),
      path.resolve(paths.analysisDir, 'geo'),
      path.resolve(paths.analysisDir, 'slur'),
      path.resolve(paths.analysisDir, 'media'),
    ];

    // Create all directories in parallel
    await Promise.all(directories.map(dir => ensureDir(dir)));
    
    console.log('All required directories have been created and verified');
  } catch (error) {
    console.error('Error ensuring directories exist:', error);
    // Don't throw - let the application continue and handle errors at higher levels
  }
}

/**
 * Validates write permissions for all data directories
 * Returns true if all directories are writable
 */
export async function validateDirectories(): Promise<boolean> {
  try {
    // Check if directories exist and are writable
    const directories = [
      paths.dataDir,
      paths.threadsDir,
      paths.summariesDir,
      paths.analysisDir,
      paths.mediaDir,
      paths.mediaOpDir,
      paths.logsDir,
    ];

    // Validate all directories in parallel
    await Promise.all(directories.map(dir => ensureDir(dir)));
    
    return true;
  } catch (error) {
    console.error('Directory validation failed:', error);
    return false;
  }
} 