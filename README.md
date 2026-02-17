# Life OS Dashboard 🎨

A manga-inspired productivity dashboard for managing the Creative Empire.

## Features

- **Glassmorphism UI** - Transparent cards with backdrop blur
- **Wallpaper System** - 15 custom wallpapers with easy switching
- **Mood Display** - Animated GIF mood indicators (working, searching, coding, etc.)
- **Task Management** - Sync with PROJECTS.md
- **Inventory Tracking** - Merchandise and stock management
- **Journal System** - Daily automated logs at 3:00 AM
- **Stream Scheduler** - Plan and track live streams
- **Focus Mode** - Distraction-free zen view

## Tech Stack

- **Backend:** Node.js, Express, Socket.io
- **Frontend:** React, Chart.js
- **Styling:** Custom CSS with manga aesthetic
- **Icons:** FontAwesome

## Quick Start

```bash
cd dashboard
npm install
cd client && npm install && npm run build
cd ..
npm start
```

Dashboard runs on http://localhost:3000

## Environment Variables

Create a `.env` file in the dashboard directory:

```
PORT=3000
NODE_ENV=production
```

## GitHub Actions

Auto-builds on every push to `main`. Configure deployment in `.github/workflows/deploy.yml`.

## License

MIT - Built for the Creative Empire 👑
# Test deploy
