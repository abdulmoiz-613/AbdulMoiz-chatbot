# Voice Recognition Troubleshooting Guide

## 🎤 Speech Recognition Error: "Please try again"

### Quick Fix Steps:

1. **Check Browser Compatibility**
   - ✅ Use Chrome (recommended)
   - ✅ Use Edge (good support)
   - ❌ Avoid Firefox (limited support)
   - ❌ Avoid Internet Explorer

2. **Grant Microphone Permissions**
   - Click the microphone icon in your browser's address bar
   - Select "Always allow" for microphone access
   - Or go to browser settings and enable microphone for localhost

3. **Check Your Setup**
   - Ensure microphone is connected and working
   - Test microphone in other applications
   - Check Windows microphone settings

4. **Browser Settings**
   - Clear browser cache and cookies
   - Reload the page (Ctrl+F5)
   - Try incognito/private mode

### Detailed Solutions:

#### For Chrome Users:
1. Click the lock icon in address bar
2. Set Microphone to "Allow"
3. Refresh the page

#### For Edge Users:
1. Click the lock icon in address bar
2. Select "Permissions for this site"
3. Set Microphone to "Allow"
4. Refresh the page

#### If Still Not Working:
1. Open Chrome Settings
2. Go to Privacy and Security > Site Settings
3. Click Microphone
4. Add localhost:3000 to "Allowed to use your microphone"

### Testing Process:

1. **Test Microphone First**: Click "Test Microphone" button in the welcome screen
2. **Allow Permissions**: Grant microphone access when prompted
3. **Try Voice Input**: Click the green microphone button
4. **Speak Clearly**: Say something clearly within 3-5 seconds
5. **Check Results**: Your speech should appear as text and be sent to AI

### Common Error Messages:

- **"Speech recognition not supported"** → Use Chrome browser
- **"Microphone access denied"** → Allow microphone permissions
- **"No speech detected"** → Speak louder/clearer or check microphone
- **"Network error"** → Check internet connection

### Browser Console Debugging:
1. Press F12 to open developer tools
2. Go to Console tab
3. Look for speech recognition errors
4. Copy error messages for further troubleshooting

### Manual Testing Steps:
1. Open https://dictation.io/ in Chrome
2. Test if voice recognition works there
3. If it works there but not in our app, there might be a code issue
4. If it doesn't work there, it's a browser/microphone issue

### Alternative Solutions:
- Try a different microphone/headset
- Restart your browser
- Restart your computer
- Update your browser to the latest version
- Check Windows microphone privacy settings
