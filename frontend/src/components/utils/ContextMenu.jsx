import React, { useEffect, useRef, useState } from 'react';

const ContextMenu = ({ position, options, onClose }) => {
  const menuRef = useRef(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const timerId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      let newLeft = position.left;
      let newTop = position.top;

      if (position.left + menuRect.width > window.innerWidth) {
        newLeft = window.innerWidth - menuRect.width - 10;
      }
      if (position.top + menuRect.height > window.innerHeight) {
        newTop = window.innerHeight - menuRect.height - 10;
      }
      if (newLeft < 0) {
        newLeft = 10;
      }
      if (newTop < 0) {
        newTop = 10;
      }
      setAdjustedPosition({ top: newTop, left: newLeft });
    }
  }, [position, options]); // Re-calculate if position or options change (options might change menu size)


  return (
    <div
      ref={menuRef}
      style={{
        top: `${adjustedPosition.top}px`,
        left: `${adjustedPosition.left}px`,
        position: 'fixed',
        visibility: menuRef.current ? 'visible' : 'hidden' // Hide until position is calculated
      }}
      className="z-50 bg-white shadow-lg rounded-md p-1 border border-gray-200 min-w-[150px]"
      onClick={(e) => e.stopPropagation()}
    >
      <ul className="divide-y divide-gray-100">
        {options.map((option, index) => (
          <li key={option.label || index}>
            <button
              onClick={() => {
                option.action();
                // onClose(); // It's common for menu items to close the menu after action
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={option.disabled}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;
