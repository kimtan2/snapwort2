import { db } from './firebase';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { getLibrary, setLibrary } from './library';
import { Word } from './db';

export interface FirestoreResult {
  success: boolean;
  error?: string;
  data?: {
    timestamp?: string;
    itemCount?: number;
    [key: string]: unknown;
  };
}

// Deep cleaning function to remove undefined values recursively
function removeUndefined(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item)).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = removeUndefined((obj as Record<string, unknown>)[key]);
        if (value !== undefined) {
          result[key] = value;
        }
      }
    }
    return result;
  }
  
  return obj;
}

// Helper function to clean word data for Firestore
function cleanWordForFirestore(word: Word): Record<string, unknown> {
  const cleanedWord: Record<string, unknown> = {
    word: word.word || '',
    meaning: word.meaning || '',
    language: word.language || 'en',
  };

  // Handle the createdAt field - ensuring it's properly formatted
  if (word.createdAt) {
    // Convert to ISO string if it's a Date object or use current date
    try {
      // Check if it's a proper Date object
      if (word.createdAt instanceof Date && !isNaN(word.createdAt.getTime())) {
        cleanedWord.createdAt = word.createdAt.toISOString();
      } else if (typeof word.createdAt === 'string') {
        // If it's already a string, try to parse it or use as is
        cleanedWord.createdAt = word.createdAt;
      } else {
        // Use current date as fallback
        cleanedWord.createdAt = new Date().toISOString();
      }
    } catch (error) {
      // Fallback to current date if there's any error
      cleanedWord.createdAt = new Date().toISOString();
    }
  } else {
    // Default to current date if createdAt is missing
    cleanedWord.createdAt = new Date().toISOString();
  }

  // Only add optional fields if they exist and are not undefined
  if (word.queryType !== undefined) cleanedWord.queryType = word.queryType;
  if (word.speaking !== undefined) cleanedWord.speaking = word.speaking;
  
  // Carefully handle followUpHistory which might contain undefined values
  if (word.followUpHistory && Array.isArray(word.followUpHistory) && word.followUpHistory.length > 0) {
    cleanedWord.followUpHistory = word.followUpHistory
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        question: item.question || '',
        answer: item.answer || ''
      }));
  }

  return cleanedWord;
}

export async function backupToFirestore(userName: string): Promise<FirestoreResult> {
  try {
    // Validate userName
    if (!userName || userName.trim() === '') {
      return {
        success: false,
        error: 'Username cannot be empty'
      };
    }

    // Validate Firestore instance
    if (!db) {
      return {
        success: false,
        error: 'Firestore is not initialized'
      };
    }

    const library = await getLibrary();
    
    // Check if library data exists
    if (!library || (Array.isArray(library) && library.length === 0)) {
      return {
        success: false,
        error: 'No library data found to backup'
      };
    }

    // Clean and prepare the library data for Firestore
    const rawCleanedLibrary = library.map(cleanWordForFirestore);
    
    // Apply deep cleaning to remove any remaining undefined values
    const cleanedLibrary = removeUndefined(rawCleanedLibrary) as unknown[];

    // Get the backups collection reference
    const backupsCollection = collection(db, 'backups');
    const userDoc = doc(backupsCollection, userName);
    
    // Final data to be stored, with one more check for undefined values
    const finalData = removeUndefined({
      library: cleanedLibrary,
      lastBackup: new Date().toISOString(),
    });
    
    // Debug log to check the data structure
    console.log('Backing up data structure:', JSON.stringify(finalData).substring(0, 200) + '...');
    
    await setDoc(userDoc, finalData);
    
    return {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        itemCount: cleanedLibrary.length
      }
    };
  } catch (error) {
    console.error('Error backing up to Firestore:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during backup'
    };
  }
}

export async function restoreFromFirestore(userName: string): Promise<FirestoreResult> {
  try {
    // Validate userName
    if (!userName || userName.trim() === '') {
      return {
        success: false,
        error: 'Username cannot be empty'
      };
    }

    // Validate Firestore instance
    if (!db) {
      return {
        success: false,
        error: 'Firestore is not initialized'
      };
    }

    // Get the backups collection reference
    const backupsCollection = collection(db, 'backups');
    const userDoc = doc(backupsCollection, userName);
    const docSnap = await getDoc(userDoc);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'No backup found for this user'
      };
    }

    const data = docSnap.data();
    
    if (!data.library) {
      return {
        success: false,
        error: 'Backup data is corrupt or incomplete'
      };
    }

    // Convert the stored data back to Word objects
    const restoredLibrary: Word[] = data.library.map((word: Record<string, unknown>) => ({
      word: word.word?.toString() || '',
      meaning: word.meaning?.toString() || '',
      language: word.language?.toString() as 'en' | 'de' || 'en',
      createdAt: word.createdAt ? new Date(word.createdAt.toString()) : new Date(),
      queryType: word.queryType as string | undefined,
      speaking: Boolean(word.speaking),
      followUpHistory: Array.isArray(word.followUpHistory) ? word.followUpHistory : []
    }));
    
    await setLibrary(restoredLibrary);
    
    return {
      success: true,
      data: {
        timestamp: data.lastBackup,
        itemCount: restoredLibrary.length
      }
    };
  } catch (errorObj) {
    console.error('Error restoring from Firestore:', errorObj);
    return {
      success: false,
      error: errorObj instanceof Error ? errorObj.message : 'Unknown error occurred during restore'
    };
  }
} 