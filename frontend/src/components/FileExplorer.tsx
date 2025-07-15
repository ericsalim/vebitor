import React, { useEffect, useState } from 'react';
import { documentsApi, DocumentMetadata } from '../api/documents';

interface FileExplorerProps {
  onFileSelect: (filePath: string) => void;
  selectedFile?: string;
  onFolderChange?: (folderPath: string) => void;
  onFileRename?: (oldPath: string, newPath: string) => void;
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

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect, selectedFile, onFolderChange, onFileRename }) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const listRef = React.useRef<HTMLDivElement>(null);

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
      loadCurrentDirectory(currentPath);
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
          {items.map((item) => {
            const fullPath = currentPath ? `${currentPath}/${item.filePath}` : item.filePath;
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
            );
          })}

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