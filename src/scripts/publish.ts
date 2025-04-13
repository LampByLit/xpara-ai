import fs from 'fs/promises';
import path from 'path';
import { paths } from '../app/lib/utils/paths';

async function publishArticles() {
  try {
    console.log('Starting publisher...');
    
    // Read all article files
    const articlesDir = paths.articlesDir;
    const files = await fs.readdir(articlesDir);
    const articles = [];
    
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
    
    // Create the HTML content
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Articles JSON Data</title>
    <meta charset="utf-8">
</head>
<body>
    <pre style="word-wrap: break-word; white-space: pre-wrap;">
${JSON.stringify({ articles }, null, 2)}
    </pre>
</body>
</html>`;

    // Ensure the public directory exists
    const publicDir = path.resolve(process.cwd(), 'public');
    await fs.mkdir(publicDir, { recursive: true });
    
    // Write the file
    const outputPath = path.resolve(publicDir, 'publish.html');
    await fs.writeFile(outputPath, htmlContent, 'utf-8');
    
    console.log('Published articles to:', outputPath);
  } catch (error) {
    console.error('Failed to publish articles:', error);
    process.exit(1);
  }
}

// Run the publisher
publishArticles(); 