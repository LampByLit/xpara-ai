import { NextResponse } from 'next/server';
import { paths } from '@/app/utils/paths';
import path from 'path';
import fs from 'fs/promises';
import { ArticleAnalysis } from '@/app/types/article';
import { ensureDir } from '@/app/utils/fs';

export async function GET() {
  try {
    const articlesDir = path.resolve(paths.dataDir, 'articles');
    
    // Ensure the directory exists
    await ensureDir(articlesDir);
    
    // Check if directory is empty
    const files = await fs.readdir(articlesDir);
    if (files.length === 0) {
      return NextResponse.json({ articles: [] });
    }
    
    const articles: ArticleAnalysis[] = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const content = await fs.readFile(
        path.resolve(articlesDir, file),
        'utf-8'
      );
      
      const article = JSON.parse(content);
      articles.push(article);
    }
    
    // Sort by generated timestamp, most recent first
    articles.sort((a, b) => b.generatedAt - a.generatedAt);
    
    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error loading articles:', error);
    return NextResponse.json(
      { error: 'Failed to load articles' },
      { status: 500 }
    );
  }
} 