// Debug logging function
function log(message, data = null) {
  const logMsg = data ? `${message}: ${JSON.stringify(data)}` : message;
  console.log(`[RussianTranslator] ${logMsg}`);
}

// Error logging function
function logError(message, error) {
  console.error(`[RussianTranslator] ERROR - ${message}:`, error);
}

// Initialize Firebase on load - IMPORTANT!
document.addEventListener('DOMContentLoaded', async function() {
  log("Background page loaded, initializing Firebase...");
  
  // Check if Firebase SDK is available
  if (typeof firebase === 'undefined') {
    logError("Firebase SDK is not loaded! Check that firebase-app.js and firebase-firestore.js are present.");
    return;
  }
  
  log("Firebase SDK detected: " + (firebase.SDK_VERSION || "unknown version"));
  
  // Initialize Firebase
  try {
    await initializeFirebase();
    log("Firebase initialized successfully on background page load");
  } catch (error) {
    logError("Failed to initialize Firebase on background page load", error);
  }
});

// Firebase initializer class
window.firebaseInit = {
  app: null,
  db: null,
  
  isReady() {
    return this.db !== null && this.app !== null;
  },
  
  async initializeFromStorage() {
    log("Reading Firebase config from storage");
    
    try {
      const result = await new Promise((resolve, reject) => {
        chrome.storage.sync.get(['firebaseConfig'], (items) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(items);
          }
        });
      });
      
      if (!result.firebaseConfig) {
        throw new Error("Firebase configuration not found in storage");
      }
      
      let firebaseConfig;
      try {
        firebaseConfig = JSON.parse(result.firebaseConfig);
      } catch (e) {
        throw new Error("Invalid Firebase configuration format: " + e.message);
      }
      
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error("Firebase configuration is missing required fields");
      }
      
      log("Initializing Firebase with config", {
        projectId: firebaseConfig.projectId,
        hasApiKey: !!firebaseConfig.apiKey
      });
      
      // Don't reinitialize if already done
      if (this.app) {
        try {
          this.app = firebase.app();
          log("Using existing Firebase app");
        } catch (e) {
          log("No existing Firebase app, creating new");
        }
      }
      
      // Initialize Firebase if not already initialized
      try {
        if (!this.app) {
          this.app = firebase.initializeApp(firebaseConfig);
        }
        
        // Initialize Firestore
        this.db = firebase.firestore();
        log("Firebase initialized successfully");
        
        return true;
      } catch (error) {
        this.app = null;
        this.db = null;
        throw error;
      }
    } catch (error) {
      logError("Failed to initialize Firebase", error);
      this.app = null;
      this.db = null;
      throw error;
    }
  },
  
  async saveWord(word, definition, userId, language) {
    if (!this.isReady()) {
      throw new Error("Firebase is not initialized");
    }
    
    if (!word || !definition) {
      throw new Error("Word and definition are required");
    }
    
    const wordData = {
      word: word,
      definition: definition,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      language: language || 'de'
    };
    
    log("Saving word to Firestore", {
      word,
      userId,
      language: language || 'de',
      definitionLength: definition.length
    });
    
    try {
      const docRef = await this.db.collection('users').doc(userId)
        .collection('vocabulary').add(wordData);
        
      log("Word saved successfully with ID:", docRef.id);
      return {
        success: true,
        docId: docRef.id
      };
    } catch (error) {
      logError("Error saving word to Firestore", error);
      throw error;
    }
  },
  
  async testConnection() {
    log("Testing Firestore connection");
    
    if (!this.isReady()) {
      throw new Error("Firebase is not initialized");
    }
    
    try {
      const testDoc = {
        test: true,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent
      };
      
      const testRef = await this.db.collection('test_connections').add(testDoc);
      log("Test connection successful, document created with ID:", testRef.id);
      
      return {
        success: true,
        testDocId: testRef.id
      };
    } catch (error) {
      logError("Test connection failed", error);
      throw error;
    }
  }
};

