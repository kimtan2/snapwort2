'use client';

import { useState } from 'react';
import { Cloud, Download, Upload, Database, Loader, AlertCircle } from 'lucide-react';
import { authenticateWithGoogle, backupToGoogleDrive, restoreFromGoogleDrive } from '@/lib/googleDrive';
import { backupToFirestore, restoreFromFirestore } from '@/lib/firestore';

export default function BackupPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [backupType, setBackupType] = useState<'google' | 'firestore' | null>(null);
  const [progress, setProgress] = useState<'idle' | 'uploading' | 'downloading'>('idle');

  const handleAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await authenticateWithGoogle();
      if (success) {
        setIsAuthenticated(true);
        setMessage('Successfully authenticated with Google Drive');
      } else {
        setMessage('Authentication failed. Please try again.');
      }
    } catch (error) {
      setError('Failed to authenticate: ' + (error as Error).message);
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!userName && backupType === 'firestore') {
      setError('Please enter your name to backup to Firestore');
      return;
    }

    setIsLoading(true);
    setProgress('uploading');
    setError(null);
    setMessage('');
    
    try {
      if (backupType === 'google') {
        const success = await backupToGoogleDrive();
        if (success) {
          setMessage(`Successfully backed up library to Google Drive`);
        } else {
          setError(`Failed to backup library to Google Drive. Please try again.`);
        }
      } else if (backupType === 'firestore') {
        const result = await backupToFirestore(userName);
        if (result.success) {
          setMessage(`Successfully backed up ${result.data?.itemCount || 0} items to Firestore`);
        } else {
          setError(result.error || 'Failed to backup library to Firestore');
        }
      }
    } catch (error) {
      setError('Failed to upload: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
      setProgress('idle');
    }
  };

  const handleDownload = async () => {
    if (!userName && backupType === 'firestore') {
      setError('Please enter your name to restore from Firestore');
      return;
    }

    setIsLoading(true);
    setProgress('downloading');
    setError(null);
    setMessage('');
    
    try {
      if (backupType === 'google') {
        const success = await restoreFromGoogleDrive();
        if (success) {
          setMessage(`Successfully downloaded library from Google Drive`);
        } else {
          setError(`Failed to download library from Google Drive. Please try again.`);
        }
      } else if (backupType === 'firestore') {
        const result = await restoreFromFirestore(userName);
        if (result.success) {
          setMessage(`Successfully restored ${result.data?.itemCount || 0} items from Firestore`);
        } else {
          setError(result.error || 'Failed to restore library from Firestore');
        }
      }
    } catch (error) {
      setError('Failed to download: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
      setProgress('idle');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="flex flex-col items-center mb-8">
        <Cloud className="w-16 h-16 text-primary-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Backup Library</h1>
        <p className="text-gray-600 text-center mt-2">
          Sync your word library with Google Drive or Firestore
        </p>
      </div>

      {/* Loading state UI */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-center mb-3">
            <Loader className="w-6 h-6 text-primary-600 animate-spin mr-2" />
            <span className="text-gray-700 font-medium">
              {progress === 'uploading' 
                ? 'Uploading to ' + (backupType === 'google' ? 'Google Drive' : 'Firestore') 
                : progress === 'downloading' 
                  ? 'Downloading from ' + (backupType === 'google' ? 'Google Drive' : 'Firestore')
                  : 'Processing...'}
            </span>
          </div>
          <p className="text-gray-500 text-sm text-center">Please wait while we process your request...</p>
        </div>
      )}

      {/* Success message */}
      {message && !isLoading && (
        <div className="flex items-start bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="ml-3">{message}</p>
        </div>
      )}

      {/* Error message */}
      {error && !isLoading && (
        <div className="flex items-start bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="ml-3">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {!backupType ? (
          <>
            <button
              onClick={() => setBackupType('google')}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <img src="/google-drive-icon.svg" alt="Google Drive" className="w-5 h-5 mr-2" />
              Backup to Google Drive
            </button>
            
            <button
              onClick={() => setBackupType('firestore')}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <Database className="w-5 h-5 mr-2" />
              Backup to Firestore
            </button>
          </>
        ) : backupType === 'google' ? (
          <>
            {!isAuthenticated ? (
              <button
                onClick={handleAuth}
                disabled={isLoading}
                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <img src="/google-drive-icon.svg" alt="Google Drive" className="w-5 h-5 mr-2" />
                {isLoading ? 'Connecting...' : 'Connect to Google Drive'}
              </button>
            ) : (
              <>
                <button
                  onClick={handleUpload}
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Backup to Google Drive
                </button>
                
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Restore from Google Drive
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <div className="mb-4">
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your name"
                disabled={isLoading}
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5 mr-2" />
              Backup to Firestore
            </button>
            
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5 mr-2" />
              Restore from Firestore
            </button>
          </>
        )}

        <button
          onClick={() => {
            setBackupType(null);
            setUserName('');
            setIsAuthenticated(false);
            setError(null);
            setMessage('');
          }}
          className="w-full text-gray-600 hover:text-gray-800 font-medium py-2"
          disabled={isLoading}
        >
          Change Backup Method
        </button>
      </div>
    </div>
  );
} 