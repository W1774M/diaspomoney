import { useState } from "react";

export function useUI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  return {
    isOpen,
    isLoading,
    open,
    close,
    toggle,
    setIsLoading,
  };
}
