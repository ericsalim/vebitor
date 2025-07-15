import React, { useState } from "react";
import "./MenuBar.css";

const MenuBar: React.FC = () => {
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
            {/* Empty for now */}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBar; 