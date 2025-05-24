# Firebase Security Rules for Russian Translator Extension

This guide will help you set up proper security rules for your Firebase project to work with the Russian Translator browser extension.

## The Content Security Policy (CSP) Issue

Chrome extensions have strict Content Security Policy (CSP) rules that prevent loading scripts from external domains including Firebase's CDN. To solve this:

1. We've included local copies of the Firebase scripts in the extension
2. Updated the manifest.json with appropriate CSP settings
3. Configured the extension to use these local scripts

## Firestore Security Rules

To ensure your data is properly secured, add these security rules to your Firestore database:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own vocabulary
    match /users/{userId}/vocabulary/{document=**} {
      allow read, write: if true; // For testing only - update for production!
    }
    
    // Allow direct writes to vocabulary collection as a fallback
    match /vocabulary/{document=**} {
      allow read, write: if true; // For testing only - update for production!
    }
    
    // For test documents
    match /test/{document=**} {
      allow read, write: if true;
    }
    
    // For test connections
    match /test_connections/{document=**} {
      allow read, write: if true;
    }
  }
}
```

## IMPORTANT: Security in Production

The rules above allow anyone to read and write to your Firestore database. For a production environment:

1. Replace the `true` conditions with proper user authentication checks:
   ```
   allow read, write: if request.auth != null && request.auth.uid == userId;
   ```

2. Add rate limiting and validation rules:
   ```
   allow write: if request.auth != null 
              && request.auth.uid == userId
              && request.resource.data.word.size() < 500
              && request.resource.data.definition.size() < 5000;
   ```

## Troubleshooting CSP Issues

If you continue to experience Content Security Policy issues:

1. Make sure you're using the local Firebase files included with the extension
2. Check the Chrome extension console for specific error messages
3. Verify the manifest.json has the correct content_security_policy setting
4. Try clearing your browser cache and reloading the extension

## Testing Firestore Connection

Use the Firebase test button in the extension popup to verify the connection is working correctly. 