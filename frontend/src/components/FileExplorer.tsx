import React, { useEffect, useState } from 'react';
import { documentsApi, DocumentMetadata } from '../api/documents';

interface FileExplorerProps {
  onFileSelect: (filePath: string) => void;
  selectedFile?: string;
  onFolderChange?: (folderPath: string) => void;
  onUserFolderChange?: (folderPath: string) => void;
  onFileRename?: (oldPath: string, newPath: string) => void;
  currentFolder?: string;
  refreshSignal?: number;
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

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect, selectedFile, onFolderChange, onUserFolderChange, onFileRename, currentFolder, refreshSignal }) => {
  const [items, setItems] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const listRef = React.useRef<HTMLDivElement>(null);

  // Load directory and notify parent whenever currentFolder changes
  useEffect(() => {
    loadCurrentDirectory(currentFolder || '');
    if (onFolderChange) {
      onFolderChange(currentFolder || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolder]);

  // Reload directory when refreshSignal changes
  useEffect(() => {
    loadCurrentDirectory(currentFolder || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  const loadCurrentDirectory = async (path: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const docs = await documentsApi.listDocuments(path);
      if (!docs) {
        // If docs is null, folder does not exist. Switch to root.
        if (onUserFolderChange) onUserFolderChange('');
        if (onFolderChange) onFolderChange('');
        setItems([]);
        setLoading(false);
        return;
      }
      setItems(docs || []);
    } catch (error: any) {
      // Handle folder_not_found error from backend
      if (error instanceof Response && error.status === 404) {
        try {
          const data = await error.json();
          if (data && data.code === 'folder_not_found') {
            if (onUserFolderChange) onUserFolderChange('');
            if (onFolderChange) onFolderChange('');
            setItems([]);
            setLoading(false);
            return;
          }
        } catch {}
      }
      // If error, also switch to root
      if (onUserFolderChange) onUserFolderChange('');
      if (onFolderChange) onFolderChange('');
      setError('Failed to load directory. Make sure the backend is running.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle F2 for renaming
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2" && selectedFile && !renamingFile) {
        setRenamingFile(selectedFile);
        const name = selectedFile.split("/").pop() || selectedFile;
        setRenameValue(name);
      }
      if (e.key === "Escape" && renamingFile) {
        setRenamingFile(null);
        setRenameValue("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFile, renamingFile]);

  // Handle rename submit
  const handleRenameSubmit = async (oldPath: string, newName: string) => {
    if (!newName.trim() || oldPath.split("/").pop() === newName.trim()) {
      setRenamingFile(null);
      setRenameValue("");
      return;
    }
    const parent = oldPath.split("/").slice(0, -1).join("/");
    const newPath = parent ? `${parent}/${newName.trim()}` : newName.trim();
    try {
      await documentsApi.renameDocument(oldPath, newPath);
      setRenamingFile(null);
      setRenameValue("");
      loadCurrentDirectory(currentFolder || '');
      if (selectedFile === oldPath) {
        onFileSelect(newPath);
      }
      if (onFileRename) {
        onFileRename(oldPath, newPath);
      }
    } catch (error: any) {
      if (error instanceof Response) {
        // Try to parse error response
        try {
          const data = await error.json();
          if (data && data.code === "file_exists") {
            setError("Failed to rename file. Error code: file_exists");
            return;
          }
        } catch {}
      }
      setError("Failed to rename file. Make sure the backend is running.");
    }
  };

  // For navigation, use a helper to update the parent (App) with the new folder
  const handleFolderClick = (folderPath: string) => {
    let newPath = '';
    if (folderPath === '..') {
      // Go up one level
      newPath = (currentFolder || '').split('/').slice(0, -1).join('/');
    } else {
      // Enter folder
      newPath = currentFolder ? `${currentFolder}/${folderPath}` : folderPath;
    }
    if (onUserFolderChange) {
      onUserFolderChange(newPath);
    }
    if (onFolderChange) {
      onFolderChange(newPath);
    }
  };

  const handleFileClick = (filePath: string) => {
    const fullPath = currentFolder ? `${currentFolder}/${filePath}` : filePath;
    onFileSelect(fullPath);
  };

  const handleDeleteItem = async (itemPath: string) => {
    const fullPath = currentFolder ? `${currentFolder}/${itemPath}` : itemPath;
    if (!window.confirm(`Are you sure you want to delete ${fullPath}?`)) return;
    try {
      await documentsApi.deleteDocument(fullPath);
      loadCurrentDirectory(currentFolder || '');
      if (selectedFile === fullPath) {
        onFileSelect('');
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      setError('Failed to delete item. Make sure the backend is running.');
    }
  };

  // Update all other references to currentPath to use currentFolder
  const getCurrentPathDisplay = () => {
    return currentFolder || 'Root';
  };

  // Sort items: folders first (by name), then files (by name)
  const sortedItems = [...items].sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.filePath.localeCompare(b.filePath, undefined, { sensitivity: 'base' });
  });

  return (
    <div
      style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px', height: '100%', overflow: 'auto' }}
      ref={listRef}
    >
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

      {/* Navigation and File List */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {/* Up Navigation (if not in root) */}
          {currentFolder && (
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
          {sortedItems.map((item) => {
            const fullPath = currentFolder ? `${currentFolder}/${item.filePath}` : item.filePath;
            const isRenaming = renamingFile === fullPath;
            return (
              <div
                key={item.filePath}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  cursor: item.isFolder ? 'pointer' : 'pointer',
                  background: selectedFile === fullPath ? '#e0e0e0' : 'transparent',
                  fontWeight: 'normal',
                  color: '#222',
                  fontSize: '14px',
                  borderRadius: '3px',
                  marginBottom: '2px'
                }}
                onClick={() => item.isFolder ? handleFolderClick(item.filePath) : handleFileClick(item.filePath)}
              >
                <span style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  {item.isFolder ? FolderIcon : FileIcon}
                  {isRenaming ? (
                    <input
                      type="text"
                      value={renameValue}
                      autoFocus
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => setRenamingFile(null)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleRenameSubmit(fullPath, renameValue);
                        } else if (e.key === 'Escape') {
                          setRenamingFile(null);
                        }
                      }}
                      style={{ fontSize: '14px', flex: 1 }}
                    />
                  ) : (
                    <span>{item.filePath}</span>
                  )}
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteItem(item.filePath);
                  }}
                  style={{ marginLeft: 8 }}
                >
                  Delete
                </button>
              </div>
            );
          })}

          {items.length === 0 && !currentFolder && (
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