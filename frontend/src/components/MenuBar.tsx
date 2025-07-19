import React, { useState } from "react";
import "./MenuBar.css";

interface MenuBarProps {
  onNewFile?: () => void;
  onDeleteFile?: () => void;
  deleteFileDisabled?: boolean;
}

const MenuBar: React.FC<MenuBarProps> = ({ onNewFile, onDeleteFile, deleteFileDisabled }) => {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);

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
    </div>
  );
};

export default MenuBar; 