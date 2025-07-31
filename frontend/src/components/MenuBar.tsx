import React, { useState } from "react";
import "./MenuBar.css";

interface MenuBarProps {
  onNewFile?: () => void;
  onSaveFile?: () => void;
  onDeleteFile?: () => void;
  onSearch?: () => void;
  saveFileDisabled?: boolean;
  deleteFileDisabled?: boolean;
}

const MenuBar: React.FC<MenuBarProps> = ({ onNewFile, onSaveFile, onDeleteFile, onSearch, saveFileDisabled, deleteFileDisabled }) => {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [searchMenuOpen, setSearchMenuOpen] = useState(false);

  return (
    <div className="menu-bar">
      <div
        className="menu-item"
        onMouseEnter={() => setFileMenuOpen(true)}
        onMouseLeave={() => setFileMenuOpen(false)}
      >
        File
        {fileMenuOpen && (
          <div className="menu-dropdown">
            <div
              className="menu-dropdown-item"
              onClick={() => {
                setFileMenuOpen(false);
                if (onNewFile) onNewFile();
              }}
            >
              New File
            </div>
            <div
              className={`menu-dropdown-item${saveFileDisabled ? ' disabled' : ''}`}
              onClick={() => {
                if (!saveFileDisabled && onSaveFile) {
                  setFileMenuOpen(false);
                  onSaveFile();
                }
              }}
              style={{ color: saveFileDisabled ? '#aaa' : undefined, cursor: saveFileDisabled ? 'not-allowed' : 'pointer' }}
            >
              Save File
            </div>
            <div
              className={`menu-dropdown-item${deleteFileDisabled ? ' disabled' : ''}`}
              onClick={() => {
                if (!deleteFileDisabled && onDeleteFile) {
                  setFileMenuOpen(false);
                  onDeleteFile();
                }
              }}
              style={{ color: deleteFileDisabled ? '#aaa' : undefined, cursor: deleteFileDisabled ? 'not-allowed' : 'pointer' }}
            >
              Delete File
            </div>
          </div>
        )}
      </div>
      <div
        className="menu-item"
        onMouseEnter={() => setSearchMenuOpen(true)}
        onMouseLeave={() => setSearchMenuOpen(false)}
      >
        Search
        {searchMenuOpen && (
          <div className="menu-dropdown">
            <div
              className="menu-dropdown-item"
              onClick={() => {
                setSearchMenuOpen(false);
                if (onSearch) onSearch();
              }}
            >
              Search in Files
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBar; 