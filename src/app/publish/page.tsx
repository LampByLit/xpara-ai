import fs from 'fs';
import path from 'path';

// This is a server component that will serve the published HTML
export default function PublishPage() {
  // Read the published HTML file
  const htmlPath = path.resolve(process.cwd(), 'public', 'publish.html');
  
  // If the file doesn't exist, show a message
  if (!fs.existsSync(htmlPath)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>No published data available</h1>
        <p>Run the summarizer to generate and publish data.</p>
      </div>
    );
  }

  // Read and return the HTML content
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  
  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
} 