# Labrina Config

## Environment Variables Needed

### PostBridge API (Social Stats & Posting)
Get from: https://postbridge.io or your provider
```
POSTBRIDGE_API_KEY=your_api_key_here
POSTBRIDGE_API_SECRET=your_api_secret_here
```

### Google Drive API
Get from: https://console.cloud.google.com/apis/credentials
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### Folders to Monitor (Google Drive)
```
DRIVE_IMAGES_FOLDER=1abc123...
DRIVE_VIDEOS_FOLDER=1def456...
DRIVE_THUMBNAILS_FOLDER=1ghi789...
DRIVE_RELEASES_FOLDER=1jkl012...
```

## Setting Up

1. **PostBridge:**
   - Sign up at their website
   - Get API credentials
   - Add to .env file

2. **Google Drive:**
   - Go to Google Cloud Console
   - Enable Drive API
   - Create OAuth credentials
   - Add to .env file
