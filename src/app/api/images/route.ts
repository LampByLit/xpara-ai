import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { paths } from '@/app/utils/paths';
import { MediaCategory } from '@/app/lib/analyzers/media/types';

export async function GET(request: NextRequest) {
  try {
    // Get all image files from both OP and random directories
    const opDir = path.resolve(paths.dataDir, 'media', MediaCategory.OP);
    const randomDir = path.resolve(paths.dataDir, 'media', MediaCategory.RANDOM);

    // Create directories if they don't exist
    [opDir, randomDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Check if a specific image is requested
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('file');

    if (filename) {
      // Try both directories
      let imagePath = path.resolve(opDir, filename);
      let normalizedPath = path.normalize(imagePath);

      // If not in OP directory, try random directory
      if (!fs.existsSync(normalizedPath)) {
        imagePath = path.resolve(randomDir, filename);
        normalizedPath = path.normalize(imagePath);
      }

      // Security check: ensure the file exists and is within the media directories
      if (!normalizedPath.startsWith(opDir) && !normalizedPath.startsWith(randomDir)) {
        console.error('Security: Attempted path traversal:', normalizedPath);
        return new Response('Not Found', { status: 404 });
      }

      // Check if file exists
      if (!fs.existsSync(normalizedPath)) {
        console.error('File not found:', normalizedPath);
        return new Response('Not Found', { status: 404 });
      }

      // Read and serve the image
      const fileBuffer = await fs.promises.readFile(normalizedPath);
      const ext = path.extname(normalizedPath).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

      return new Response(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        },
      });
    }

    // List all images from both directories
    const opFiles = fs.existsSync(opDir) ? fs.readdirSync(opDir) : [];
    const randomFiles = fs.existsSync(randomDir) ? fs.readdirSync(randomDir) : [];
    
    // Combine and filter for image files
    const allImages = [...opFiles, ...randomFiles].filter(file => 
      ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase())
    );

    // Sort by timestamp (newest first)
    allImages.sort((a, b) => {
      const timestampA = parseInt(a.split('_')[0]);
      const timestampB = parseInt(b.split('_')[0]);
      return timestampB - timestampA;
    });

    return new Response(JSON.stringify({ images: allImages }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling image request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 