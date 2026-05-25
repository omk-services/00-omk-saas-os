import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div {...props} className={`bg-white rounded-xl border border-stone-200 shadow-sm ${className}`}>
    {children}
  </div>
);
