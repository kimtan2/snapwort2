# Content Security Policy (CSP) Fix for Chrome Extension

This document outlines the changes made to fix the Content Security Policy (CSP) issues in the Russian Translator browser extension.

## Overview of the Issue

Chrome extensions have strict CSP restrictions that prevent loading scripts from external domains, including Firebase's CDN URLs. This resulted in errors like:

```
Refused to load the script 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js' because it violates the following Content Security Policy directive: "script-src 'self'"
```

Additionally, Chrome rejects the use of 'unsafe-inline' in Manifest V3 extensions, resulting in this error:

```
'content_security_policy.extension_pages': Insecure CSP value "'unsafe-inline'" in directive 'script-src'.
```

## Solution Implemented

To fix these issues, we made the following changes:

### 1. Local Firebase Files

- We're now using local copies of Firebase files instead of loading from CDN
- Created local copies of:
  - `firebase-app.js` (from firebase-app-compat.js)
  - `firebase-firestore.js` (from firebase-firestore-compat.js)

### 2. Manifest.json Updates

- Added proper CSP settings without 'unsafe-inline':
  ```json
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
  ```
- Added web_accessible_resources to expose Firebase files to content scripts:
  ```json
  "web_accessible_resources": [
    {
      "resources": ["firebase-app.js", "firebase-firestore.js"],
      "matches": ["<all_urls>"]
    }
  ]
  ```

### 3. Removed All Inline Styles

- Created external CSS files to replace all inline styles:
  - `popup.css` - Styles for the extension popup
  - `content.css` - Styles for the content script
- Updated manifest.json to include CSS files: 
  ```json
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ]
  ```
- Updated all DOM creation code to use classes instead of inline styles
- Replaced style attributes with CSS classes everywhere

### 4. Script Loading Changes

- Updated `background.html` to load the local Firebase files:
  ```html
  <script src="firebase-app.js"></script>
  <script src="firebase-firestore.js"></script>
  ```
- Added proper initialization in background.js with DOMContentLoaded event

### 5. Enhanced Firebase Initializer

- Added better error handling in the FirebaseInitializer class
- Implemented fallback strategies for saving words
- Added diagnostic capabilities to help troubleshoot issues
- Improved initialization to reuse existing Firebase instances

### 6. Better Debug Tools

- Enhanced the Firebase debug panel in the popup
- Added detailed error reporting
- Implemented connection testing functionality

## Files Changed

1. `manifest.json` - Updated with CSP and web_accessible_resources
2. `popup.html` - Removed inline styles
3. `popup.css` - New file created for popup styles
4. `content.js` - Updated to use classes instead of inline styles
5. `content.css` - New file created for content script styles
6. `background.js` - Added initialization code and improved error handling
7. `firebase-initializer.js` - Enhanced with better error handling and diagnostics
8. `background.html` - Updated to load local Firebase files

## New Documentation

1. `FIREBASE-SETUP-LOCAL.md` - Guide for setting up Firebase with local files
2. `FIREBASE-RULES.md` - Instructions for proper Firestore security rules
3. `README-CSP-FIX.md` - This file explaining the changes made

## Testing the Fix

To verify the fix is working:

1. Load the extension in Chrome
2. Check the manifest loads without CSP errors
2. Open the extension popup and go to the Debug tab
3. Verify "Firebase SDK Available" shows "Yes"
4. Check "Firebase Initialized" status
5. Test saving a word using the test page

## Future Improvements

- Consider bundling Firebase into a single file to reduce loading complexity
- Implement a service worker approach for better background script handling
- Add offline support using Firebase's persistence capabilities 