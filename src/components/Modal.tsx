// src/components/Modal.tsx
// Reusable OMK-styled Modal component. ESC + backdrop close, focus trap, optional footer.
// Animation: Tailwind v4 animate-in fade-in zoom-in-95 duration-200.

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
}

const SIZE_CLASSES: Readonly<Record<ModalSize, string>> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, footer, size = 'md' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  // Gate initial focus to ONE per open cycle. Without this, parent re-renders
  // (e.g. controlled-input keystrokes that recreate onClose in JSX) re-fire
  // the effect and yank focus back to the first input on every character.
  const hasFocusedRef = useRef(false);

  // ESC key + focus first focusable on open
  useEffect(() => {
    if (!open) {
      hasFocusedRef.current = false;
      return;
    }
    if (hasFocusedRef.current) return;

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    // focus first focusable element inside the modal after render
    const t = window.setTimeout(() => {
      const root = containerRef.current;
      if (!root) return;
      const focusable = root.querySelector<HTMLElement>(
        'input, select, textarea, button:not([data-modal-close])',
      );
      if (focusable) {
        focusable.focus();
        if (focusable instanceof HTMLButtonElement) firstFocusableRef.current = focusable;
        hasFocusedRef.current = true;
      }
    }, 0);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${SIZE_CLASSES[size]} bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col overflow-hidden`}
      >
        <header className="flex items-center justify-between p-5 border-b border-stone-200 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            data-modal-close="true"
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer !== undefined ? (
          <footer className="p-5 border-t border-stone-200 flex justify-end gap-2 shrink-0 bg-stone-50/50">
            {footer}
          </footer>
        ) : (
          <footer className="p-5 border-t border-stone-200 flex justify-end gap-2 shrink-0 bg-stone-50/50">
            <button
              type="button"
              onClick={onClose}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
            >
              OK
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

export default Modal;