// Create context menu option
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translateToRussian",
    title: "Get Russian Definition",
    contexts: ["selection"]
  });
  log("Extension installed and context menu created");
  
  // Initialize Firebase
  initializeFirebase();
});

// Global variables
let apiKey = '';
let appUrl = 'https://your-app-url.com';

// Load settings from storage
chrome.storage.sync.get(['geminiApiKey', 'appUrl', 'language', 'userId'], (result) => {
  log("Loaded settings from storage", result);
  
  if (result.geminiApiKey) {
    apiKey = result.geminiApiKey;
  }

  if (result.appUrl) {
    appUrl = result.appUrl;
  }
});

// Listen for changes to storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    log("Storage changes detected", changes);
    
    if (changes.geminiApiKey) {
      apiKey = changes.geminiApiKey.newValue;
    }
    
    if (changes.appUrl) {
      appUrl = changes.appUrl.newValue;
    }
    
    if (changes.firebaseConfig) {
      initializeFirebase();
    }
  }
});

// Initialize Firebase
async function initializeFirebase() {
  log("Attempting to initialize Firebase");
  
  try {
    await window.firebaseInit.initializeFromStorage();
    log("Firebase initialized successfully from storage");
  } catch (error) {
    logError("Failed to initialize Firebase", error);
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  log("Received message", { action: message.action, from: sender.tab ? "content script" : "popup" });
  
  if (message.action === "openAppPage") {
    chrome.tabs.create({ url: appUrl });
    sendResponse({ success: true });
  } else if (message.action === "getDefinition") {
    fetchDefinitionFromGemini(message.text, message.context, sender.tab.id);
    sendResponse({ success: true, processing: true });
  } else if (message.action === "saveToLibrary") {
    log("Processing saveToLibrary request", { word: message.word });
    
    // Handle saveToLibrary request
    if (!message.word || !message.definition) {
      log("Missing word or definition in saveToLibrary request");
      sendResponse({
        success: false,
        error: "Missing word or definition"
      });
      return true;
    }
    
    // Make sure Firebase is initialized
    if (!window.firebaseInit || !window.firebaseInit.isReady()) {
      log("Firebase not initialized for saveToLibrary request");
      sendResponse({
        success: false,
        error: "Firebase is not initialized properly"
      });
      return true;
    }
    
    // We need to handle this asynchronously
    saveWordToFirestore(message.word, message.definition, sender.tab.id)
      .then(result => {
        log("saveWordToFirestore completed successfully", { result });
        try {
          sendResponse(result);
        } catch (error) {
          logError("Failed to send response back to content script", error);
        }
      })
      .catch(error => {
        logError("Error in saveWordToFirestore promise", error);
        try {
          sendResponse({ 
            success: false, 
            error: error.message || "Unknown error in saveWordToFirestore" 
          });
        } catch (sendError) {
          logError("Failed to send error response back to content script", sendError);
        }
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  
  // Return true for other message types that don't need responses
  return true;
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translateToRussian" && info.selectionText) {
    const selectedText = info.selectionText.trim();
    
    if (selectedText) {
      chrome.tabs.sendMessage(tab.id, {
        action: "showLoading",
        text: selectedText
      });
      
      log("Context menu selection", { text: selectedText });
    }
  }
});

// Function to call Gemini API
async function fetchDefinitionFromGemini(text, context, tabId) {
  log("Fetching definition from Gemini API", { text, context });
  
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    logError("API key not set", { apiKey });
    chrome.tabs.sendMessage(tabId, {
      action: "showResult",
      success: false,
      error: "API key not set. Please set your Gemini API key in the extension options."
    });
    return;
  }
  
  try {
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";
    
    const payload = {
      contents: [{
        role: "USER",
        parts: [{
          text: `Instruction: Analyze the word or phrase "${text}" in this specific context: "${context}"

           give the definition of the word or phrase in the context of the sentence
          `
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024
      }
    };
    
    log("Sending request to Gemini API", { apiUrl, payloadPreview: text });
    
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Error from Gemini API");
    }
    
    const definition = data.candidates[0].content.parts[0].text;
    log("Definition received from Gemini API", { textLength: definition.length });
    
    chrome.tabs.sendMessage(tabId, {
      action: "showResult",
      success: true,
      text: text,
      definition: definition
    });
    
  } catch (error) {
    logError("Error calling Gemini API", error);
    chrome.tabs.sendMessage(tabId, {
      action: "showResult",
      success: false,
      error: error.message || "Failed to get definition"
    });
  }
}

// Function to save a word to Firestore
async function saveWordToFirestore(word, definition, tabId) {
  log("Attempting to save word to Firestore", { word, definition: definition.substring(0, 30) + "..." });
  
  // Return value for response
  let result = {
    success: false,
    message: "",
    error: null
  };
  
  // Check if Firebase is available
  if (typeof firebase === 'undefined') {
    const errorMsg = "Firebase SDK is not loaded. Please reload the extension.";
    logError(errorMsg);
    result.error = errorMsg;
    
    chrome.tabs.sendMessage(tabId, {
      action: "saveResult",
      success: false,
      error: errorMsg
    });
    
    return result;
  }
  
  // Check if our initializer is ready
  if (!window.firebaseInit || !window.firebaseInit.isReady()) {
    const errorMsg = "Firebase is not initialized. Please check your Firebase configuration in the extension settings.";
    logError(errorMsg);
    
    result.error = errorMsg;
    
    chrome.tabs.sendMessage(tabId, {
      action: "saveResult",
      success: false,
      error: errorMsg
    });
    
    return result;
  }
  
  // Get settings from storage
  log("Retrieving user settings from storage...");
  
  try {
    // Use a promise-based version of chrome.storage.sync.get
    const storageData = await new Promise((resolve, reject) => {
      chrome.storage.sync.get(['language', 'userId'], (items) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(items);
        }
      });
    });
    
    const language = storageData.language || 'de'; // Default to German
    const userId = storageData.userId || 'anonymous'; // Default user ID
    
    log("Retrieved user settings for save", { language, userId });
    
    if (!userId || userId === 'anonymous') {
      log("WARNING: Using default user ID. Consider setting a custom user ID in settings.");
    }
    
    // Try direct save without test - simplifying the flow
    try {
      log("Saving word directly to vocabulary collection...");
      
      // Create a unique ID to avoid issues with special characters in words
      const wordId = `word_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Prepare word data
      const wordData = {
        word: word,
        definition: definition,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        language: language,
        userId: userId,
        savedAt: new Date().toISOString()
      };
      
      // Save to Firestore - try users collection first, fall back to vocabulary collection
      try {
        log("Attempting to save to users/vocabulary collection...");
        await window.firebaseInit.db.collection('users').doc(userId)
          .collection('vocabulary').doc(wordId).set(wordData);
        log("Word saved to users/vocabulary successfully");
      } catch (usersError) {
        logError("Failed to save to users collection, trying vocabulary collection directly", usersError);
        
        // Try falling back to vocabulary collection directly
        await window.firebaseInit.db.collection('vocabulary').doc(wordId).set(wordData);
        log("Word saved to vocabulary collection successfully");
      }
      
      log("Word saved to Firestore successfully");
      
      result.success = true;
      result.message = "Word saved to Firestore successfully!";
      
      // Send success notification
      chrome.tabs.sendMessage(tabId, {
        action: "saveResult",
        success: true,
        message: "Word saved to Firestore successfully!"
      });
      
      return result;
    } catch (saveError) {
      logError("Error saving word directly", saveError);
      throw saveError;
    }
  } catch (error) {
    logError("Error saving word to Firestore", error);
    
    result.success = false;
    result.error = error.message || "Failed to save word to Firestore";
    
    chrome.tabs.sendMessage(tabId, {
      action: "saveResult",
      success: false,
      error: error.message || "Failed to save word to Firestore"
    });
    
    return result;
  }
} 