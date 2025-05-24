# Firebase Migration Guide

We've updated the Russian Translator extension to use Firebase Compatibility libraries loaded directly from CDN instead of ES modules. This document explains the changes and how to make sure your extension is working correctly.

## Changes Made

1. **Removed module files:**
   - `firebase-app.js` 
   - `firebase-firestore.js`

   These files were using ES modules which don't work well in browser extensions.

2. **Added direct CDN references in HTML files:**
   - Now loading Firebase from CDN in `background.html` and `popup.html`
   - Using compatibility version which works better in extensions

3. **Updated code to use compatibility API:**
   - Changed Firebase initialization in `background.js` and `popup.js`
   - Using `firebase.initializeApp()` instead of modular imports
   - Using `firebase.firestore()` instead of module imports

## How to Fix "Not Initialized" Error

If you're seeing "Firebase Status: Not initialized" in the extension popup, follow these steps:

1. **Open extension settings:**
   - Click on the extension icon in your browser toolbar
   - Go to the "Firebase" tab
   - Make sure you have a valid Firebase configuration entered

2. **Test with the test page:**
   - Open `firebase-test.html` in your browser
   - Load your configuration from storage or paste it directly
   - Click "Test Configuration" to check if Firebase works

3. **Check permissions:**
   - Make sure your Firestore database has proper security rules
   - For testing, you can set rules to allow all reads and writes

4. **Reload the extension:**
   - Go to `chrome://extensions/` in your browser
   - Find the Russian Translator extension
   - Toggle it off and then on again to reload it

## Cleaning Up Old Files

If you've previously loaded the extension with the module files, you may need to clean up:

1. Delete any remaining copies of:
   - `firebase-app.js`
   - `firebase-firestore.js`

2. Make sure your manifest.json doesn't reference these files in `web_accessible_resources`

## Still Having Problems?

If you're still experiencing issues after following these steps:

1. Open the browser console (F12) to check for any error messages
2. Try using the `firebase-test.html` file to diagnose Firebase connectivity
3. Check the "Debug" tab in the extension popup for more detailed logs

For further troubleshooting, refer to the `TROUBLESHOOTING.md` file. 