# Walking Stories App - Setup Guide

## Quick Setup Instructions

### 1. API Keys Required

You need two API keys to run this app:

#### Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
4. Create credentials (API Key)
5. Optional: Restrict key to your domain

#### Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Free tier available with daily quotas

### 2. Environment Setup

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file and add your API keys:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

### 3. Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 4. Mobile Testing

For mobile testing, find your local IP address:

**Windows:**

```cmd
ipconfig
```

**macOS/Linux:**

```bash
ifconfig
```

Then access `http://YOUR_IP:5173` from your mobile browser.

### 5. Important Notes

- **Location permissions** are required for GPS tracking
- **HTTPS** is required for geolocation API (dev server provides this)
- Test on actual mobile devices for best experience
- Allow location access when prompted
- Consider installing as PWA using "Add to Home Screen"

### 6. Troubleshooting

**Google Maps not loading:**

- Check API key is correct
- Verify APIs are enabled in Google Cloud Console
- Check browser console for errors

**Gemini API errors:**

- Verify API key is valid
- Check daily quota limits
- Ensure internet connection

**Location not working:**

- Grant location permissions
- Use HTTPS (automatic in dev mode)
- Test on different devices

### 7. Production Deployment

For production deployment:

1. Build the app: `npm run build`
2. Upload `dist` folder to your hosting service
3. Ensure HTTPS is enabled
4. Configure domain restrictions for API keys

**Recommended hosting:**

- Netlify (free tier available)
- Vercel (free tier available)
- GitHub Pages (with custom domain for HTTPS)

### 8. Features Overview

- 📍 **GPS Route Planning** - Calculate walking routes
- 🤖 **AI Stories** - Dynamic story generation based on location
- 🔊 **Audio Narration** - Text-to-speech with voice options
- 📱 **PWA Ready** - Install as native mobile app
- 📊 **Trip Tracking** - Save and review walking history
- 🗺️ **Real-time Maps** - Live GPS tracking with checkpoints

Enjoy your walking adventures! 🚶‍♂️✨
