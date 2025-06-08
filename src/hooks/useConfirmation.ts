import { useState, useCallback } from 'react';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  itemName?: string;
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
}

export function useConfirmation() {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    isLoading: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirmation = useCallback((
    options: ConfirmationOptions,
    onConfirm: () => Promise<void> | void
  ) => {
    setState({
      ...options,
      isOpen: true,
      isLoading: false,
      onConfirm: async () => {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
          await onConfirm();
          setState(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (error) {
          setState(prev => ({ ...prev, isLoading: false }));
          throw error;
        }
      }
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    if (!state.isLoading) {
      setState(prev => ({ ...prev, isOpen: false }));
    }
  }, [state.isLoading]);

  return {
    confirmationState: state,
    showConfirmation,
    hideConfirmation
  };
}