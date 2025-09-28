# 🎵 YouTube Mixer

A modern web application for managing dual YouTube playlists with AI-powered video recommendations. No YouTube API required - works entirely through embedded iframes and intelligent content suggestions.

![YouTube Mixer Interface](https://github.com/user-attachments/assets/d7a77d37-7716-4c68-ae2b-bdded105c6c0)

## ✨ Features

### 🎬 Dual Playlist Management
- **Side-by-side playlists**: Manage two independent YouTube playlists (A & B)
- **Easy video addition**: Paste YouTube URLs directly into playlist forms
- **Playlist controls**: Play, remove, reorder videos with intuitive buttons
- **Swap functionality**: Instantly swap content between playlists
- **Persistent storage**: Playlists are saved locally in browser storage

### 🤖 AI-Powered Recommendations
- **Smart suggestions**: Get personalized video recommendations based on your playlist history
- **Multiple AI providers**: Choose from various LLM services:
  - **WebSim** (default, no setup required)
  - **GitHub Models** (free tier available)
  - **OpenAI** (GPT models)
  - **Hugging Face** (open source models)
- **Context-aware**: AI understands your viewing patterns and suggests relevant content
- **Fallback search**: When direct suggestions aren't available, get YouTube search links

### 🎨 User Experience
- **Dark/Light themes**: Toggle between themes with persistent preference
- **Responsive design**: Works on desktop and mobile devices
- **Italian interface**: Fully localized for Italian users
- **Real-time validation**: Automatic video availability checking
- **Notification system**: Clear feedback for all user actions

### 🔧 Technical Features
- **No API dependencies**: Works without YouTube API keys
- **Client-side only**: Pure HTML/CSS/JavaScript application
- **Modern ES6 modules**: Clean, modular code architecture
- **Local storage**: All data persists in browser storage
- **iframe embedding**: Secure video playback through YouTube's embed system

## 🚀 Getting Started

### Prerequisites
- Modern web browser with ES6 module support
- No server setup required - runs as static files

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/davvoz/youtube_mixer.git
   cd youtube_mixer
   ```

2. **Serve the files** (required for ES6 modules):
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open your browser**:
   Navigate to `http://localhost:8000`

### Basic Usage

1. **Add videos**: Paste YouTube URLs into the "Incolla URL YouTube" fields
2. **Manage playlists**: Use the ➕ button to add, and playlist controls to manage videos
3. **Get recommendations**: Click "💡 Suggerisci" or describe what you want to watch
4. **Customize**: Use ⚙️ Impostazioni to configure AI providers and themes

## ⚙️ Configuration

### Setting up AI Providers

Access the settings panel by clicking the ⚙️ **Impostazioni** button.

#### WebSim (Default)
- ✅ **No setup required**
- Works out of the box for basic recommendations

#### GitHub Models
1. Get a GitHub token from [GitHub Settings](https://github.com/settings/tokens)
2. Enter your token in the GitHub Token field
3. Select your preferred model from the dropdown
4. Click "🔄 Aggiorna Modelli" to load available models

#### OpenAI
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Enter your API key in the OpenAI field
3. Select your preferred model (GPT-3.5, GPT-4, etc.)

#### Hugging Face
1. Create an account at [Hugging Face](https://huggingface.co)
2. Generate an API token from your settings
3. Enter the token and select from popular models

### Theme Configuration
- Click 🌙 **Dark** / ☀️ **Light** to toggle themes
- Preference is automatically saved

## 🛠️ Technical Architecture

### Project Structure
```
youtube_mixer/
├── index.html              # Main application HTML
├── main.js                 # Application entry point
├── styles.css              # Application styles
└── scripts/
    ├── services/
    │   ├── llmProviders.js       # AI provider integrations
    │   └── recommendationService.js # Video suggestion logic
    ├── state/
    │   ├── chatState.js          # Chat history management
    │   ├── llmState.js           # AI provider configuration
    │   └── playlistState.js     # Playlist data management
    ├── ui/
    │   ├── chat.js               # Chat interface components
    │   ├── domRefs.js            # DOM element references
    │   ├── playlistRenderer.js   # Playlist UI rendering
    │   ├── settings.js           # Settings modal logic
    │   └── theme.js              # Theme switching
    └── utils/
        ├── notifications.js      # User notification system
        └── youtube.js            # YouTube URL parsing utilities
```

### Key Technologies
- **ES6 Modules**: Modern JavaScript module system
- **Local Storage API**: Client-side data persistence
- **Fetch API**: HTTP requests for AI providers
- **YouTube Embed API**: Video playback through iframes
- **CSS Grid/Flexbox**: Responsive layout system

### Data Flow
1. **User adds video** → URL validation → Video availability check → Playlist update → UI refresh
2. **AI recommendation** → Context gathering → LLM API call → Response validation → Suggestion display
3. **Settings change** → Configuration update → Local storage → UI refresh

## 🔒 Privacy & Security

- **No data collection**: All data stays in your browser
- **Local storage only**: Playlists and settings never leave your device
- **API key security**: Credentials stored locally, transmitted only to chosen providers
- **No tracking**: No analytics or tracking scripts
- **CORS-compliant**: Secure cross-origin requests to AI providers

## 🤝 Contributing

Contributions are welcome! Here's how to get involved:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly in multiple browsers
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Coding Standards
- Use ES6+ features and modules
- Follow existing code style and naming conventions
- Add comments for complex logic
- Test in multiple browsers
- Keep functions small and focused

### Areas for Contribution
- 🌍 **Internationalization**: Add support for more languages
- 🎨 **UI/UX improvements**: Enhanced designs and user experience
- 🤖 **AI providers**: Integration with additional LLM services
- 📱 **Mobile optimization**: Enhanced mobile experience
- 🔧 **Features**: Video search, advanced playlist management, export/import
- 🐛 **Bug fixes**: Report and fix issues
- 📚 **Documentation**: Improve and expand documentation

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- YouTube for providing the embed API
- AI provider services for recommendation capabilities
- The open source community for inspiration and best practices

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/davvoz/youtube_mixer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/davvoz/youtube_mixer/discussions)

---

Made with ❤️ for music and video enthusiasts who want better playlist management with intelligent recommendations.