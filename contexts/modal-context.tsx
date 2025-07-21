'use client';

import { createContext, useState, ReactNode, ComponentType } from 'react';

interface ModalState {
  component: ComponentType<any> | null;
  props: Record<string, any>;
}

interface ModalContextType {
  openModal: <T extends {}>(component: ComponentType<T>, props?: T) => void;
  closeModal: () => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [modal, setModal] = useState<ModalState>({ component: null, props: {} });

  const openModal = <T extends {}>(component: ComponentType<T>, props: T = {} as T) => {
    setModal({ component, props });
  };

  const closeModal = () => {
    setModal({ component: null, props: {} });
  };

  const { component: ModalComponent, props: modalProps } = modal;

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {ModalComponent && <ModalComponent {...modalProps} />}
    </ModalContext.Provider>
  );
};
