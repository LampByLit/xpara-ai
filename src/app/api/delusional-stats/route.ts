import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { paths } from '@/app/utils/paths';

interface DelusionalStats {
  statistics: {
    analyzedComments: number;
    delusionalComments: number;
    percentage: number;
  };
  generatedAt: number;
}

type TrendDirection = 'up' | 'down' | 'stable';

interface TrendInfo {
  direction: TrendDirection;
  amount: number;
}

export async function GET() {
  try {
    const statsPath = path.resolve(paths.dataDir, 'analysis', 'latest-delusional.json');
    
    // Check if file exists
    try {
      await fs.access(statsPath);
    } catch {
      return NextResponse.json({
        level: 'low',
        percentage: 0,
        trend: {
          direction: 'stable' as TrendDirection,
          amount: 0
        }
      });
    }

    // Read current stats
    const currentStatsRaw = await fs.readFile(statsPath, 'utf-8');
    const currentStats: DelusionalStats = JSON.parse(currentStatsRaw);

    // Read previous stats if they exist
    const previousStatsPath = path.resolve(paths.dataDir, 'analysis', 'previous-delusional.json');
    let previousStats: DelusionalStats | null = null;
    
    try {
      const previousStatsRaw = await fs.readFile(previousStatsPath, 'utf-8');
      previousStats = JSON.parse(previousStatsRaw);
    } catch {
      // Previous stats don't exist, that's okay
    }

    // Calculate trend
    const trend: TrendInfo = {
      direction: 'stable',
      amount: 0
    };

    if (previousStats) {
      const diff = currentStats.statistics.percentage - previousStats.statistics.percentage;
      trend.direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
      trend.amount = Math.abs(diff);
    }

    // Determine level based on percentage
    let level: 'low' | 'medium' | 'high' | 'extreme';
    const percentage = currentStats.statistics.percentage;

    if (percentage < 25) {
      level = 'low';
    } else if (percentage < 50) {
      level = 'medium';
    } else if (percentage < 75) {
      level = 'high';
    } else {
      level = 'extreme';
    }

    return NextResponse.json({
      level,
      percentage,
      trend
    });

  } catch (error) {
    console.error('Error in delusional-stats route:', error);
    return NextResponse.json({
      level: 'low',
      percentage: 0,
      trend: {
        direction: 'stable' as TrendDirection,
        amount: 0
      }
    });
  }
} 