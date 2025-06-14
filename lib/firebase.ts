// 2. Updated lib/firebase.ts with better error handling
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db as localDb, Word } from './db';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Check if all required config values are present
const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  console.error('Missing Firebase configuration keys:', missingKeys);
  console.error('Please check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_* variables are set');
}

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;

try {
  if (!getApps().length) {
    console.log('Initializing Firebase with config:', {
      ...firebaseConfig,
      apiKey: firebaseConfig.apiKey ? '[PRESENT]' : '[MISSING]',
      // Don't log sensitive data
    });
    
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firebase initialized successfully');
  } else {
    app = getApps()[0];
    db = getFirestore(app);
    console.log('Using existing Firebase app');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// Test Firebase connection
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    // Try to read from a test collection
    const testCollection = collection(db, 'test');
    await getDocs(testCollection);
    console.log('Firebase connection test: SUCCESS');
    return true;
  } catch (error) {
    console.error('Firebase connection test: FAILED', error);
    return false;
  }
}

// Function to sync words from Firestore to local IndexedDB
export async function syncWordsFromFirestore(userId: string, language: 'en' | 'de'): Promise<number> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    // Query for unsynchronized words for this user
    const vocabCollection = collection(db, 'vocabulary');
    const q = query(
      vocabCollection,
      where('userId', '==', userId),
      where('language', '==', language),
      where('synced', '==', false)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No new words to sync');
      return 0;
    }

    let wordCount = 0;
    // Add each word to the local database
    const promises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      
      // Convert Firestore timestamp to Date
      let createdAt = new Date();
      if (data.createdAt instanceof Timestamp) {
        createdAt = data.createdAt.toDate();
      }
      
      // Create a word object that matches our local schema
      const word: Omit<Word, 'id'> = {
        word: data.word,
        meaning: data.meaning,
        language: data.language,
        queryType: data.queryType || 'definition',
        createdAt: createdAt,
        // Include any additional fields
        followUpHistory: data.followUpHistory || []
      };
      
      // Add the word to the local database
      await localDb.words.add(word);
      wordCount++;
    });
    
    await Promise.all(promises);
    console.log(`Synced ${wordCount} words from Firestore`);
    return wordCount;
  } catch (error) {
    console.error('Error syncing from Firestore:', error);
    throw error;
  }
}

export { db };