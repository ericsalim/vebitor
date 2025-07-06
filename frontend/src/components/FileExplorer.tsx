import React, { useEffect, useState, useMemo } from 'react';
import { documentsApi, DocumentMetadata, Document } from '../api/documents';
import {
  UncontrolledTreeEnvironment,
  Tree,
  StaticTreeDataProvider,
  TreeItemIndex,
  TreeItem,
} from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';

interface FileExplorerProps {
  onFileSelect: (filePath: string) => void;
  selectedFile?: string;
}

// SVG icons
const FolderIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 4 }}>
    <path d="M1.5 4A1.5 1.5 0 013 2.5h3.38a1.5 1.5 0 011.06.44l.62.62A1.5 1.5 0 008.12 4H13a1.5 1.5 0 011.5 1.5v6A1.5 1.5 0 0113 13H3A1.5 1.5 0 011.5 11.5v-7.5z" fill="#c9ae5d" stroke="#b59b3a"/>
  </svg>
);
const FileIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 4 }}>
    <rect x="3" y="2" width="10" height="12" rx="2" fill="#90caf9" stroke="#1976d2"/>
    <rect x="5" y="5" width="6" height="1" fill="#1976d2"/>
    <rect x="5" y="7" width="6" height="1" fill="#1976d2"/>
    <rect x="5" y="9" width="4" height="1" fill="#1976d2"/>
  </svg>
);

