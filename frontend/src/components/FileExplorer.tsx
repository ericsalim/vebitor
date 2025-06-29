import React, { useEffect, useState } from 'react';
import { documentsApi, Document } from '../api/documents';

interface FileExplorerProps {
  onFileSelect: (filePath: string) => void;
  selectedFile?: string;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect, selectedFile }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await documentsApi.listDocuments();
      setDocuments(docs || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      setError('Failed to load documents. Make sure the backend is running.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;

    const filePath = newFileName.trim();
    
    try {
      await documentsApi.createDocument({
        filePath,
        content: '// New file\n',
      });
      setNewFileName('');
      loadDocuments(); // Refresh the list
    } catch (error) {
      console.error('Failed to create file:', error);
      setError('Failed to create file. Make sure the backend is running.');
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    if (!window.confirm(`Are you sure you want to delete ${filePath}?`)) return;

    try {
      await documentsApi.deleteDocument(filePath);
      loadDocuments(); // Refresh the list
      if (selectedFile === filePath) {
        onFileSelect(''); // Clear selection if deleted file was selected
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      setError('Failed to delete file. Make sure the backend is running.');
    }
  };

  return (
    <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px' }}>
      <h3>Files</h3>
      
      {error && (
        <div style={{ 
          color: 'red', 
          fontSize: '12px', 
          marginBottom: '10px',
          padding: '5px',
          backgroundColor: '#ffe6e6',
          borderRadius: '3px'
        }}>
          {error}
        </div>
      )}
      
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          placeholder="Enter filename (e.g., test.txt, script.js)"
          style={{ width: '100%', marginBottom: '5px' }}
        />
        <button onClick={handleCreateFile} style={{ width: '100%' }}>
          Create File
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {documents.length === 0 ? (
            <div>No files found</div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.filePath}
                style={{
                  padding: '5px',
                  cursor: 'pointer',
                  backgroundColor: selectedFile === doc.filePath ? '#e0e0e0' : 'transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  onClick={() => onFileSelect(doc.filePath)}
                  style={{ flex: 1 }}
                >
                  {doc.filePath}
                </span>
                <button
                  onClick={() => handleDeleteFile(doc.filePath)}
                  style={{ marginLeft: '5px', padding: '2px 5px' }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FileExplorer; 