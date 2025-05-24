# Firebase Setup Guide for Russian Translator Extension

This guide explains how to set up Firebase for the Russian Translator extension.

## Setting Up Firebase

1. **Create a Firebase project**:
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup wizard
   - Name your project (e.g., "Russian Translator")
   - Enable Google Analytics if desired
   - Click "Create project"

2. **Create a Firestore database**:
   - In your Firebase project, click "Firestore Database" in the left sidebar
   - Click "Create database"
   - Start in production mode or test mode (you can change this later)
   - Choose a location close to your users
   - Click "Enable"

3. **Set up security rules**:
   - In the Firestore Database section, go to the "Rules" tab
   - For testing, you can use these basic rules:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   - For production, you should add proper authentication rules

4. **Get your Firebase configuration**:
   - In the Firebase console, click the gear icon (⚙️) near "Project Overview"
   - Select "Project settings"
   - Scroll down to the "Your apps" section
   - If you haven't added an app yet, click the web icon (`</>`)
   - Register your app with a nickname like "Russian Translator Extension"
   - The Firebase configuration object will be displayed
   - Copy this configuration object

## Configuring the Extension

1. **Add the Firebase configuration to the extension**:
   - Click on the Russian Translator extension icon in your browser
   - Go to the "Firebase" tab
   - Paste the Firebase configuration object into the textarea
   - Click "Save Firebase Config"

2. **Set your User ID**:
   - Go to the "Basic Settings" tab
   - Enter a unique User ID (this will be used to identify your saved words)
   - Click "Save User ID"

3. **Test the Firebase connection**:
   - Go to the "Firebase" tab
   - Click "Test Firebase Connection"
   - You should see a success message if everything is set up correctly

4. **Use the test page**:
   - Open `test-firebase.html` in your browser
   - Click "Load From Storage" to load your Firebase configuration
   - Click "Initialize Firebase"
   - Click "Test Connection" to verify the connection works
   - Try saving a test word

## Troubleshooting

If you encounter issues:

1. **Check the Debug tab**:
   - Click on the Russian Translator extension icon
   - Go to the "Debug" tab
   - Check the logs for any error messages

2. **Check the browser console**:
   - Right-click on the extension popup and select "Inspect"
   - Go to the "Console" tab to see detailed error messages

3. **Verify your Firebase configuration**:
   - Make sure all required fields are present in your configuration
   - Check that your project ID, API key, and other values are correct

4. **Check Firestore rules**:
   - Make sure your security rules allow writing to the Firestore database

5. **Try reinstalling the extension**:
   - Go to `chrome://extensions/`
   - Remove the Russian Translator extension
   - Load it again

## Firebase Structure

The extension saves words to Firestore with the following structure:

- **Collection**: `vocabulary`
- **Document ID**: `word_[lowercase_word]_[timestamp]`
- **Fields**:
  - `word`: The word or phrase (original text)
  - `meaning`: The definition from Gemini
  - `language`: Language code (de, en, etc.)
  - `queryType`: Always "definition"
  - `createdAt`: Timestamp
  - `source`: "browser_extension"
  - `userId`: Your User ID
  - `synced`: Boolean indicating if it's been synced with the app (initially false)

This structure allows the words to be synced with the SnapWort app. 