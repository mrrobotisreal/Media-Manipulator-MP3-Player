# MP3 Drive Player

A modern, responsive MP3 player that connects to Google Drive folders to stream music files directly from your Drive account. Built with React, TypeScript, Vite, and Shadcn/ui components.

## Features

- 🎵 Browse and play MP3 files from Google Drive
- 📁 Navigate through folder structures
- 🎨 Dark/Light mode toggle
- 🔊 Volume control with slider
- ⏯️ Full playback controls (play, pause, next, previous)
- 📱 Responsive design for mobile and desktop
- 🎯 Clean, modern UI with Shadcn/ui components

## Setup

1. **Google Drive API Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Drive API
   - Create credentials (API key)
   - Restrict the API key to Google Drive API for security

2. **Google Drive Folder Setup**
   - Create a folder in your Google Drive
   - Add your MP3 files and subfolders
   - Right-click the folder → Share → Anyone with the link can view
   - Copy the folder ID from the URL (the long string after `/folders/`)

3. **Environment Variables**
   Create a `.env` file in the root directory:
   ```
   VITE_API_KEY=your_google_drive_api_key_here
   VITE_DRIVE_ID=your_google_drive_folder_id_here
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## Usage

1. The app will automatically load your Google Drive folder contents
2. Click on folders to navigate deeper
3. Click on MP3 files to play them
4. Use the player controls to manage playback
5. Use the "Back" button to navigate to parent folders

## Project Structure

```
src/
├── components/
│   └── ui/           # Shadcn/ui components
├── lib/
│   ├── google-drive.ts  # Google Drive API utilities
│   └── utils.ts         # General utilities
├── types/
│   └── index.ts         # TypeScript type definitions
└── App.tsx             # Main application component
```

## Technologies Used

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui
- Lucide React (icons)
- Google Drive API v3

## Build for Production

```bash
npm run build
```

## Contributing

Feel free to submit issues and pull requests to improve the player!

## License

MIT License - feel free to use this for personal or commercial projects.
