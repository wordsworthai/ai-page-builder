import {
  createContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
  FC,
  useContext,
} from "react";

export type SnackBarType = {
  content: ReactNode;
  autoHide?: boolean;
  /** Duration in ms before auto-hiding. Default 3000. Use longer (e.g. 8000) for error messages. */
  autoHideDuration?: number;
  severity?: "success" | "error" | "warning" | "info";
};

export type SnackBarContextType = {
  snackBar: SnackBarType | undefined;
  isOpen?: boolean;
  createSnackBar: (snackbar: SnackBarType) => void;
  closeSnackBar?: () => void;
};

export const SnackBarContext = createContext<SnackBarContextType | undefined>(
  undefined
);

export const useSnackBarContext = (): SnackBarContextType => {
  const context = useContext(SnackBarContext);

  if (context === undefined) {
    throw new Error(
      "useSnackBarContext must be used within a SnackBarProvider"
    );
  }

  return context;
};

export const SnackBarProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [snackBar, setSnackBar] = useState<SnackBarType | undefined>(undefined);
  const timeout = useRef(0);
  const createSnackBar = useCallback((snackbar: SnackBarType) => {
    setSnackBar(snackbar);
    setIsOpen(true);
  }, []);

  const closeSnackBar = useCallback(() => {
    setSnackBar(undefined);
    setIsOpen(false);
  }, []);

  const context = useMemo(
    () => ({
      isOpen,
      snackBar,
      createSnackBar,
      closeSnackBar,
    }),
    [isOpen, snackBar, createSnackBar, closeSnackBar]
  );

  useEffect(() => {
    if (snackBar && snackBar.autoHide) {
      const duration = snackBar.autoHideDuration ?? 3000;
      const id = window.setTimeout(() => {
        setIsOpen(false);
        setSnackBar(undefined);
      }, duration);
      return () => window.clearTimeout(id);
    }
  }, [snackBar]);

  return (
    <SnackBarContext.Provider value={context}>
      {children}
    </SnackBarContext.Provider>
  );
};
