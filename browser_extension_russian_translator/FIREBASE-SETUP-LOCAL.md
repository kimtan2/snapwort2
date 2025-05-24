# Setting Up Firebase with Local Files in Chrome Extensions

This guide explains how to properly integrate Firebase with a Chrome extension while avoiding Content Security Policy (CSP) issues.

## Background: CSP Issues in Chrome Extensions

Chrome extensions have strict Content Security Policy (CSP) rules that prevent loading scripts from external domains, including Firebase's CDN. When attempting to load Firebase from the CDN, you'll see errors like:

```
Refused to load the script 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js' because it violates the following Content Security Policy directive: "script-src 'self'"
```

## Solution: Using Local Firebase Files

This extension uses local copies of the Firebase JavaScript files instead of loading them from the CDN.

### Files Included

1. `firebase-app.js` - The Firebase App SDK
2. `firebase-firestore.js` - The Firebase Firestore SDK

### Manifest.json Configuration

The `manifest.json` file has been configured with the following CSP settings:

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
},
"web_accessible_resources": [
  {
    "resources": [
      "firebase-app.js",
      "firebase-firestore.js"
    ],
    "matches": ["<all_urls>"]
  }
]
```

Notes:
- Chrome Manifest V3 extensions don't allow 'unsafe-inline' in the CSP directives
- All styles must be in separate CSS files to comply with CSP rules
- External script loading (from CDNs) is not allowed

## How to Set Up Firebase

1. **In the extension popup**:
   - Go to the "Firebase" tab
   - Enter your Firebase configuration in JSON format:
   ```json
   {
     "apiKey": "YOUR_API_KEY",
     "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
     "projectId": "YOUR_PROJECT_ID",
     "storageBucket": "YOUR_PROJECT_ID.appspot.com",
     "messagingSenderId": "YOUR_MESSAGING_ID",
     "appId": "YOUR_APP_ID"
   }
   ```
   - Click "Save Firebase Config"
   - Test the connection with "Test Firebase Connection"

2. **Set your User ID**:
   - Go to the "Basic Settings" tab
   - Enter a unique User ID to identify your saved words
   - Click "Save User ID"

## Firebase Security Rules

In your Firebase console, set up the following security rules for Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own vocabulary
    match /users/{userId}/vocabulary/{document=**} {
      allow read, write: if true; // For testing - update in production
    }
    
    // Allow direct writes to vocabulary collection as a fallback
    match /vocabulary/{document=**} {
      allow read, write: if true; // For testing - update in production
    }
    
    // For test connections
    match /test_connections/{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Common Issues and Solutions

### 1. Firebase SDK not loading

**Symptoms**:
- Console errors about CSP violations
- Firebase features don't work
- Debug tab shows "Firebase SDK not loaded"

**Solutions**:
- Ensure the local Firebase files are present in the extension directory
- Check that manifest.json has the correct CSP settings
- Try reloading the extension from chrome://extensions (toggle Developer Mode off and on)

### 2. Firebase initialization failing

**Symptoms**:
- Console shows "Firebase initialization failed" errors
- Debug tab shows "Firebase not initialized"

**Solutions**:
- Verify your Firebase configuration is correctly formatted JSON
- Check that your Firebase project exists and is active
- Ensure your Firebase project has Firestore enabled

### 3. Unable to save words

**Symptoms**:
- "Failed to save" errors when trying to save words
- Console shows Firestore permission errors

**Solutions**:
- Check Firestore security rules in Firebase Console
- Verify that your User ID is set correctly in the extension
- Ensure your Firebase project has proper billing and quota limits

## How Saving Words Works

When you save a word:

1. The content script sends a message to the background script
2. The background script tries to save the word to `users/{userId}/vocabulary/{wordId}`
3. If that fails, it falls back to the global `vocabulary` collection
4. A success/failure message is sent back to the content script

## Data Structures

### Word Document Structure

```
{
  word: "example",
  definition: "A detailed definition of the word...",
  timestamp: Firebase.firestore.FieldValue.serverTimestamp(),
  language: "de", // or another language code
  userId: "your-user-id",
  synced: false,
  savedAt: "2023-05-03T14:23:45.789Z"
}
```

## Updating Firebase

If you need to update the Firebase SDK files:

1. Download the latest compat versions:
   - `https://www.gstatic.com/firebasejs/[VERSION]/firebase-app-compat.js`
   - `https://www.gstatic.com/firebasejs/[VERSION]/firebase-firestore-compat.js`
2. Replace the existing files in the extension directory
3. Update any version references in documentation

## For Developers

The Firebase integration uses three key files:

1. `firebase-initializer.js` - Handles initialization and provides utility methods
2. `background.js` - Uses Firebase to save words to Firestore
3. `popup.js` - Configures Firebase and provides debugging tools 