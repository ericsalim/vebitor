import React, { useState, useEffect } from 'react';
import { documentsApi, DocumentMetadata } from '../api/documents';

interface FolderBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFolder: (folderPath: string) => void;
  currentPath?: string;
}

// SVG Icons
const FolderIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 8 }}>
    <path d="M2 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7.5L6 2H2z"/>
  </svg>
);

const UpFolderIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 8 }}>
    <path d="M2 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7.5L6 2H2z"/>
  </svg>
);

const FolderBrowser: React.FC<FolderBrowserProps> = ({ 
  isOpen, 
  onClose, 
  onSelectFolder, 
  currentPath = '' 
}) => {
  const [currentFolderPath, setCurrentFolderPath] = useState(currentPath);
  const [items, setItems] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCurrentDirectory = async (path: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const docs = await documentsApi.listDocuments(path);
      // Filter to show only folders
      const folders = (docs || []).filter(item => item.isFolder);
      setItems(folders);
    } catch (error) {
      console.error('Failed to load directory:', error);
      setError('Failed to load directory. Make sure the backend is running.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentFolderPath(currentPath);
      loadCurrentDirectory(currentPath);
    }
  }, [isOpen, currentPath]);

  const handleFolderClick = (folderPath: string) => {
    if (folderPath === '..') {
      // Go up one level
      const parentPath = currentFolderPath.split('/').slice(0, -1).join('/');
      setCurrentFolderPath(parentPath);
      loadCurrentDirectory(parentPath);
    } else {
      // Enter folder
      const newPath = currentFolderPath ? `${currentFolderPath}/${folderPath}` : folderPath;
      setCurrentFolderPath(newPath);
      loadCurrentDirectory(newPath);
    }
  };

  const handleSelectCurrentFolder = () => {
    onSelectFolder(currentFolderPath);
    onClose();
  };

  const handleSelectRoot = () => {
    onSelectFolder('');
    onClose();
  };

  const getCurrentPathDisplay = () => {
    return currentFolderPath || 'Root';
  };

  const getBreadcrumbs = () => {
    if (!currentFolderPath) return ['Root'];
    return ['Root', ...currentFolderPath.split('/')];
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        width: '500px',
        maxHeight: '600px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Select Folder</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Breadcrumbs */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#f8f8f8',
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            Current location:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
            {getBreadcrumbs().map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span style={{ color: '#ccc' }}>/</span>}
                <button
                  onClick={() => {
                    if (index === 0) {
                      setCurrentFolderPath('');
                      loadCurrentDirectory('');
                    } else {
                      const path = getBreadcrumbs().slice(1, index + 1).join('/');
                      setCurrentFolderPath(path);
                      loadCurrentDirectory(path);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0078d4',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    fontSize: '12px',
                    textDecoration: 'underline',
                  }}
                >
                  {crumb}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          gap: '8px',
        }}>
          <button
            onClick={handleSelectCurrentFolder}
            style={{
              padding: '6px 12px',
              background: '#0078d4',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Select Current Folder
          </button>
          <button
            onClick={handleSelectRoot}
            style={{
              padding: '6px 12px',
              background: '#f0f0f0',
              color: '#333',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Select Root
          </button>
        </div>

        {/* Folder List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 0',
          maxHeight: '300px',
        }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              Loading...
            </div>
          ) : error ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#d32f2f' }}>
              {error}
            </div>
          ) : (
            <div>
              {/* Up Navigation (if not in root) */}
              {currentFolderPath && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 20px',
                    cursor: 'pointer',
                    color: '#333',
                    fontSize: '14px',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                  onClick={() => handleFolderClick('..')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {UpFolderIcon}
                  ..
                </div>
              )}

              {/* Folders */}
              {items.map((item) => (
                <div
                  key={item.filePath}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 20px',
                    cursor: 'pointer',
                    color: '#333',
                    fontSize: '14px',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                  onClick={() => handleFolderClick(item.filePath)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {FolderIcon}
                  {item.filePath}
                </div>
              ))}

              {items.length === 0 && currentFolderPath && (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#666',
                  fontSize: '14px',
                }}>
                  No subfolders found
                </div>
              )}

              {items.length === 0 && !currentFolderPath && (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#666',
                  fontSize: '14px',
                }}>
                  No folders found in root directory
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#f0f0f0',
              color: '#333',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderBrowser; 