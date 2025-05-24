# Firestore Synchronization for SnapWort

This document explains how to set up and use the Firestore synchronization feature that allows you to save words from your browser extension directly to Firestore and then import them into your app's library.

## Setup

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the steps to create a new project
3. Once your project is created, click "Continue"

### 2. Add Firestore Database

1. In the Firebase Console, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" or "Start in test mode" (for development)
4. Select a location for your Firestore database
5. Click "Enable"

### 3. Get Firebase Configuration

1. In the Firebase Console, click on the gear icon (⚙️) next to "Project Overview" and select "Project settings"
2. Scroll down to the "Your apps" section
3. If you haven't added a web app yet, click on the web icon (</>) to add one
4. Register your app with a nickname (e.g., "SnapWort")
5. Copy the Firebase configuration object that looks like this:

```javascript
{
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
}
```

### 4. Configure Your App

1. Add the Firebase configuration to your `.env.local` file:

```
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

2. Restart your application

### 5. Configure Your Browser Extension

1. Open the browser extension settings by clicking on the extension icon
2. Go to the "Firebase" tab
3. Paste the Firebase configuration object into the text field
4. Click "Save Firebase Config"
5. Go to the "Basic Settings" tab
6. Enter a unique User ID (this will be used to identify your words in Firestore)
7. Click "Save User ID"

## Using the Feature

### Saving Words from the Browser Extension

1. When browsing the web, select any word or text
2. Right-click and select "Get Russian Definition"
3. In the popup that appears, click "Save to Library"
4. The word will be saved to Firestore with your User ID

### Syncing Words to Your App

1. Open your app and go to the Library page
2. Click the "Sync" button in the top-right corner
3. Enter the User ID you used in the browser extension
4. Click "Sync Now"
5. The app will import all new words from Firestore into your local library

## Troubleshooting

### Words aren't being saved to Firestore

1. Check that you have entered the correct Firebase configuration in the browser extension
2. Make sure you have an active internet connection
3. Check the browser console for any error messages

### Words aren't syncing to the app

1. Make sure you're using the same User ID in both the browser extension and the sync modal
2. Check that your Firebase configuration is correct in the `.env.local` file
3. Ensure that your app has an active internet connection
4. Check the browser console for any error messages

## Data Model

Words are stored in Firestore with the following structure:

```javascript
{
  word: "example",          // The word or phrase
  meaning: "definition...", // The definition or translation
  language: "de",           // The language (de or en)
  queryType: "definition",  // The type of query
  createdAt: timestamp,     // Timestamp when the word was saved
  source: "browser_extension", // Source of the word
  userId: "your_user_id",   // Your user ID
  synced: false             // Whether the word has been synced to the app
}
```

## Security Considerations

- The current implementation doesn't include authentication, so anyone with your User ID could potentially sync your words.
- For a production environment, consider adding proper authentication to secure your data.

## Future Improvements

- Add authentication to secure user data
- Add automatic syncing on app startup
- Implement two-way sync (from app to Firestore)
- Add offline support with automatic sync when online 