# Russian Translator Browser Extension

A Chrome extension that allows you to look up words and phrases in Russian and save them directly to Firestore for later syncing with your vocabulary app.

## Features

- Right-click on any text to get a Russian definition
- Quick access to your vocabulary app through the "Lernen" button
- Save looked up words directly to Firestore with a single click
- Customizable settings for API key and app URL
- Choose the language (German or English) for your saved words
- Configure Firebase integration for seamless syncing

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension is now installed and ready to use

## Setup

### Basic Settings

1. Click on the extension icon in the Chrome toolbar to open the settings popup
2. Enter your Gemini API key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))
3. Enter the URL of your vocabulary app
4. Enter a unique User ID that will be used to identify your saved words
5. Select the language you want to use for saving words (German or English)
6. Click "Save" for each setting

### Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Add a Firestore database to your project
3. Get your Firebase configuration object from the project settings
4. In the extension settings, go to the "Firebase" tab
5. Paste your Firebase configuration object in the text field
6. Click "Save Firebase Config"

## Usage

### Looking up Words

1. Select any word or text on a webpage
2. Right-click and select "Get Russian Definition"
3. View the Russian definition in the popup

### Saving Words to Firestore

1. Look up a word using the steps above
2. In the definition popup, click "Save to Library"
3. The word and its definition will be saved to Firestore under your User ID
4. Later, you can sync these words with your app by using the Sync feature in your app's Library

### Quick Access to App

1. Click the green "Lernen" button in the bottom right corner of any webpage
2. Click "Go to the app" to open your vocabulary app

## Configuration

### API Key

- You need a Gemini API key to use the translation features
- Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Enter your API key in the extension settings

### App URL

- Enter the URL of your vocabulary app in the extension settings
- This URL will be used for the "Go to the app" button

### Library Language

- Select the language (German or English) for saving words
- This setting determines how words are categorized in your library

### User ID

- Enter a unique User ID to identify your saved words in Firestore
- This ID will be used to filter and retrieve words when syncing with the app

### Firebase Configuration

- Paste your Firebase configuration object in the Firebase tab
- This configuration is used to connect to your Firestore database
- Make sure your Firebase project has Firestore enabled

## Firestore Data Structure

Words are saved to Firestore in the following format:

```javascript
{
  word: "example",           // The word or phrase that was looked up
  meaning: "definition...",  // The definition from Gemini API
  language: "de",            // Selected language (de or en)
  queryType: "definition",   // Type of query
  createdAt: timestamp,      // When the word was saved
  source: "browser_extension", // Source identifier
  userId: "your_user_id",    // Your unique User ID
  synced: false              // Whether this word has been synced to the app
}
```

## Troubleshooting

If words are not being saved to Firestore:

1. Make sure you've entered the correct Firebase configuration
2. Check that Firestore is enabled in your Firebase project
3. Ensure you have an active internet connection
4. Check the browser console for any error messages

## Privacy

This extension:
- Does not collect any personal data
- Only sends selected text to the Gemini API for translation
- Stores your API key, User ID, and Firebase config locally in your browser
- Saves words to Firestore under your User ID

## License

This project is for personal use only. 