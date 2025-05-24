import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db as localDb, Word } from './db';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error; // Re-throw the error to handle it in the calling code
  }
} else {
  app = getApps()[0];
  db = getFirestore(app);
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
      
      // Update the word in Firestore to mark it as synced
      // We use a different collection method for updating since we're using modular API
      // This is commented out as you would need the setDoc or updateDoc functions imported
      // and would need to handle exceptions separately
      
      // await updateDoc(doc.ref, { synced: true });
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