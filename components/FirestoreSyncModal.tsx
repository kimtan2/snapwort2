import { useState } from 'react';
import { syncWordsFromFirestore } from '@/lib/firebase';
import { restoreFromFirestore, backupToFirestore } from '@/lib/firestore';
import { useLanguage } from '@/lib/LanguageContext';
import { X, RefreshCw, Check, AlertCircle, Download, Upload } from 'lucide-react';

type FirestoreSyncModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function FirestoreSyncModal({ isOpen, onClose }: FirestoreSyncModalProps) {
  const { language } = useLanguage();
  const [username, setUsername] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  
  if (!isOpen) return null;

  const handleSync = async () => {
    if (!username.trim()) {
      setSyncResult({
        success: false,
        message: 'Please enter a username to sync from'
      });
      return;
    }

    try {
      setIsSyncing(true);
      setSyncResult(null);
      
      const wordCount = await syncWordsFromFirestore(username, language);
      
      setSyncResult({
        success: true,
        message: wordCount > 0 
          ? `Successfully synced ${wordCount} words from Firestore!` 
          : 'No new words found to sync.'
      });
    } catch (error) {
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred during sync'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    if (!username.trim()) {
      setSyncResult({
        success: false,
        message: 'Please enter a username to restore from'
      });
      return;
    }

    try {
      setIsRestoring(true);
      setSyncResult(null);
      
      const result = await restoreFromFirestore(username);
      
      if (result.success) {
        setSyncResult({
          success: true,
          message: `Successfully restored ${result.data?.itemCount || 0} words from backup!`
        });
      } else {
        setSyncResult({
          success: false,
          message: result.error || 'Failed to restore backup'
        });
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred during restore'
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleBackup = async () => {
    if (!username.trim()) {
      setSyncResult({
        success: false,
        message: 'Please enter a username to backup to'
      });
      return;
    }

    try {
      setIsBackingUp(true);
      setSyncResult(null);
      
      const result = await backupToFirestore(username);
      
      if (result.success) {
        setSyncResult({
          success: true,
          message: `Successfully backed up ${result.data?.itemCount || 0} words to Firestore!`
        });
      } else {
        setSyncResult({
          success: false,
          message: result.error || 'Failed to create backup'
        });
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred during backup'
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Firestore Sync</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 mb-4">
            Sync, backup, or restore your vocabulary with Firestore.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is the identifier used to retrieve or store your vocabulary.
            </p>
          </div>
        </div>
        
        {syncResult && (
          <div className={`rounded-md p-3 mb-4 ${
            syncResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {syncResult.success ? <Check size={18} /> : <AlertCircle size={18} />}
              </div>
              <div className="ml-3">
                <p>{syncResult.message}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between space-x-3">
          <button
            onClick={handleRestore}
            disabled={isRestoring || isSyncing || isBackingUp}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium text-white ${
              isRestoring ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isRestoring ? (
              <span className="flex items-center">
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Restoring...
              </span>
            ) : (
              <span className="flex items-center">
                <Download size={16} className="mr-2" />
                Restore
              </span>
            )}
          </button>
          
          <button
            onClick={handleSync}
            disabled={isSyncing || isRestoring || isBackingUp}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium text-white ${
              isSyncing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSyncing ? (
              <span className="flex items-center">
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Syncing...
              </span>
            ) : 'Sync New Words'}
          </button>
          
          <button
            onClick={handleBackup}
            disabled={isBackingUp || isSyncing || isRestoring}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium text-white ${
              isBackingUp ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isBackingUp ? (
              <span className="flex items-center">
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Backing up...
              </span>
            ) : (
              <span className="flex items-center">
                <Upload size={16} className="mr-2" />
                Backup
              </span>
            )}
          </button>
        </div>
        
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-gray-500 text-sm hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 