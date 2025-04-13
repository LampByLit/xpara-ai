/**
 * Centralized path management for the application
 * 
 * This utility ensures consistent path handling across all environments
 * (local development, production, Railway deployment)
 */

import path from 'path';
import fs from 'fs';

// Debug logging function
function logPathInfo(label: string, value: string) {
  console.log(`[PATHS] ${label}: ${value}`);
}

// Detect if we're running on Railway
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';

// In Railway, ALWAYS use /data as the root directory for persistent storage
// In local development, use a data directory in the project root
const DATA_DIR = isRailway ? '/data' : path.resolve(process.cwd(), 'data');

// Log environment information
logPathInfo('Environment', isRailway ? 'Railway' : 'Local');
logPathInfo('Data Directory', DATA_DIR);
logPathInfo('Process CWD', process.cwd());

// Define all application paths
export const paths = {
  // Base data directory
  dataDir: DATA_DIR,
  
  // Thread data storage
  threadsDir: path.resolve(DATA_DIR, 'threads'),
  
  // Summary data storage
  summariesDir: path.resolve(DATA_DIR, 'summaries'),
  
  // Analysis data storage
  analysisDir: path.resolve(DATA_DIR, 'analysis'),
  
  // Media storage
  mediaDir: path.resolve(DATA_DIR, 'media'),
  
  // Articles storage
  articlesDir: path.resolve(DATA_DIR, 'articles'),
  
  // Helper to get thread file path by ID
  threadFile: (threadId: string) => path.resolve(DATA_DIR, 'threads', `${threadId}.json`),
  
  // Helper to get summary file path by ID
  summaryFile: (threadId: string) => path.resolve(DATA_DIR, 'summaries', `${threadId}.json`),
  
  // Helper to get analyzer results file path
  analyzerResultsFile: (analyzer: string) => path.resolve(DATA_DIR, 'analysis', analyzer, 'results.json'),
};

console.log('DEBUG - Threads Dir:', paths.threadsDir);

/**
 * Ensures all required directories exist
 * This should be called during application startup
 */
export function ensureDirectories(): void {
  const requiredDirs = [
    paths.dataDir,
    paths.threadsDir,
    paths.summariesDir,
    paths.analysisDir,
    paths.mediaDir,
    path.resolve(paths.analysisDir, 'slur'),
    path.resolve(paths.mediaDir, 'OP'),
  ];

  requiredDirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Set proper permissions in Railway environment
      if (isRailway) {
        try {
          // First try to set owner permissions
          fs.chmodSync(dir, 0o755);
          console.log(`Set initial permissions (755) for ${dir}`);
          
          // If that works, try for wider permissions
          fs.chmodSync(dir, 0o777);
          console.log(`Set full permissions (777) for ${dir}`);
          
          // Verify the permissions
          const stats = fs.statSync(dir);
          console.log(`Final permissions for ${dir}:`, stats.mode.toString(8));
        } catch (error) {
          console.error(`Failed to set permissions for ${dir}:`, error);
          // Try alternative permission setting
          try {
            fs.chmodSync(dir, 0o755);
            console.log(`Set alternative permissions (755) for ${dir}`);
          } catch (altError) {
            console.error(`Failed to set alternative permissions for ${dir}:`, altError);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to create or set permissions for ${dir}:`, error);
    }
  });
}

/**
 * Validates write permissions for all data directories
 * Returns true if all directories are writable
 */
export function validateDirectories(): boolean {
  const results: { [key: string]: boolean } = {};
  
  try {
    // Check each directory
    [paths.dataDir, paths.threadsDir, paths.summariesDir, paths.mediaDir].forEach(dir => {
      console.log(`Validating directory: ${dir}`);
      
      // Check existence
      const exists = fs.existsSync(dir);
      console.log(`- Directory exists: ${exists}`);
      
      if (!exists) {
        results[dir] = false;
        return;
      }
      
      // Check permissions
      try {
        const testFile = path.join(dir, '.write-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log(`- Write test successful`);
        results[dir] = true;
      } catch (error) {
        console.error(`- Write test failed:`, error);
        results[dir] = false;
      }
      
      // Get directory stats
      try {
        const stats = fs.statSync(dir);
        console.log(`- Directory permissions:`, stats.mode.toString(8));
      } catch (error) {
        console.error(`- Failed to get directory stats:`, error);
      }
    });
    
    // Log validation results
    console.log('Directory validation results:', results);
    
    // Return true only if all directories are valid
    return Object.values(results).every(result => result === true);
  } catch (error) {
    console.error('Directory validation failed:', error);
    return false;
  }
} 