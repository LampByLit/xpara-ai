import { NextResponse } from 'next/server';
import fs from 'fs';
import { paths, ensureDirectories, validateDirectories } from '@/app/lib/utils/paths';

export async function GET() {
  try {
    console.log('=== Thread Count Debug Info ===');
    console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'local');
    console.log('Current working directory:', process.cwd());
    console.log('Project root:', process.env.RAILWAY_ENVIRONMENT === 'production' ? '/app' : process.cwd());
    
    // Ensure directories exist
    console.log('Ensuring directories exist...');
    ensureDirectories();
    
    // Validate directory permissions
    console.log('Validating directory permissions...');
    const isValid = validateDirectories();
    console.log('Directory validation result:', isValid);

    // Use paths utility to get threads directory
    const threadsDir = paths.threadsDir;
    console.log('Threads directory path:', threadsDir);
    
    // Check if directory exists
    const dirExists = fs.existsSync(threadsDir);
    console.log('Directory exists:', dirExists);
    
    if (!dirExists) {
      console.log('Directory does not exist, returning count 0');
      return NextResponse.json({ 
        count: 0, 
        exists: false,
        debug: {
          environment: process.env.RAILWAY_ENVIRONMENT || 'local',
          cwd: process.cwd(),
          threadsDir,
          dirExists,
          isValid
        }
      });
    }

    // List directory contents
    const allFiles = fs.readdirSync(threadsDir);
    console.log('All files in directory:', allFiles);

    // Filter JSON files
    const jsonFiles = allFiles.filter(file => file.endsWith('.json'));
    console.log('JSON files count:', jsonFiles.length);
    
    // Try to read the first JSON file to verify permissions
    if (jsonFiles.length > 0) {
      try {
        // Just read the file to test permissions, no need to store the content
        fs.readFileSync(`${threadsDir}/${jsonFiles[0]}`, 'utf-8');
        console.log('Successfully read first JSON file');
      } catch (error) {
        console.error('Failed to read first JSON file:', error);
      }
    }
    
    return NextResponse.json({
      count: jsonFiles.length,
      exists: true,
      debug: {
        environment: process.env.RAILWAY_ENVIRONMENT || 'local',
        cwd: process.cwd(),
        threadsDir,
        dirExists,
        isValid,
        fileCount: allFiles.length,
        jsonCount: jsonFiles.length
      }
    });
  } catch (error: unknown) {
    console.error('=== Thread Count Error ===');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return NextResponse.json(
        { 
          error: 'Failed to get thread count', 
          details: error.message,
          stack: error.stack,
          debug: {
            environment: process.env.RAILWAY_ENVIRONMENT || 'local',
            cwd: process.cwd()
          }
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to get thread count' },
      { status: 500 }
    );
  }
} 