# OpenNapkinAI 🎨

An open-source alternative to Napkin AI that transforms your text into compelling visuals. Share your ideas quickly and effectively with automatically generated diagrams, sketches, and visual representations.

## 📹 Demo Video

Check out a quick demo of OpenNapkinAI in action:

[![Watch the video](https://img.youtube.com/vi/LYRLmw00Zyc/maxresdefault.jpg)](https://youtu.be/LYRLmw00Zyc)


## ✨ Features

- **Text-to-Visual Generation**: Convert your written ideas into visual diagrams and sketches
- **Multiple AI Models**: Support for Ollama with `gemma4:cloud` recommended, plus Anthropic models
- **Rich Text Editor**: Powered by EditorJS for seamless content creation
- **Hand-drawn Style**: Beautiful sketchy visuals using RoughJS
- **Fast & Responsive**: Built with modern web technologies
- **Open Source**: Completely free and customizable

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/genaiwithshubham/opennapkinai.git
cd opennapkinai
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Express.js
- **AI Integration**: Vercel AI SDK
- **Text Editor**: EditorJS
- **Graphics**: RoughJS for hand-drawn style visuals
- **AI Models**: Ollama (`gemma4:cloud` recommended) & Anthropic Claude

## ⚙️ Configuration

### AI Models Setup

The AI integration is handled in `apps/backend/src/routes/ai.ts`.

#### Recommended Ollama Model

This project uses `gemma4:cloud` as the default and recommended Ollama model. It is the best choice for this codebase's structured output workflows, including:

- Bullet point extraction
- SmartArt structure generation
- JSON schema-constrained responses with the Vercel AI SDK

#### Why `gemma4:cloud`

- Strong structured output performance for JSON generation
- Better instruction-following for schema-based responses
- Good fit for `generateObject` workflows
- Works well through Ollama's OpenAI-compatible `/v1` endpoint

#### Ollama Setup
1. Install Ollama on your system
2. Ensure Ollama is running and accessible via `OLLAMA_HOST`
3. Use `gemma4:cloud` in `apps/backend/src/routes/ai.ts`

#### Anthropic
1. Get your API key from Anthropic
2. Set the `ANTHROPIC_API_KEY` environment variable
3. Configure the model settings in the AI route if you want to switch providers

### Environment Variables

Create a `.env` file in the root directory:

```env
# Anthropic API Key (if using Anthropic models)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma4:cloud

# Other configurations
PORT=3000
NODE_ENV=development
```

## 📁 Project Structure

```
opennapkinai/
├── apps/
│   ├── frontend/          # React frontend application
│   └── backend/           # Express.js backend
│       └── src/
│           └── routes/
│               └── ai.ts  # AI model integration
├── packages/              # Shared packages
├── docs/                 # Documentation
├── README.md
└── package.json
```

## 🎯 How It Works

1. **Input**: Write your text or ideas in the rich text editor
2. **Processing**: AI models analyze your content and determine the best visual representation
3. **Generation**: RoughJS creates hand-drawn style diagrams and sketches
4. **Output**: Beautiful, shareable visuals that communicate your ideas effectively

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Napkin AI
- Built with amazing open-source technologies
- Thanks to all contributors and the open-source community

## 🗺️ Roadmap

- [ ] Additional AI model support
- [ ] Export to various formats (SVG, PNG, PDF)
- [ ] Collaborative editing
- [ ] Template library
- [ ] Mobile app
- [ ] API for third-party integrations

---

Made with ❤️ by the `genaiwithshubh` community