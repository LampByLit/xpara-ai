# xpara-ai 🔮

AI-powered analysis and summarization tool for 4chan's /x/ paranormal board. This tool scrapes, analyzes, and summarizes discussions about paranormal phenomena, conspiracy theories, and unexplained events.

## Features 🌟

- Real-time scraping of 4chan's /x/ board
- AI-powered summarization of threads using DeepSeek AI
- Content analysis and trend detection
- Material Design UI for easy navigation
- Automated data collection and processing
- Persistent data storage using Railway Volumes

## Tech Stack 💻

- Next.js 15.2 with App Router
- TypeScript
- Material Design UI
- Railway.app deployment
- DeepSeek AI for summarization

## Getting Started 🚀

### Prerequisites

- Node.js 18+
- npm or yarn
- DeepSeek AI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hxkm/xpara-ai.git
cd xpara-ai
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```env
DEEPSEEK_API_KEY=your_api_key_here
DATA_DIR=./data
```

4. Start the development server:
```bash
npm run dev
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run scrape` - Run the /x/ board scraper
- `npm run summarize` - Generate summaries for collected threads
- `npm run schedule` - Run scheduled tasks
- `npm run cleanup` - Clean up data directories

## Project Structure 📁

```
/
├── app/
│   ├── components/    # React components
│   ├── lib/          # Core functionality
│   ├── utils/        # Utility functions
│   └── types/        # TypeScript types
├── data/            # Persistent storage
│   ├── threads/     # Raw thread data
│   ├── summaries/   # AI-generated summaries
│   └── analysis/    # Analysis results
├── scripts/         # Utility scripts
└── public/          # Static assets
```

## Deployment 🚀

This project is designed to be deployed on Railway.app. The deployment process is automated through GitHub integration.

### Railway Configuration

- Uses Nixpacks for builds
- Requires a persistent volume mounted at `/data`
- Environment variables must be configured in Railway dashboard

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- Built with Next.js
- Powered by DeepSeek AI
- Deployed on Railway.app
