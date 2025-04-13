import { Thread, Post } from '../../../types/interfaces';
import { BaseAnalyzer } from '../base';
import { MediaAnalyzerResult, MediaFile, MediaCategory, CategoryStats } from './types';
import fs from 'fs';
import path from 'path';
import { paths } from '@/app/utils/paths';
import axios from 'axios';
import crypto from 'crypto';

/**
 * Analyzer for downloading and managing media files from /x/ board
 */
export class MediaAnalyzer extends BaseAnalyzer<MediaAnalyzerResult> {
  name = 'media';
  description = 'Downloads and manages media files from threads';

  // Base URL for 4chan media
  private static MEDIA_BASE_URL = 'https://i.4cdn.org/x';

  // Maximum age of files (72 hours in milliseconds)
  private static MAX_FILE_AGE = 72 * 60 * 60 * 1000;

  // Maximum number of random images to keep
  private static MAX_RANDOM_IMAGES = 100;

  // Maximum number of recent files to track in results
  private static MAX_RECENT_FILES = 100;

  // Map to track downloaded files by MD5
  private fileHashes = new Map<string, string>();
  private hashStoragePath: string;

  constructor() {
    super();
    this.hashStoragePath = path.resolve(paths.dataDir, 'media', 'hashes.json');
    this.loadHashes(); // Load existing hashes on instantiation
  }

  /**
   * Load existing file hashes from storage
   */
  private async loadHashes(): Promise<void> {
    try {
      if (fs.existsSync(this.hashStoragePath)) {
        const data = await fs.promises.readFile(this.hashStoragePath, 'utf-8');
        const hashes = JSON.parse(data);
        this.fileHashes = new Map(Object.entries(hashes));
        console.log(`Loaded ${this.fileHashes.size} existing file hashes`);
      }
    } catch (error) {
      console.error('Error loading file hashes:', error);
      // Continue with empty hash map if load fails
    }
  }

  /**
   * Save file hashes to persistent storage
   */
  private async saveHashes(): Promise<void> {
    try {
      const hashData = Object.fromEntries(this.fileHashes);
      await fs.promises.mkdir(path.dirname(this.hashStoragePath), { recursive: true });
      await fs.promises.writeFile(
        this.hashStoragePath,
        JSON.stringify(hashData, null, 2),
        'utf-8'
      );
      console.log(`Saved ${this.fileHashes.size} file hashes`);
    } catch (error) {
      console.error('Error saving file hashes:', error);
    }
  }

  /**
   * Initialize media directories
   */
  private async initDirectories(): Promise<void> {
    try {
      const mediaDir = path.resolve(paths.dataDir, 'media');
      console.log('Creating media directory:', mediaDir);
      
      // Create main media directory first
      if (!fs.existsSync(mediaDir)) {
        await fs.promises.mkdir(mediaDir, { recursive: true });
        console.log('Created main media directory');
      }
      
      // Create category directories
      for (const category of Object.values(MediaCategory)) {
        const categoryDir = path.resolve(mediaDir, category);
        console.log('Creating category directory:', categoryDir);
        
        if (!fs.existsSync(categoryDir)) {
          await fs.promises.mkdir(categoryDir, { recursive: true });
          console.log('Created category directory:', category);
        }
      }
      
      console.log('Media directories initialized successfully');
    } catch (error) {
      console.error('Error initializing media directories:', error);
      throw error;
    }
  }

