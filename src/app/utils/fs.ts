/**
 * Safe file system operations with proper error handling
 */

import { mkdir, writeFile, readFile, unlink, chmod } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { getDataDir } from './env';
import { rename, readdir } from 'fs/promises';

// Define known subdirectories
export const KNOWN_DIRS = [
  '',  // base data dir
  'threads',
  'summaries',
  'analysis',
  'media',
  'media-op',
  'logs',
  'articles',
  'analysis/get',
  'analysis/reply',
  'analysis/link',
  'analysis/geo',
  'analysis/slur',
  'analysis/media'
] as const;

type KnownDir = typeof KNOWN_DIRS[number];

/**
 * Ensures a directory exists, creating it if necessary
 * Returns the full path to the directory
 */
export async function ensureDir(subPath?: KnownDir | string): Promise<string> {
  const baseDir = getDataDir();
  const dirPath = subPath ? resolve(baseDir, subPath) : baseDir;
  
  try {
    await mkdir(dirPath, { recursive: true });
    
    // Set directory permissions in Railway
    if (process.env.RAILWAY_ENVIRONMENT === 'production') {
      await chmod(dirPath, 0o777);
    }
    
    return dirPath;
  } catch (error) {
    // EEXIST means directory already exists - that's fine
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      // Still try to set permissions
      if (process.env.RAILWAY_ENVIRONMENT === 'production') {
        await chmod(dirPath, 0o777).catch(() => {});
      }
      return dirPath;
    }
    throw error;
  }
}

/**
 * Safely writes data to a file using a temporary file
 */
export async function safeWriteFile(
  filePath: string,
  data: unknown,
  options: { ensureDirectory?: boolean } = {}
): Promise<void> {
  const { ensureDirectory = true } = options;
  const tempPath = `${filePath}.tmp`;

  try {
    // Ensure the directory exists if requested
    if (ensureDirectory) {
      await ensureDir(resolve(filePath, '..'));
    }

    // Write to temporary file first
    await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');

    // Set file permissions in Railway
    if (process.env.RAILWAY_ENVIRONMENT === 'production') {
      await chmod(tempPath, 0o666);
    }

    // Rename temporary file to target file (atomic operation)
    await rename(tempPath, filePath);

    // Set permissions on final file in Railway
    if (process.env.RAILWAY_ENVIRONMENT === 'production') {
      await chmod(filePath, 0o666);
    }
  } catch (error) {
    // Clean up temporary file if it exists
    try {
      if (existsSync(tempPath)) {
        await unlink(tempPath);
      }
    } catch (cleanupError) {
      console.error('Failed to clean up temporary file:', cleanupError);
    }
    throw error;
  }
}

/**
 * Safely reads and parses a JSON file
 */
export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Safely deletes a file if it exists
 */
export async function safeDeleteFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Lists all files in a directory with the given extension
 */
export async function listFiles(dir: string, ext?: string): Promise<string[]> {
  try {
    const files = await readdir(dir);
    if (ext) {
      return files.filter(f => f.endsWith(ext));
    }
    return files;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
} 