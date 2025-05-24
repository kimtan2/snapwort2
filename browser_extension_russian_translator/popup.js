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
    console.log('[RussianTranslator] ' + message);
    
    // If we have a status div, update it
    const statusDiv = document.getElementById('firebase-status');
    if (statusDiv) {
      statusDiv.innerHTML += message + '<br>';
      statusDiv.scrollTop = statusDiv.scrollHeight;
    }
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
    logDebug('Loaded settings from storage');
    
    // Check if Firebase SDK is available
    updateFirebaseStatus();
    
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
      if (typeof result.firebaseConfig === 'string') {
        try {
          // Try to parse and prettify the JSON
          const parsed = JSON.parse(result.firebaseConfig);
          firebaseConfigTextarea.value = JSON.stringify(parsed, null, 2);
        } catch (e) {
          firebaseConfigTextarea.value = result.firebaseConfig;
        }
      } else {
        firebaseConfigTextarea.value = JSON.stringify(result.firebaseConfig, null, 2);
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
      showStatus('error', 'API key cannot be empty');
      return;
    }
    
    chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
      showStatus('success', 'API key saved successfully');
    });
  });
  
  // Save app URL
  saveUrlButton.addEventListener('click', () => {
    const appUrl = appUrlInput.value.trim();
    
    if (!appUrl) {
      showStatus('error', 'App URL cannot be empty');
      return;
    }
    
    chrome.storage.sync.set({ appUrl: appUrl }, () => {
      showStatus('success', 'App URL saved successfully');
    });
  });
  
  // Save language
  saveLanguageButton.addEventListener('click', () => {
    const language = languageSelect.value;
    
    chrome.storage.sync.set({ language: language }, () => {
      showStatus('success', 'Language preference saved successfully');
    });
  });
  
  // Save user ID
  saveUserIdButton.addEventListener('click', () => {
    const userId = userIdInput.value.trim();
    
    if (!userId) {
      showStatus('error', 'User ID cannot be empty');
      return;
    }
    
    chrome.storage.sync.set({ userId: userId }, () => {
      showStatus('success', 'User ID saved successfully');
    });
  });
  
  // Save Firebase configuration
  saveFirebaseButton.addEventListener('click', () => {
    const configText = firebaseConfigTextarea.value.trim();
    
    if (!configText) {
      showStatus('error', 'Firebase configuration cannot be empty');
      return;
    }
    
    try {
      // Try to parse the JSON to validate it
      const parsed = JSON.parse(configText);
      
      // Check for required fields
      if (!parsed.apiKey || !parsed.projectId) {
        showStatus('error', 'Firebase config must include apiKey and projectId');
        return;
      }
      
      // Store the stringified version
      chrome.storage.sync.set({ firebaseConfig: configText }, () => {
        showStatus('success', 'Firebase configuration saved successfully');
        
        // Try to initialize Firebase immediately
        try {
          if (window.firebaseInit) {
            window.firebaseInit.initialize(parsed).then(() => {
              logDebug('Firebase initialized successfully after saving config');
              updateFirebaseStatus();
            }).catch(error => {
              logDebug('Failed to initialize Firebase after saving config: ' + error.message);
              updateFirebaseStatus();
            });
          } else {
            logDebug('firebaseInit not available');
          }
        } catch (error) {
          logDebug('Error initializing Firebase: ' + error.message);
        }
      });
    } catch (e) {
      showStatus('error', 'Invalid JSON format for Firebase configuration: ' + e.message);
    }
  });
  
  // Test Firebase connection
  testFirebaseButton.addEventListener('click', testFirebaseConnection);
  
  // Refresh debug info
  refreshDebugButton.addEventListener('click', () => {
    refreshDebugInfo();
  });
  
  // Update Firebase status in the debug panel
  function updateFirebaseStatus() {
    // Check Firebase SDK availability
    const sdkAvailable = typeof firebase !== 'undefined';
    
    // Update SDK status in debug panel
    const sdkAvailableElement = document.getElementById('firebase-sdk-available');
    if (sdkAvailableElement) {
      sdkAvailableElement.textContent = sdkAvailable ? 'Yes' : 'No';
      sdkAvailableElement.className = sdkAvailable ? 'status-good' : 'status-bad';
    }
    
    // Update SDK version
    const sdkVersionElement = document.getElementById('firebase-sdk-version');
    if (sdkVersionElement) {
      if (sdkAvailable && firebase.SDK_VERSION) {
        sdkVersionElement.textContent = firebase.SDK_VERSION;
        sdkVersionElement.className = 'status-good';
      } else {
        sdkVersionElement.textContent = 'Not available';
        sdkVersionElement.className = 'status-bad';
      }
    }
    
    // Update initialization status
    const firebaseInitialized = document.getElementById('firebase-initialized');
    if (firebaseInitialized) {
      const isInitialized = window.firebaseInit && window.firebaseInit.isReady();
      firebaseInitialized.textContent = isInitialized ? 'Yes' : 'No';
      firebaseInitialized.className = isInitialized ? 'status-good' : 'status-bad';
    }
    
    // Update Firebase status display
    const firebaseStatus = document.getElementById('firebase-status');
    if (firebaseStatus) {
      if (!sdkAvailable) {
        firebaseStatus.innerHTML = `
          <div class="status-error-title">
            Firebase SDK not loaded! CSP issues may be preventing script loading.
          </div>
          <div class="status-error-desc">
            Check browser console for errors. Make sure manifest.json has correct CSP settings.
          </div>
        `;
      } else if (window.firebaseInit && window.firebaseInit.isReady()) {
        firebaseStatus.innerHTML = `
          <div class="status-success-title">
            Firebase initialized successfully
          </div>
          <div class="status-success-desc">
            Project ID: ${window.firebaseInit.config ? window.firebaseInit.config.projectId : 'unknown'}
          </div>
        `;
      } else {
        // Get last error if available
        let errorMsg = 'Unknown error';
        if (window.firebaseInit && window.firebaseInit.getLastError()) {
          const error = window.firebaseInit.getLastError();
          errorMsg = error.message;
          if (error.error && error.error.message) {
            errorMsg += ': ' + error.error.message;
          }
        }
        
        firebaseStatus.innerHTML = `
          <div class="status-warning-title">
            Firebase not initialized
          </div>
          <div class="status-warning-desc">
            ${errorMsg}
          </div>
          <div class="status-warning-action">
            Please check your Firebase configuration and try again.
          </div>
        `;
      }
    }
  }
  
  // Refresh debug info
  function refreshDebugInfo() {
    updateFirebaseStatus();
    
    // Add status message
    logDebug('Debug info refreshed at ' + new Date().toLocaleTimeString());
  }
  
  // Function to show status message
  function showStatus(type, message) {
    // Remove any existing status
    const existingStatus = document.querySelector('.status');
    if (existingStatus) {
      existingStatus.remove();
    }
    
    // Create new status element
    const statusElement = document.createElement('div');
    statusElement.className = `status ${type}`;
    statusElement.textContent = message;
    
    // Find a suitable parent
    const parentElement = document.querySelector('.tab-panel.active .section') || document.querySelector('.section');
    if (parentElement) {
      parentElement.appendChild(statusElement);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        statusElement.remove();
      }, 5000);
    }
  }
  
  // Test Firebase connection
  async function testFirebaseConnection() {
    logDebug('Testing Firebase connection...');
    
    // Update the button state
    const testButton = document.getElementById('test-firebase-button');
    if (testButton) {
      testButton.textContent = 'Testing...';
      testButton.disabled = true;
    }
    
    try {
      // Check if Firebase SDK is available
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK is not loaded. Please check the console for errors.');
      }
      
      // Check if firebaseInit is available
      if (!window.firebaseInit) {
        throw new Error('Firebase initializer not available. Try reloading the extension.');
      }
      
      // Test if Firebase is already initialized
      if (!window.firebaseInit.isReady()) {
        logDebug('Firebase not initialized, trying to initialize from storage...');
        
        try {
          await window.firebaseInit.initializeFromStorage();
          logDebug('Firebase initialized from storage');
        } catch (initError) {
          throw new Error('Failed to initialize Firebase: ' + initError.message);
        }
      }
      
      // Test the connection
      logDebug('Testing Firestore connection with a test document...');
      const testResult = await window.firebaseInit.testConnection();
      
      if (testResult.success) {
        logDebug('Firebase connection test successful!');
        showStatus('success', 'Firebase connection test successful!');
      } else {
        logDebug('Firebase connection test failed: ' + testResult.error);
        showStatus('error', 'Firebase connection test failed: ' + testResult.error);
      }
    } catch (error) {
      logDebug('Error testing Firebase: ' + error.message);
      showStatus('error', 'Firebase test failed: ' + error.message);
    } finally {
      // Restore button state
      if (testButton) {
        testButton.textContent = 'Test Firebase Connection';
        testButton.disabled = false;
      }
      
      // Update status display
      updateFirebaseStatus();
    }
  }
}); 