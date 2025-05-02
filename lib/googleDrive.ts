import { db, Word } from './db';

// Constants for Google Drive API
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'snapwort_library.json';

// Define types for Google API objects
interface GapiClient {
  client: {
    init: (config: { apiKey: string | undefined; discoveryDocs: string[] }) => Promise<void>;
    drive: {
      files: {
        list: (params: {
          q: string;
          spaces: string;
          fields: string;
        }) => Promise<{
          result: {
            files: Array<{ id: string; name: string }>;
          };
        }>;
        get: (params: { fileId: string; alt: string }) => Promise<{ body: string }>;
      };
    };
  };
  auth: {
    getToken: () => { access_token: string };
  };
  load: (api: string, callback: () => void) => void;
}

interface TokenClient {
  callback: (response: { error?: string }) => void;
  requestAccessToken: (options: { prompt: string }) => void;
}

interface WindowGapi {
  load: (api: string, callback: () => void) => void;
  client: {
    init: (config: { apiKey: string | undefined; discoveryDocs: string[] }) => Promise<void>;
    drive: {
      files: {
        list: (params: {
          q: string;
          spaces: string;
          fields: string;
        }) => Promise<{
          result: {
            files: Array<{ id: string; name: string }>;
          };
        }>;
        get: (params: { fileId: string; alt: string }) => Promise<{ body: string }>;
      };
    };
  };
  auth: {
    getToken: () => { access_token: string };
  };
}

let gapi: GapiClient;
let tokenClient: TokenClient;

// Initialize the Google API client library
export const initializeGoogleApi = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  // Load the gapi script if not already loaded
  if (!window.gapi) {
    await new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  // Load the gapi client
  await new Promise<void>((resolve) => {
    (window.gapi as WindowGapi).load('client', resolve);
  });

  // Initialize the gapi client
  await (window.gapi as WindowGapi).client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  });

  gapi = window.gapi as unknown as GapiClient;
  
  // Load the Google Identity Services script
  await new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve();
    document.body.appendChild(script);
  });

  // Initialize the token client
  if (window.google) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID!,
      scope: SCOPES,
      callback: '', // Will be set later
    }) as TokenClient;
  }
};

// Authenticate with Google
export const authenticateWithGoogle = async (): Promise<boolean> => {
  try {
    if (!gapi || !tokenClient) {
      await initializeGoogleApi();
    }
    
    if (!tokenClient) {
      throw new Error('Failed to initialize token client');
    }
    
    return new Promise<boolean>((resolve) => {
      tokenClient.callback = (response: { error?: string }) => {
        if (response.error) {
          resolve(false);
        } else {
          resolve(true);
        }
      };
      
      tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  } catch (error) {
    console.error('Error authenticating with Google:', error);
    return false;
  }
};

// Check if file exists in Google Drive
const findFile = async (): Promise<string | null> => {
  try {
    const response = await gapi.client.drive.files.list({
      q: `name='${FILE_NAME}' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)',
    });
    
    const files = response.result.files;
    if (files && files.length > 0) {
      return files[0].id;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding file:', error);
    return null;
  }
};

// Create a new file in Google Drive
const createFile = async (content: string): Promise<string | null> => {
  try {
    const file = new Blob([content], { type: 'application/json' });
    const metadata = {
      name: FILE_NAME,
      mimeType: 'application/json',
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);
    
    const accessToken = gapi.auth.getToken().access_token;
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error creating file:', error);
    return null;
  }
};

// Update an existing file in Google Drive
const updateFile = async (fileId: string, content: string): Promise<boolean> => {
  try {
    const file = new Blob([content], { type: 'application/json' });
    const metadata = {
      name: FILE_NAME,
      mimeType: 'application/json',
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);
    
    const accessToken = gapi.auth.getToken().access_token;
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error updating file:', error);
    return false;
  }
};

// Download file content from Google Drive
const downloadFile = async (fileId: string): Promise<string | null> => {
  try {
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });
    
    return response.body;
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
};

// Backup library to Google Drive
export const backupToGoogleDrive = async (): Promise<boolean> => {
  try {
    // Get all words from the database
    const words = await db.words.toArray();
    const content = JSON.stringify(words);
    
    // Find or create the file
    const fileId = await findFile();
    
    if (fileId) {
      // Update existing file
      return await updateFile(fileId, content);
    } else {
      // Create new file
      const newFileId = await createFile(content);
      return !!newFileId;
    }
  } catch (error) {
    console.error('Error backing up library:', error);
    return false;
  }
};

// Restore library from Google Drive
export const restoreFromGoogleDrive = async (): Promise<boolean> => {
  try {
    // Find the file
    const fileId = await findFile();
    
    if (!fileId) {
      return false;
    }
    
    // Download the file content
    const content = await downloadFile(fileId);
    
    if (!content) {
      return false;
    }
    
    // Parse the content
    const words: Word[] = JSON.parse(content);
    
    // Clear the current database
    await db.words.clear();
    
    // Add the words to the database
    await db.words.bulkAdd(words);
    
    return true;
  } catch (error) {
    console.error('Error restoring library:', error);
    return false;
  }
};

// Add type definitions for the global objects
declare global {
  interface Window {
    gapi: WindowGapi;
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: string;
          }) => unknown;
        };
      };
    };
  }
} 