// Helper to build tree data from flat documents list
function buildTreeFromDocuments(documents: DocumentMetadata[], folderContents: Map<string, DocumentMetadata[]>, expandedFolders: Set<string>) {
  console.log('buildTreeFromDocuments called with:', documents);
  const rootId = 'root';
  const items: Record<TreeItemIndex, TreeItem> = {
    [rootId]: {
      index: rootId,
      data: { title: 'Root', isFolder: true, path: '' },
      children: [],
      isFolder: true,
    },
  };

  // Group documents by their path segments
  const pathMap = new Map<string, string[]>();
  
  // Add root level documents
  for (const doc of documents) {
    console.log('Processing document:', doc.filePath);
    const parts = doc.filePath.split('/');
    let currentPath = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? currentPath + '/' + part : part;
      
      if (!pathMap.has(currentPath)) {
        pathMap.set(currentPath, []);
      }
      
      if (parentPath && pathMap.has(parentPath)) {
        if (!pathMap.get(parentPath)!.includes(currentPath)) {
          pathMap.get(parentPath)!.push(currentPath);
        }
      }
    }
  }

  // Add contents from expanded folders
  folderContents.forEach((contents, folderPath) => {
    if (expandedFolders.has(folderPath)) {
      console.log('Processing expanded folder:', folderPath, 'with contents:', contents);
      for (const doc of contents) {
        // Normalize path separators to forward slashes
        const normalizedPath = doc.filePath.replace(/\\/g, '/');
        console.log('Normalized path:', normalizedPath);
        
        if (!pathMap.has(folderPath)) {
          pathMap.set(folderPath, []);
        }
        if (!pathMap.get(folderPath)!.includes(normalizedPath)) {
          pathMap.get(folderPath)!.push(normalizedPath);
        }
        
        // Also add the full path to the pathMap so it can be rendered
        if (!pathMap.has(normalizedPath)) {
          pathMap.set(normalizedPath, []);
        }
      }
    }
  });

  console.log('Path map:', pathMap);

  // Build tree items
  pathMap.forEach((children, path) => {
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    
    // Check if this is a root document
    const matchingDoc = documents.find(d => d.filePath === path);
    
    // Check if this is a folder content item
    const allFolderContents: DocumentMetadata[] = [];
    folderContents.forEach(contents => {
      allFolderContents.push(...contents);
    });
    
    const folderContentItem = allFolderContents.find(doc => {
      const normalizedDocPath = doc.filePath.replace(/\\/g, '/');
      return normalizedDocPath === path;
    });
    const isFolderContent = !!folderContentItem;
    
    let isFolder = false;
    if (matchingDoc) {
      isFolder = matchingDoc.isFolder;
    } else if (isFolderContent && folderContentItem) {
      isFolder = folderContentItem.isFolder;
    } else {
      // Fallback: check if it has children
      isFolder = children.length > 0;
    }
    
    items[path] = {
      index: path,
      data: { title: name, isFolder: isFolder, path },
      children: children.length > 0 ? children : [],
      isFolder: isFolder,
    };
  });

  // Set root children
  const rootChildren: string[] = [];
  pathMap.forEach((children, path) => {
    // If this path has no parent (i.e., it's a top-level item), add it to root
    if (!path.includes('/')) {
      rootChildren.push(path);
    }
  });
  items[rootId].children = rootChildren;
  
  console.log('Final tree items:', items);
  console.log('Root children:', items[rootId].children);
  console.log('my_data children:', items['my_data']?.children);
  console.log('Complete tree structure:');
  Object.entries(items).forEach(([path, item]) => {
    console.log(`  ${path}:`, {
      title: item.data.title,
      isFolder: item.isFolder,
      children: item.children
    });
  });

  return { rootId, items };
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect, selectedFile }) => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderContents, setFolderContents] = useState<Map<string, DocumentMetadata[]>>(new Map());
  const [dataVersion, setDataVersion] = useState(0);

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

  const loadFolderContents = async (folderPath: string) => {
    if (folderContents.has(folderPath)) return; // Already loaded
    
    try {
      const contents = await documentsApi.listDocuments(folderPath);
      setFolderContents(prev => new Map(prev).set(folderPath, contents));
      setDataVersion(prev => prev + 1); // Force re-render
    } catch (error) {
      console.error('Failed to load folder contents:', error);
      setFolderContents(prev => new Map(prev).set(folderPath, []));
      setDataVersion(prev => prev + 1); // Force re-render
    }
  };

  const handleFolderExpand = async (folderPath: string) => {
    setExpandedFolders(prev => new Set(prev).add(folderPath));
    await loadFolderContents(folderPath);
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    const filePath = newFileName.trim();
    try {
      await documentsApi.createDocument({
        filePath,
        content: '// New file\n',
        isFolder: false,
      });
      setNewFileName('');
      loadDocuments();
    } catch (error) {
      console.error('Failed to create file:', error);
      setError('Failed to create file. Make sure the backend is running.');
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    if (!window.confirm(`Are you sure you want to delete ${filePath}?`)) return;
    try {
      await documentsApi.deleteDocument(filePath);
      loadDocuments();
      if (selectedFile === filePath) {
        onFileSelect('');
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      setError('Failed to delete file. Make sure the backend is running.');
    }
  };

  // Build tree data
  const { rootId, items } = useMemo(() => buildTreeFromDocuments(documents, folderContents, expandedFolders), [documents, folderContents, expandedFolders]);

  // Data provider
  const dataProvider = useMemo(
    () => new StaticTreeDataProvider(items, (item, data) => ({ 
      ...item, 
      data: data && typeof data === 'object' ? Object.assign({}, item.data, data) : { ...item.data } 
    })),
    [items]
  );

  // Custom render for tree items
  const renderItem = ({ item, depth }: any) => {
    const isFile = !item.isFolder;
    const isSelected = selectedFile === item.data.path;
    const label = item.data.title;
    
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: isSelected ? '#e0e0e0' : 'transparent',
          fontWeight: item.isFolder ? 'bold' : 'normal',
          color: item.isFolder ? '#b59b3a' : '#222',
          cursor: isFile ? 'pointer' : 'default',
          paddingLeft: 4 + depth * 16,
        }}
        onClick={() => {
          if (isFile) {
            onFileSelect(item.data.path);
          }
        }}
      >
        {item.isFolder ? FolderIcon : FileIcon}
        {label}
        {isFile && (
          <span
            onClick={e => {
              e.stopPropagation();
              handleDeleteFile(item.data.path);
            }}
            style={{ 
              marginLeft: 8, 
              padding: '2px 5px',
              cursor: 'pointer',
              color: '#999',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            title="Delete file"
          >
            ×
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px', height: '100%', overflow: 'auto' }}>
      <h3>Vebitor</h3>
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
      {loading ? (
        <div>Loading...</div>
      ) : (
        <UncontrolledTreeEnvironment
          key={dataVersion}
          dataProvider={dataProvider}
          getItemTitle={item => item.data.title}
          viewState={{}}
          canDragAndDrop={false}
          canDropOnFolder={false}
          canReorderItems={false}
          onExpandItem={item => {
            if (item.isFolder && !expandedFolders.has(item.data.path)) {
              handleFolderExpand(item.data.path);
            }
          }}
        >
          <Tree
            treeId="file-explorer-tree"
            rootItem={rootId}
            treeLabel="File Explorer"
            renderItemTitle={renderItem}
            aria-label="File Explorer"
          />
        </UncontrolledTreeEnvironment>
      )}
    </div>
  );
};

export default FileExplorer; 