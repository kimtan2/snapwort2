# Troubleshooting Guide for Russian Translator Extension

This guide will help you diagnose and fix issues with the Firebase/Firestore integration in the Russian Translator extension.

## Common Issues and Solutions

### Firebase Not Initializing

**Symptoms:**
- Words aren't being saved to Firestore
- No error messages in the console
- "Firebase is not initialized" error in the popup

**Solutions:**

1. **Check Firebase Configuration Format**
   - Open the extension popup
   - Go to the Firebase tab
   - Make sure your configuration is valid JSON format
   - Required fields: `apiKey`, `authDomain`, `projectId`
   - Example:
     ```json
     {
       "apiKey": "AIzaSyCnsoa2q4KcSD_XtTSYJvjln98VdtyL0SM",
       "authDomain": "snapwort2.firebaseapp.com",
       "projectId": "snapwort2",
       "storageBucket": "snapwort2.firebasestorage.app",
       "messagingSenderId": "896577088258",
       "appId": "1:896577088258:web:e31c70dab9fe97b933b01b"
     }
     ```

2. **Check Firestore Database Setup**
   - Go to Firebase Console (https://console.firebase.google.com/)
   - Select your project
   - Make sure Firestore Database is created and enabled
   - Check that your Firestore Security Rules allow writes:
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /{document=**} {
           allow read, write;
         }
       }
     }
     ```

3. **Test Firebase Connection**
   - In the extension popup, go to the Firebase tab
   - Click "Test Firebase Connection"
   - Check the Debug tab for detailed logs
   - If testing fails, the error message should help identify the issue

### Console Errors

**Symptoms:**
- Errors in the browser console
- Extension not working properly

**How to Check Console Errors:**
1. Right-click anywhere on the page and select "Inspect" or press F12
2. Go to the Console tab
3. Look for errors with the prefix `[RussianTranslator]`

**Common Error Messages and Solutions:**

1. **"Firebase is not defined"**
   - **Cause:** Firebase scripts are not loaded
   - **Solution:** Make sure you're using Manifest V3 with a background page, not a service worker

2. **"Missing or insufficient permissions"**
   - **Cause:** Firestore security rules preventing write access
   - **Solution:** Update your Firestore security rules to allow writes

3. **"Failed to parse Firebase config"**
   - **Cause:** Invalid JSON in Firebase configuration
   - **Solution:** Fix the JSON format in the Firebase configuration

4. **"Quota exceeded"**
   - **Cause:** You've exceeded your Firebase free tier quota
   - **Solution:** Check your Firebase usage in the Firebase Console under "Usage & Billing"

### Words Not Saving to Firestore

**If words aren't being saved to Firestore:**

1. **Enable Debug Mode:**
   - Open the extension popup
   - Go to the Debug tab to see detailed logs

2. **Check for CORS Issues:**
   - Firestore operations might be blocked by CORS policies
   - Make sure your Firebase project allows requests from all domains

3. **Verify Firestore Collection:**
   - The extension saves words to the "vocabulary" collection
   - Check if this collection exists in your Firestore database
   - If not, it should be created automatically on first save

4. **Check User ID:**
   - Make sure you've set a User ID in the extension settings
   - This ID is used to identify your words in Firestore

## Advanced Troubleshooting

### Testing with the Test Page

Use the included `test.html` page to test the extension:
1. Open `test.html` in your browser
2. Follow the instructions to test different words and phrases
3. Monitor the console for errors during the process

### Debugging Background Page

To inspect the background page:
1. Go to `chrome://extensions/`
2. Find the Russian Translator extension
3. Click on "background page" link under "Inspect views"
4. This opens DevTools for the background page
5. Check the Console tab for errors

### Reset Extension

If all else fails, try resetting the extension:
1. Go to `chrome://extensions/`
2. Find the Russian Translator extension
3. Turn it off, then on again
4. Open the popup and reconfigure your settings

## Firebase Security Best Practices

For a production environment:
1. **Enable Authentication:** Require users to sign in before saving data
2. **Restrict Access:** Update security rules to allow access only to authenticated users
3. **Set Up Indexing:** Create indexes for frequently queried fields
4. **Enable Backups:** Configure regular backups of your Firestore data

## Contact Support

If you continue experiencing issues after trying these troubleshooting steps, please provide the following information:
1. Detailed description of the issue
2. Steps to reproduce the problem
3. Console logs (with sensitive information removed)
4. Browser and extension version
5. Screenshots of any error messages 