import React from 'react';

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  progress: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '', ...props }) => (
  <div {...props} className={`w-full bg-stone-100 rounded-full h-2 overflow-hidden ${className}`}>
    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
  </div>
);
