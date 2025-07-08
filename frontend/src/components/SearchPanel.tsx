import React, { useState } from 'react';
import { documentsApi, SearchResult, SearchRequest } from '../api/documents';
import './SearchPanel.css';

interface SearchPanelProps {
  currentFolder: string;
  onOpenFile: (filePath: string) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ currentFolder, onOpenFile }) => {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'plain' | 'regex'>('plain');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [searchFolder, setSearchFolder] = useState(currentFolder);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setError('');
    setResults([]);

    try {
      const searchRequest: SearchRequest = {
        query: query.trim(),
        searchMode,
        caseSensitive,
        searchFolder,
      };

      const searchResults = await documentsApi.searchDocuments(searchRequest);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const highlightMatch = (lineText: string, startPos: number, endPos: number) => {
    const before = lineText.substring(0, startPos);
    const match = lineText.substring(startPos, endPos);
    const after = lineText.substring(endPos);
    
    return (
      <>
        <span className="search-line-before">{before}</span>
        <span className="search-line-match">{match}</span>
        <span className="search-line-after">{after}</span>
      </>
    );
  };

  const totalMatches = results.reduce((sum, result) => sum + result.matches.length, 0);

  return (
    <div className="search-panel">
      <div className="search-header">
        <h3>Search Files</h3>
      </div>
      
      <div className="search-controls">
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter search query..."
            className="search-input"
          />
          <button 
            onClick={handleSearch} 
            disabled={isSearching || !query.trim()}
            className="search-button"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="search-options">
          <div className="search-mode">
            <label>
              <input
                type="radio"
                value="plain"
                checked={searchMode === 'plain'}
                onChange={(e) => setSearchMode(e.target.value as 'plain' | 'regex')}
              />
              Plain Text
            </label>
            <label>
              <input
                type="radio"
                value="regex"
                checked={searchMode === 'regex'}
                onChange={(e) => setSearchMode(e.target.value as 'plain' | 'regex')}
              />
              Regular Expression
            </label>
          </div>

          <div className="search-options-row">
            <label className="case-sensitive">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              Case Sensitive
            </label>

            <div className="search-folder">
              <label>Search in folder:</label>
              <input
                type="text"
                value={searchFolder}
                onChange={(e) => setSearchFolder(e.target.value)}
                placeholder="Leave empty for root"
                className="folder-input"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="search-error">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          <div className="search-summary">
            Found {totalMatches} match{totalMatches !== 1 ? 'es' : ''} in {results.length} file{results.length !== 1 ? 's' : ''}
          </div>
          
          {results.map((result, resultIndex) => (
            <div key={resultIndex} className="search-result-file">
              <div className="file-header" onClick={() => onOpenFile(result.filePath)}>
                <span className="file-icon">📄</span>
                <span className="file-path">{result.filePath}</span>
                <span className="match-count">({result.matches.length} match{result.matches.length !== 1 ? 'es' : ''})</span>
              </div>
              
              <div className="file-matches">
                {result.matches.map((match, matchIndex) => (
                  <div key={matchIndex} className="search-match">
                    <div className="match-line-number">{match.lineNumber}</div>
                    <div className="match-line-content">
                      {highlightMatch(match.lineText, match.startPos, match.endPos)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isSearching && results.length === 0 && query && !error && (
        <div className="search-no-results">
          No matches found
        </div>
      )}
    </div>
  );
};

export default SearchPanel; 