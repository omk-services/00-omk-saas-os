// src/hooks/useModal.ts
// Tiny state hook for modal open/close. Reduces boilerplate in views.

import { useCallback, useState } from 'react';

export function useModal(initial = false): [boolean, () => void, () => void] {
  const [isOpen, setIsOpen] = useState<boolean>(initial);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return [isOpen, open, close];
}
