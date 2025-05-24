// Debug logging function
function log(message, data = null) {
  const logMsg = data ? `${message}: ${JSON.stringify(data)}` : message;
  console.log(`[RussianTranslator] ${logMsg}`);
}

// Error logging function
function logError(message, error) {
  console.error(`[RussianTranslator] ERROR - ${message}:`, error);
}

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
    // We need to handle this asynchronously
    saveWordToFirestore(message.word, message.definition, sender.tab.id)
      .then(result => {
        // Try to send a response, but it might not work if the connection is closed
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
  
  if (!window.firebaseInit.isReady()) {
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
    
    // Generate a test word to verify Firestore write permissions
    log("Attempting to write test word to verify permissions...");
    try {
      const testWordId = `test_permission_${Date.now()}`;
      await window.firebaseInit.db.collection('test').doc(testWordId).set({
        test: true,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      log("Test write successful, permissions verified");
    } catch (permErr) {
      logError("Failed permission test. May not have write access", permErr);
      throw new Error(`Permission error: ${permErr.message}. Please check Firestore rules.`);
    }
    
    // Save word to Firestore using our initializer
    log("Now saving actual word to vocabulary collection...");
    await window.firebaseInit.saveWord(word, definition, userId, language);
    
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