import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getLibrary, setLibrary } from './library';

export interface FirestoreResult {
  success: boolean;
  error?: string;
  data?: {
    timestamp?: string;
    itemCount?: number;
    [key: string]: unknown;
  };
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

    const library = await getLibrary();
    
    // Check if library data exists
    if (!library || (Array.isArray(library) && library.length === 0)) {
      return {
        success: false,
        error: 'No library data found to backup'
      };
    }
    
    await setDoc(doc(db, 'backups', userName), {
      library,
      lastBackup: new Date().toISOString(),
    });
    
    return {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        itemCount: Array.isArray(library) ? library.length : 0
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

    const docRef = doc(db, 'backups', userName);
    const docSnap = await getDoc(docRef);
    
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
    
    await setLibrary(data.library);
    
    return {
      success: true,
      data: {
        timestamp: data.lastBackup,
        itemCount: Array.isArray(data.library) ? data.library.length : 0
      }
    };
  } catch (error) {
    console.error('Error restoring from Firestore:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during restore'
    };
  }
} 