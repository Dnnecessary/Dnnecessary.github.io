import React from 'react';

interface ToolbarBtnProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

const ToolbarBtn: React.FC<ToolbarBtnProps> = ({ active, onClick, title, children }) => (
  <button
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`flex items-center justify-center w-7 h-7 rounded transition-colors text-sm flex-shrink-0 ${
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    }`}
  >
    {children}
  </button>
);

export default ToolbarBtn;
