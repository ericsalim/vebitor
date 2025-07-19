import React, { useState } from "react";
import "./MenuBar.css";

interface MenuBarProps {
  onNewFile?: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({ onNewFile }) => {
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
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBar; 