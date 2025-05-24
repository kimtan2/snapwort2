/**
 * FirebaseInitializer - Handles Firebase initialization for the extension
 * 
 * This module handles Firebase initialization in a safe way,
 * ensuring Firebase is only initialized once and handling errors properly.
 */

class FirebaseInitializer {
  constructor() {
    this.initialized = false;
    this.app = null;
    this.db = null;
    this.config = null;
    this.lastError = null;
  }

  /**
   * Logs a message to the console
   */
  log(message) {
    console.log(`[FirebaseInitializer] ${message}`);
  }

  /**
   * Logs an error to the console
   */
  logError(message, error) {
    console.error(`[FirebaseInitializer] ERROR - ${message}:`, error);
    this.lastError = {
      message: message,
      error: error,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Checks if Firebase is ready
   */
  isReady() {
    return this.initialized && this.db !== null;
  }

  /**
   * Get the most recent error
   */
  getLastError() {
    return this.lastError;
  }

  /**
   * Initialize Firebase with the provided configuration
   */
  async initialize(config) {
    try {
      this.log('Initializing Firebase...');
      
      if (!config) {
        throw new Error('No Firebase configuration provided');
      }
      
      this.config = config;
      
      // Check if Firebase was loaded
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK is not loaded. The local Firebase files may be missing or corrupted.');
      }
      
      // Log Firebase SDK version for debugging
      this.log(`Firebase SDK detected: ${firebase.SDK_VERSION || 'version unknown'}`);
      
      // Check if Firebase is already initialized
      let existingApp = false;
      try {
        existingApp = firebase.app();
        this.log('Firebase already initialized, reusing existing app');
      } catch (e) {
        this.log('No existing Firebase app, creating new');
      }
      
      // Initialize Firebase if needed
      if (!existingApp) {
        try {
          this.app = firebase.initializeApp(config);
          this.log(`Firebase initialized with project: ${config.projectId}`);
        } catch (initError) {
          // Special handling for "app already exists" error
          if (initError.code === 'app/duplicate-app') {
            this.log('App already exists, getting existing app');
            this.app = firebase.app();
          } else {
            throw initError;
          }
        }
      } else {
        this.app = existingApp;
      }
      
      // Initialize Firestore
      this.db = firebase.firestore();
      this.log('Firestore initialized');
      
      this.initialized = true;
      
      // Test connection with simplified method
      this.log('Testing basic Firestore functionality');
      
      // Simple test - just get a reference, don't try to write
      const testRef = this.db.collection('test');
      if (testRef) {
        this.log('Basic Firestore reference test passed');
      }
      
      return true;
    } catch (error) {
      this.logError('Failed to initialize Firebase', error);
      this.initialized = false;
      this.app = null;
      this.db = null;
      throw error;
    }
  }
  
  /**
   * Test the Firestore connection
   */
  async testConnection() {
    try {
      if (!this.isReady()) {
        throw new Error('Firebase is not initialized');
      }
      
      this.log('Testing Firestore connection...');
      
      // Try to write a test document
      const testDoc = {
        test: true,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        browser: navigator.userAgent,
        testDate: new Date().toISOString()
      };
      
      // Use the test_connections collection which should have more permissive rules
      const testRef = this.db.collection('test_connections').doc(`test_${Date.now()}`);
      await testRef.set(testDoc);
      
      this.log(`Firestore connection test successful with ID: ${testRef.id}`);
      return {
        success: true,
        testDocId: testRef.id
      };
    } catch (error) {
      this.logError('Firestore connection test failed', error);
      
      // Try a more basic test - just get a collection
      try {
        const collection = await this.db.collection('test').get();
        this.log('Could read from database but not write');
        return {
          success: false,
          error: 'Read access works, but write access failed. Check your Firestore rules.',
          canRead: true,
          canWrite: false
        };
      } catch (readError) {
        this.logError('Even basic read access failed', readError);
        return {
          success: false,
          error: 'Both read and write access failed. Check your Firebase configuration and Firestore rules.',
          canRead: false,
          canWrite: false
        };
      }
    }
  }
  
  /**
   * Save a word to Firestore
   */
  async saveWord(word, definition, userId, language = 'de') {
    try {
      if (!this.isReady()) {
        throw new Error('Firebase is not initialized');
      }
      
      if (!word || !definition) {
        throw new Error('Word and definition are required');
      }
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      this.log(`Saving word: ${word} for user: ${userId}`);
      
      // Create a unique ID for the word using timestamp
      const timestamp = Date.now();
      const wordId = `word_${timestamp}`;
      
      // Log the exact word being saved for debugging
      this.log(`Word content: "${word}"`);
      
      // Prepare the word data
      const wordData = {
        word: word,
        meaning: definition,
        language: language,
        queryType: 'definition',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        source: 'browser_extension',
        userId: userId,
        synced: false,
        savedAt: timestamp
      };
      
      // First try to save to user's vocabulary collection
      try {
        this.log(`Saving to collection 'users/${userId}/vocabulary' with ID: ${wordId}`);
        const userDocRef = this.db.collection('users').doc(userId)
          .collection('vocabulary').doc(wordId);
        
        await userDocRef.set(wordData);
        this.log(`Word saved successfully to user collection with ID: ${wordId}`);
        return {
          success: true,
          docId: wordId,
          collection: `users/${userId}/vocabulary`
        };
      } catch (userSaveError) {
        // If saving to user collection fails, try the global vocabulary collection
        this.logError(`Failed to save to user collection, trying vocabulary collection`, userSaveError);
        
        try {
          this.log(`Saving to collection 'vocabulary' with ID: ${wordId}`);
          const vocabDocRef = this.db.collection('vocabulary').doc(wordId);
          
          await vocabDocRef.set(wordData);
          this.log(`Word saved successfully to vocabulary collection with ID: ${wordId}`);
          return {
            success: true,
            docId: wordId,
            collection: 'vocabulary',
            fallback: true
          };
        } catch (vocabSaveError) {
          this.logError(`Failed to save to vocabulary collection`, vocabSaveError);
          throw new Error(`Failed to save word: ${vocabSaveError.message}`);
        }
      }
    } catch (error) {
      this.logError(`Failed to save word: ${word}`, error);
      throw error;
    }
  }
  
  /**
   * Load Firebase configuration from storage
   */
  async loadConfig() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['firebaseConfig'], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (!result.firebaseConfig) {
          reject(new Error('No Firebase configuration found in storage'));
          return;
        }
        
        try {
          let config;
          if (typeof result.firebaseConfig === 'string') {
            config = JSON.parse(result.firebaseConfig);
          } else {
            config = result.firebaseConfig;
          }
          
          // Validate basic configuration
          if (!config.apiKey || !config.projectId) {
            reject(new Error('Invalid Firebase configuration: missing required fields'));
            return;
          }
          
          resolve(config);
        } catch (error) {
          reject(new Error(`Invalid Firebase configuration format: ${error.message}`));
        }
      });
    });
  }
  
  /**
   * Initialize Firebase from stored configuration
   */
  async initializeFromStorage() {
    try {
      const config = await this.loadConfig();
      return await this.initialize(config);
    } catch (error) {
      this.logError('Failed to initialize Firebase from storage', error);
      throw error;
    }
  }
  
  /**
   * Get diagnostics about the Firebase initialization state
   */
  getDiagnostics() {
    return {
      sdkAvailable: typeof firebase !== 'undefined',
      sdkVersion: typeof firebase !== 'undefined' ? (firebase.SDK_VERSION || 'unknown') : 'not loaded',
      initialized: this.initialized,
      hasApp: this.app !== null,
      hasDb: this.db !== null,
      configLoaded: this.config !== null,
      lastError: this.lastError,
      timestamp: new Date().toISOString()
    };
  }
}

// Create a global instance
window.firebaseInit = new FirebaseInitializer(); 