import { NextResponse } from 'next/server';
import { paths } from '@/app/utils/paths';
import path from 'path';
import fs from 'fs/promises';
import { DelusionalMatrix } from '@/app/types/delusional';

export async function GET() {
  try {
    const matrixPath = path.resolve(paths.dataDir, 'analysis', 'delusional.json');
    const content = await fs.readFile(matrixPath, 'utf-8');
    const matrix = JSON.parse(content) as DelusionalMatrix;
    
    return NextResponse.json(matrix);
  } catch (error) {
    console.error('Error loading matrix:', error);
    return NextResponse.json(
      { error: 'Failed to load matrix data' },
      { status: 500 }
    );
  }
} 