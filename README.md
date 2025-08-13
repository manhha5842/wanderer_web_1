# 🚶‍♂️ Walking Stories App

A Progressive Web App (PWA) that transforms your walking experience with GPS tracking, AI-generated stories, and audio narration. Make every walk an adventure!

## ✨ Features

- **GPS Route Planning**: Calculate walking routes with Google Maps
- **AI Story Generation**: Dynamic stories created by Google Gemini AI based on your route
- **Audio Narration**: Text-to-speech with customizable voices and playback settings
- **Real-time Tracking**: Live GPS tracking with checkpoint detection
- **Trip History**: Save and review your walking adventures
- **PWA Support**: Install as a native app on mobile devices
- **Offline Capability**: Basic offline support with caching

## 🛠️ Tech Stack

- **Frontend**: React.js + Vite
- **Maps**: Google Maps JavaScript API
- **AI**: Google Gemini API
- **Audio**: Web Speech Synthesis API
- **Storage**: IndexedDB (with idb library)
- **Icons**: Lucide React

## 📋 Prerequisites

Before you start, you'll need:

1. **Node.js** (v16 or higher)
2. **Google Maps API Key** (from Google Cloud Console)
3. **Google Gemini API Key** (from AI Studio)

### Getting API Keys

#### Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
4. Create credentials (API Key)
5. Restrict the key to your domain for security

#### Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Note: Free tier has daily quotas

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd wanderer_web
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:

   ```
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:5173`
   - For mobile testing, use your local IP address (e.g., `http://192.168.1.100:5173`)

## 📱 Mobile Testing

For the best experience, test on actual mobile devices:

1. **Find your local IP address**

   ```bash
   # Windows
   ipconfig

   # macOS/Linux
   ifconfig
   ```

2. **Access from mobile browser**

   - Open `http://YOUR_IP_ADDRESS:5173` on your mobile device
   - Allow location permissions when prompted

3. **Install as PWA**
   - In Chrome/Safari, use "Add to Home Screen" option
   - The app will behave like a native mobile app

## 🏗️ Building for Production

1. **Build the app**

   ```bash
   npm run build
   ```

2. **Preview production build**

   ```bash
   npm run preview
   ```

3. **Deploy**
   - Upload `dist` folder to your hosting service
   - Recommended: Netlify or Vercel for free hosting

## 🔧 Configuration

### Environment Variables

- `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps API key
- `VITE_GEMINI_API_KEY`: Your Google Gemini API key
- `VITE_SUPABASE_URL`: (Optional) Supabase project URL for cloud storage
- `VITE_SUPABASE_ANON_KEY`: (Optional) Supabase anonymous key

### Customization

- Modify story prompts in `src/utils/gemini.js`
- Adjust GPS tracking sensitivity in `src/utils/maps.js`
- Customize audio settings in `src/utils/audio.js`

## 📖 How to Use

1. **Plan Your Route**

   - Enter starting location (or use current location)
   - Choose destination or select round trip
   - Set number of story checkpoints (2-5)

2. **Start Walking**

   - Follow the route on the map
   - Listen to AI-generated story chapters
   - Reach checkpoints to trigger new chapters

3. **Complete Your Adventure**
   - View trip summary with stats
   - Save to history
   - Share your adventure

## 🎯 Core Components

- **RouteSelector**: Route planning and story generation
- **MapView**: Real-time GPS tracking and navigation
- **AudioPlayer**: Text-to-speech audio playback
- **TripSummary**: Post-walk statistics and summary
- **TripHistory**: View past walking adventures

## 🛠️ Development

### Project Structure

```
src/
├── components/          # React components
├── utils/              # Utility functions
│   ├── maps.js         # Google Maps integration
│   ├── gemini.js       # AI story generation
│   ├── audio.js        # Text-to-speech
│   └── database.js     # IndexedDB operations
├── App.jsx             # Main app component
└── main.jsx            # App entry point
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## 🐛 Troubleshooting

### Common Issues

**"Failed to load Google Maps"**

- Check your Google Maps API key
- Ensure APIs are enabled in Google Cloud Console
- Verify domain restrictions

**"Story generation failed"**

- Check Gemini API key
- Verify you haven't exceeded daily quota
- Check internet connection

**"Location not working"**

- Enable location permissions in browser
- Use HTTPS (required for geolocation)
- Check if device has GPS capability

**Audio not playing**

- Ensure browser supports Web Speech API
- Check device volume settings
- Try different voice options

### Performance Tips

- Use on WiFi for initial story generation
- Pre-generate stories for offline use
- Clear old trip data periodically

## 🔐 Privacy & Security

- Location data is processed locally on device
- Trip history stored in browser's IndexedDB
- API keys should be restricted to your domain
- Consider implementing user authentication for cloud sync

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on mobile
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎉 Future Enhancements

- Multi-language story generation
- Social sharing features
- Integration with fitness trackers
- Voice commands for hands-free operation
- Offline story caching
- User accounts and cloud sync
- Custom story templates
- Group walking features

## 📞 Support

If you encounter issues or have questions:

1. Check this README for common solutions
2. Review the browser console for error messages
3. Ensure all API keys are properly configured
4. Test on different devices/browsers

---

**Made with ❤️ for walking enthusiasts who love a good story!**+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
