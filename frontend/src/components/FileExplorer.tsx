import React, { useEffect, useState } from 'react';
import { documentsApi, DocumentMetadata } from '../api/documents';

interface FileExplorerProps {
  onFileSelect: (filePath: string) => void;
  selectedFile?: string;
  onFolderChange?: (folderPath: string) => void;
}

// SVG Icons
const FolderIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 8 }}>
    <path d="M2 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7.5L6 2H2z"/>
  </svg>
);

const FileIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 8 }}>
    <path d="M3.5 1.75V4h9V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25zM3.5 5.5v8.75c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25V5.5h-9z"/>
  </svg>
);

const UpFolderIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 8 }}>
    <path d="M2 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7.5L6 2H2z"/>
  </svg>
);

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect, selectedFile, onFolderChange }) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const loadCurrentDirectory = async (path: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const docs = await documentsApi.listDocuments(path);
      setItems(docs || []);
    } catch (error) {
      console.error('Failed to load directory:', error);
      setError('Failed to load directory. Make sure the backend is running.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentDirectory(currentPath);
    // Notify parent component of folder change
    if (onFolderChange) {
      onFolderChange(currentPath);
    }
  }, [currentPath, onFolderChange]);

  const handleFolderClick = (folderPath: string) => {
    if (folderPath === '..') {
      // Go up one level
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      setCurrentPath(parentPath);
    } else {
      // Enter folder
      const newPath = currentPath ? `${currentPath}/${folderPath}` : folderPath;
      setCurrentPath(newPath);
    }
  };

  const handleFileClick = (filePath: string) => {
    const fullPath = currentPath ? `${currentPath}/${filePath}` : filePath;
    onFileSelect(fullPath);
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    const filePath = currentPath ? `${currentPath}/${newFileName.trim()}` : newFileName.trim();
    try {
      await documentsApi.createDocument({
        filePath,
        content: '// New file\n',
        isFolder: false,
      });
      setNewFileName('');
      loadCurrentDirectory(currentPath);
    } catch (error) {
      console.error('Failed to create file:', error);
      setError('Failed to create file. Make sure the backend is running.');
    }
  };

  const handleDeleteItem = async (itemPath: string) => {
    const fullPath = currentPath ? `${currentPath}/${itemPath}` : itemPath;
    if (!window.confirm(`Are you sure you want to delete ${fullPath}?`)) return;
    try {
      await documentsApi.deleteDocument(fullPath);
      loadCurrentDirectory(currentPath);
      if (selectedFile === fullPath) {
        onFileSelect('');
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      setError('Failed to delete item. Make sure the backend is running.');
    }
  };

  const getCurrentPathDisplay = () => {
    return currentPath || 'Root';
  };

  return (
    <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px', height: '100%', overflow: 'auto' }}>
      <h3>Vebitor</h3>
      
      {/* Current Path Display */}
      <div style={{ 
        fontSize: '12px', 
        color: '#666', 
        marginBottom: '10px',
        padding: '5px',
        backgroundColor: '#f5f5f5',
        borderRadius: '3px',
        wordBreak: 'break-all'
      }}>
        📁 {getCurrentPathDisplay()}
      </div>

      {error && (
        <div style={{
          color: 'red',
          fontSize: '12px',
          marginBottom: '10px',
          padding: '5px',
          backgroundColor: '#ffe6e6',
          borderRadius: '3px',
        }}>
          {error}
        </div>
      )}

      {/* Create File Section */}
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={newFileName}
          onChange={e => setNewFileName(e.target.value)}
          placeholder="Enter filename (e.g., test.txt, script.js)"
          style={{ width: '100%', marginBottom: '5px' }}
        />
        <button onClick={handleCreateFile} style={{ width: '100%' }}>
          Create File
        </button>
      </div>

      {/* Navigation and File List */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {/* Up Navigation (if not in root) */}
          {currentPath && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px',
                cursor: 'pointer',
                color: '#222',
                fontSize: '14px',
                borderBottom: '1px solid #eee',
                marginBottom: '5px'
              }}
              onClick={() => handleFolderClick('..')}
              title="Go up one level"
            >
              {UpFolderIcon}
              ..
            </div>
          )}

          {/* Files and Folders */}
          {items.map((item) => (
            <div
              key={item.filePath}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                cursor: item.isFolder ? 'pointer' : 'pointer',
                background: selectedFile === (currentPath ? `${currentPath}/${item.filePath}` : item.filePath) ? '#e0e0e0' : 'transparent',
                fontWeight: 'normal',
                color: '#222',
                fontSize: '14px',
                borderRadius: '3px',
                marginBottom: '2px'
              }}
              onClick={() => item.isFolder ? handleFolderClick(item.filePath) : handleFileClick(item.filePath)}
            >
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                {item.isFolder ? FolderIcon : FileIcon}
                {item.filePath}
              </div>
              <span
                onClick={e => {
                  e.stopPropagation();
                  handleDeleteItem(item.filePath);
                }}
                style={{ 
                  marginLeft: 8, 
                  padding: '2px 5px',
                  cursor: 'pointer',
                  color: '#999',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                title="Delete"
              >
                ×
              </span>
            </div>
          ))}

          {items.length === 0 && !currentPath && (
            <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
              No files or folders found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileExplorer; 