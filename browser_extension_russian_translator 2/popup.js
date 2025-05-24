document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const apiKeyInput = document.getElementById('api-key');
  const saveButton = document.getElementById('save-button');
  const statusMessage = document.getElementById('status-message');
  const appUrlInput = document.getElementById('app-url');
  const saveUrlButton = document.getElementById('save-url-button');
  const languageSelect = document.getElementById('language-select');
  const saveLanguageButton = document.getElementById('save-language-button');
  const firebaseConfigTextarea = document.getElementById('firebase-config');
  const saveFirebaseButton = document.getElementById('save-firebase-button');
  const testFirebaseButton = document.getElementById('test-firebase-button');
  const userIdInput = document.getElementById('user-id');
  const saveUserIdButton = document.getElementById('save-user-id-button');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const firebaseStatusDiv = document.getElementById('firebase-status');
  const refreshDebugButton = document.getElementById('refresh-debug-button');
  
  // Debug logger
  function logDebug(message) {
    console.log(`[RussianTranslator] ${message}`);
    updateFirebaseStatus(message);
  }
  
  // Set up tabs
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show the selected tab panel
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === `${tabName}-tab`) {
          panel.classList.add('active');
        }
      });
      
      // If switched to debug tab, update the status
      if (tabName === 'debug') {
        refreshDebugInfo();
      }
    });
  });
  
  // Load saved settings from storage
  chrome.storage.sync.get(['geminiApiKey', 'appUrl', 'language', 'firebaseConfig', 'userId'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
    
    if (result.appUrl) {
      appUrlInput.value = result.appUrl;
    } else {
      // Default app URL
      appUrlInput.value = 'https://your-app-url.com';
    }
    
    if (result.language) {
      languageSelect.value = result.language;
    }
    
    if (result.firebaseConfig) {
      // Try to pretty print the JSON for better readability
      try {
        const config = JSON.parse(result.firebaseConfig);
        firebaseConfigTextarea.value = JSON.stringify(config, null, 2);
        
        // Initialize Firebase
        initializeFirebase(config);
      } catch (e) {
        firebaseConfigTextarea.value = result.firebaseConfig;
        showStatus('Invalid Firebase config format stored', 'error');
        logDebug('Error parsing stored Firebase config: ' + e.message);
      }
    } else {
      logDebug('No Firebase config found in storage');
    }
    
    if (result.userId) {
      userIdInput.value = result.userId;
    } else {
      // Generate a default user ID if none exists
      userIdInput.value = 'user_' + Math.random().toString(36).substring(2, 10);
    }
  });
  
  // Save API key
  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter a valid API key', 'error');
      return;
    }
    
    chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
      if (chrome.runtime.lastError) {
        showStatus('Error saving API key: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showStatus('API key saved successfully!', 'success');
      }
    });
  });
  
  // Save app URL
  saveUrlButton.addEventListener('click', () => {
    const appUrl = appUrlInput.value.trim();
    
    if (!appUrl) {
      showStatus('Please enter a valid app URL', 'error');
      return;
    }
    
    chrome.storage.sync.set({ appUrl: appUrl }, () => {
      if (chrome.runtime.lastError) {
        showStatus('Error saving app URL: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showStatus('App URL saved successfully!', 'success');
      }
    });
  });
  
  // Save language
  saveLanguageButton.addEventListener('click', () => {
    const language = languageSelect.value;
    
    chrome.storage.sync.set({ language: language }, () => {
      if (chrome.runtime.lastError) {
        showStatus('Error saving language: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showStatus('Language saved successfully!', 'success');
      }
    });
  });
  
  // Save user ID
  saveUserIdButton.addEventListener('click', () => {
    const userId = userIdInput.value.trim();
    
    if (!userId) {
      showStatus('Please enter a valid user ID', 'error');
      return;
    }
    
    chrome.storage.sync.set({ userId: userId }, () => {
      if (chrome.runtime.lastError) {
        showStatus('Error saving user ID: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showStatus('User ID saved successfully!', 'success');
      }
    });
  });
  
  // Save Firebase configuration
  saveFirebaseButton.addEventListener('click', () => {
    const configText = firebaseConfigTextarea.value.trim();
    
    if (!configText) {
      showStatus('Please enter Firebase configuration', 'error');
      return;
    }
    
    // Validate JSON format
    try {
      const config = JSON.parse(configText);
      
      // Check that required fields are present
      const requiredFields = ['apiKey', 'authDomain', 'projectId'];
      const missingFields = requiredFields.filter(field => !config[field]);
      
      if (missingFields.length > 0) {
        showStatus(`Missing required fields: ${missingFields.join(', ')}`, 'error');
        return;
      }
      
      // Save the config and initialize Firebase
      chrome.storage.sync.set({ firebaseConfig: configText }, () => {
        if (chrome.runtime.lastError) {
          showStatus('Error saving Firebase config: ' + chrome.runtime.lastError.message, 'error');
        } else {
          showStatus('Firebase configuration saved successfully!', 'success');
          initializeFirebase(config);
        }
      });
      
    } catch (e) {
      showStatus('Invalid JSON format: ' + e.message, 'error');
    }
  });
  
  // Test Firebase connection
  testFirebaseButton.addEventListener('click', async () => {
    if (!window.firebaseInit.isReady()) {
      showStatus('Firebase is not initialized. Please save a valid Firebase configuration first.', 'error');
      return;
    }
    
    showStatus('Testing Firebase connection...', 'info');
    
    try {
      // Try to test the Firebase connection
      await window.firebaseInit.testConnection();
      logDebug('Firebase test successful!');
      showStatus('Firebase connection successful!', 'success');
    } catch (error) {
      logDebug(`Firebase test failed: ${error.message}`);
      showStatus(`Firebase connection failed: ${error.message}`, 'error');
    }
  });
  
  // Refresh debug info
  refreshDebugButton.addEventListener('click', () => {
    refreshDebugInfo();
  });
  
  // Initialize Firebase
  async function initializeFirebase(config) {
    try {
      logDebug('Initializing Firebase...');
      
      // Use our Firebase initializer
      await window.firebaseInit.initialize(config);
      
      logDebug('Firebase initialized successfully');
      showStatus('Firebase initialized successfully!', 'success');
      
      // Update debug info
      refreshDebugInfo();
    } catch (error) {
      logDebug(`Firebase initialization failed: ${error.message}`);
      showStatus(`Firebase initialization failed: ${error.message}`, 'error');
    }
  }
  
  // Update Firebase status in the debug panel
  function updateFirebaseStatus(message) {
    if (firebaseStatusDiv) {
      const timestamp = new Date().toLocaleTimeString();
      const statusLine = document.createElement('div');
      statusLine.textContent = `[${timestamp}] ${message}`;
      firebaseStatusDiv.appendChild(statusLine);
      
      // Auto-scroll to bottom
      firebaseStatusDiv.scrollTop = firebaseStatusDiv.scrollHeight;
    }
  }
  
  // Refresh debug info
  function refreshDebugInfo() {
    if (firebaseStatusDiv) {
      firebaseStatusDiv.innerHTML = '';
      
      // Show Firebase status
      if (window.firebaseInit.isReady()) {
        updateFirebaseStatus('Firebase Status: Initialized');
        
        try {
          const projectId = window.firebaseInit.app.options.projectId;
          updateFirebaseStatus(`Project ID: ${projectId}`);
        } catch (e) {
          updateFirebaseStatus(`Error getting project info: ${e.message}`);
        }
      } else {
        updateFirebaseStatus('Firebase Status: Not initialized');
      }
      
      // Check if Firebase is available
      const firebaseSdkAvailable = typeof firebase !== 'undefined';
      updateFirebaseStatus(`Firebase SDK available: ${firebaseSdkAvailable}`);
      
      // Update the SDK info elements
      const sdkAvailableEl = document.getElementById('firebase-sdk-available');
      const sdkVersionEl = document.getElementById('firebase-sdk-version');
      const initializedEl = document.getElementById('firebase-initialized');
      
      if (sdkAvailableEl) sdkAvailableEl.textContent = firebaseSdkAvailable ? 'Yes' : 'No';
      if (sdkVersionEl) sdkVersionEl.textContent = firebaseSdkAvailable ? firebase.SDK_VERSION : 'Not Available';
      if (initializedEl) initializedEl.textContent = window.firebaseInit.isReady() ? 'Yes' : 'No';
      
      // Show stored settings
      chrome.storage.sync.get(['userId', 'language', 'firebaseConfig'], (result) => {
        updateFirebaseStatus(`User ID: ${result.userId || 'Not set'}`);
        updateFirebaseStatus(`Language: ${result.language || 'Not set'}`);
        updateFirebaseStatus(`Firebase Config: ${result.firebaseConfig ? 'Present' : 'Not set'}`);
      });
    }
  }
  
  // Function to show status message
  function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = 'status';
    
    // Add appropriate class based on message type
    if (type === 'success') {
      statusMessage.classList.add('success');
    } else if (type === 'error') {
      statusMessage.classList.add('error');
    }
    
    statusMessage.style.display = 'block';
    
    // Hide status message after 5 seconds
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 5000);
  }
  
  // Try to initialize Firebase on load
  setTimeout(() => {
    if (!window.firebaseInit.isReady()) {
      window.firebaseInit.initializeFromStorage()
        .then(() => {
          logDebug('Firebase initialized from storage');
          refreshDebugInfo();
        })
        .catch(error => {
          logDebug(`Failed to initialize Firebase from storage: ${error.message}`);
        });
    }
  }, 500);
}); 