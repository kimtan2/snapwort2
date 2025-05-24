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
  }

  /**
   * Checks if Firebase is ready
   */
  isReady() {
    return this.initialized && this.db !== null;
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
        throw new Error('Firebase SDK is not loaded');
      }
      
      // Check if Firebase is already initialized and delete the app if it is
      if (firebase.apps && firebase.apps.length > 0) {
        this.log('Firebase already initialized, deleting existing app...');
        await firebase.app().delete();
      }
      
      // Initialize Firebase
      this.app = firebase.initializeApp(config);
      this.log(`Firebase initialized with project: ${config.projectId}`);
      
      // Initialize Firestore
      this.db = firebase.firestore();
      this.log('Firestore initialized');
      
      this.initialized = true;
      
      // Test connection
      await this.testConnection();
      
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
      const testRef = this.db.collection('test').doc('connection_test');
      await testRef.set({
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        message: 'Connection test successful',
        browser: navigator.userAgent
      });
      
      // Also test writing to vocabulary collection
      this.log('Testing write to vocabulary collection...');
      const vocabTestRef = this.db.collection('vocabulary').doc('vocabulary_test');
      await vocabTestRef.set({
        word: 'test',
        meaning: 'A test word to verify vocabulary collection access',
        language: 'en',
        queryType: 'definition',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        source: 'initialization_test',
        userId: 'test_user',
        synced: false
      });
      
      this.log('Firestore connection test successful for both collections');
      return true;
    } catch (error) {
      this.logError('Firestore connection test failed', error);
      throw error;
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
      
      // Create a unique ID for the word
      const wordId = `word_${word.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
      
      // Prepare the word data
      const wordData = {
        word: word,
        meaning: definition,
        language: language,
        queryType: 'definition',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        source: 'browser_extension',
        userId: userId,
        synced: false
      };
      
      // Save to Firestore
      await this.db.collection('vocabulary').doc(wordId).set(wordData);
      
      this.log(`Word saved successfully with ID: ${wordId}`);
      return true;
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
          const config = JSON.parse(result.firebaseConfig);
          resolve(config);
        } catch (error) {
          reject(new Error('Invalid Firebase configuration format'));
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
}

// Create a global instance
window.firebaseInit = new FirebaseInitializer(); 