  /**
   * Determine media category based on post and file type
   */
  private categorizeFile(filename: string, ext: string, isOP: boolean): MediaCategory | null {
    // Skip video files
    if (['.webm', '.mp4', '.mov', '.avi', '.wmv', '.flv'].includes(ext.toLowerCase())) {
      return null;
    }

    // Only accept common image formats
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase())) {
      return null;
    }

    // OP images go to the OP category
    if (isOP) {
      return MediaCategory.OP;
    }

    // For random category - only accept if we haven't hit the limit
    const randomDir = path.resolve(paths.dataDir, 'media', MediaCategory.RANDOM);
    if (fs.existsSync(randomDir)) {
      const randomFiles = fs.readdirSync(randomDir);
      if (randomFiles.length >= MediaAnalyzer.MAX_RANDOM_IMAGES) {
        return null;
      }
    }
    return MediaCategory.RANDOM;
  }

  /**
   * Download a file and save it to the appropriate directory
   */
  private async downloadFile(
    post: Partial<Post> & { tim: number; ext: string; filename: string },
    category: MediaCategory,
    threadId: number
  ): Promise<MediaFile | null> {
    try {
      const url = `${MediaAnalyzer.MEDIA_BASE_URL}/${post.tim}${post.ext}`;
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      
      // Calculate MD5 hash of file content
      const hash = crypto.createHash('md5').update(response.data).digest('hex');

      // Check for duplicates
      if (this.fileHashes.has(hash)) {
        console.log(`Skipping duplicate file: ${post.filename}${post.ext}`);
        return null;
      }

      // Generate stored filename with timestamp
      const timestamp = Date.now();
      const storedName = `${timestamp}_${post.tim}${post.ext}`;
      const filePath = path.resolve(paths.dataDir, 'media', category, storedName);

      // Save file
      await fs.promises.writeFile(filePath, response.data);
      this.fileHashes.set(hash, filePath);

      // Create media file record
      const mediaFile: MediaFile = {
        filename: `${post.filename}${post.ext}`,
        storedName,
        category,
        threadId,
        postId: post.no || threadId,
        md5: hash,
        timestamp,
        fileSize: post.fsize || 0,
        width: post.w || 0,
        height: post.h || 0
      };

      return mediaFile;
    } catch (error) {
      console.error(`Error downloading file from post ${post.no || 'unknown'}:`, error);
      return null;
    }
  }

  /**
   * Remove files older than MAX_FILE_AGE
   */
  private async purgeOldFiles(): Promise<number> {
    let deletedCount = 0;
    const now = Date.now();

    for (const category of Object.values(MediaCategory)) {
      const categoryDir = path.resolve(paths.dataDir, 'media', category);
      if (!fs.existsSync(categoryDir)) continue;

      const files = await fs.promises.readdir(categoryDir);
      
      for (const file of files) {
        const filePath = path.resolve(categoryDir, file);
        const stats = await fs.promises.stat(filePath);
        
        // Check if file is older than MAX_FILE_AGE
        if (now - stats.mtimeMs > MediaAnalyzer.MAX_FILE_AGE) {
          await fs.promises.unlink(filePath);
          deletedCount++;
        }
      }
    }

    return deletedCount;
  }

  /**
   * Get statistics for each category
   */
  private async getCategoryStats(): Promise<CategoryStats[]> {
    const stats: CategoryStats[] = [];

    for (const category of Object.values(MediaCategory)) {
      const categoryDir = path.resolve(paths.dataDir, 'media', category);
      if (!fs.existsSync(categoryDir)) continue;

      const files = await fs.promises.readdir(categoryDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.resolve(categoryDir, file);
        const fileStats = await fs.promises.stat(filePath);
        totalSize += fileStats.size;
      }

      stats.push({
        category,
        fileCount: files.length,
        totalSize,
        lastUpdated: Date.now()
      });
    }

    return stats;
  }

  /**
   * Process a single thread's media
   */
  private async processThreadMedia(thread: Thread): Promise<MediaFile[]> {
    const mediaFiles: MediaFile[] = [];

    // Process OP image first
    if (thread.tim && thread.ext && thread.filename) {
      const category = this.categorizeFile(thread.filename, thread.ext, true);
      if (category) {
        const mediaFile = await this.downloadFile({
          tim: thread.tim,
          ext: thread.ext,
          filename: thread.filename,
          no: thread.no,
          fsize: thread.fsize,
          w: thread.w,
          h: thread.h
        }, category, thread.no);
        if (mediaFile) mediaFiles.push(mediaFile);
      }
    }

    // Process reply images
    if (thread.posts) {
      for (const post of thread.posts) {
        if (post.tim && post.ext && post.filename) {
          const category = this.categorizeFile(post.filename, post.ext, false);
          if (category) {
            const mediaFile = await this.downloadFile({
              tim: post.tim,
              ext: post.ext,
              filename: post.filename,
              no: post.no,
              fsize: post.fsize,
              w: post.w,
              h: post.h
            }, category, thread.no);
            if (mediaFile) mediaFiles.push(mediaFile);
          }
        }
      }
    }

    return mediaFiles;
  }

  /**
   * Main analysis function
   */
  async analyze(threads: Thread[]): Promise<MediaAnalyzerResult[]> {
    console.log('Starting media analysis...');
    await this.initDirectories();

    const results: MediaAnalyzerResult[] = [];
    const totalFiles = 0;
    let downloadedFiles = 0;
    const duplicatesSkipped = 0;

    try {
      // Process each thread
      for (const thread of threads) {
        const mediaFiles = await this.processThreadMedia(thread);
        downloadedFiles += mediaFiles.length;
        
        // Track recent files
        const recentFiles = mediaFiles
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MediaAnalyzer.MAX_RECENT_FILES);

        // Get category statistics
        const categoryStats = await this.getCategoryStats();

        // Create result object
        const result: MediaAnalyzerResult = {
          threadId: thread.no,
          postId: thread.no, // Use thread number as post ID for thread-level results
          timestamp: Date.now(),
          categoryStats,
          recentFiles,
          metadata: {
            totalFilesProcessed: totalFiles,
            filesDownloaded: downloadedFiles,
            duplicatesSkipped,
            filesDeleted: 0,
            lastPurge: Date.now()
          }
        };

        results.push(result);
      }

      // Clean up old files
      const deletedCount = await this.purgeOldFiles();
      console.log(`Deleted ${deletedCount} old files`);

      // Save hash data
      await this.saveHashes();

      return results;
    } catch (error) {
      console.error('Error in media analysis:', error);
      throw error;
    }
  }
} 