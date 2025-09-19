import { createContext, useContext, useState, type ReactNode } from 'react';
import { SignUpModal } from './sign-up-modal';

type ModalContextType = {
  promptSignUp: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useSignUpPrompter() {
  const ctx = useContext(ModalContext);
  if (!ctx)
    throw Error(
      'useSignUpPrompter must be used inside of SignUpPrompterProvider',
    );
  return ctx;
}

export function SignUpPrompterProvider({ children }: { children: ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <ModalContext.Provider value={{ promptSignUp: () => setModalOpen(true) }}>
      <SignUpModal open={modalOpen} onOpenChange={setModalOpen} />
      {children}
    </ModalContext.Provider>
  );
}
