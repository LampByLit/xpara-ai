import { NextResponse } from 'next/server';
import { paths } from '@/app/utils/paths';
import path from 'path';
import fs from 'fs/promises';
import { DelusionalTrend } from '@/app/types/delusional';

export async function GET() {
  try {
    const trendsPath = path.resolve(paths.dataDir, 'analysis', 'delusional-trends.json');
    const content = await fs.readFile(trendsPath, 'utf-8');
    const trends = JSON.parse(content) as DelusionalTrend[];
    
    return NextResponse.json({ trends });
  } catch (error) {
    console.error('Error loading trends:', error);
    return NextResponse.json(
      { error: 'Failed to load trend data' },
      { status: 500 }
    );
  }
} 