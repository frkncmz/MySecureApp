import * as SecureStore from "expo-secure-store";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";

// Inactivity timeout (5 min)
const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  resetInactivityTimer: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundTime = useRef<number | null>(null);
  const isAuthenticatedRef = useRef(isAuthenticated);

  // Sync ref with state
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  }, []);

  const logout = useCallback(async () => {
    clearInactivityTimer();
    await SecureStore.deleteItemAsync("is_logged_in");
    setIsAuthenticated(false);
  }, [clearInactivityTimer]);

  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticatedRef.current) return;
    
    clearInactivityTimer();
    inactivityTimer.current = setTimeout(async () => {
      if (isAuthenticatedRef.current) {
        await SecureStore.deleteItemAsync("is_logged_in");
        setIsAuthenticated(false);
      }
    }, INACTIVITY_TIMEOUT);
  }, [clearInactivityTimer]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!isAuthenticatedRef.current) return;

      if (nextAppState === "background" || nextAppState === "inactive") {
        backgroundTime.current = Date.now();
        clearInactivityTimer();
      } else if (nextAppState === "active") {
        if (backgroundTime.current) {
          const elapsed = Date.now() - backgroundTime.current;
          if (elapsed >= INACTIVITY_TIMEOUT) {
            SecureStore.deleteItemAsync("is_logged_in").then(() => {
              setIsAuthenticated(false);
            });
          } else {
            const remaining = INACTIVITY_TIMEOUT - elapsed;
            clearInactivityTimer();
            inactivityTimer.current = setTimeout(async () => {
              if (isAuthenticatedRef.current) {
                await SecureStore.deleteItemAsync("is_logged_in");
                setIsAuthenticated(false);
              }
            }, remaining);
          }
          backgroundTime.current = null;
        } else {
          resetInactivityTimer();
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [clearInactivityTimer, resetInactivityTimer]);

  // Require fresh auth on app start
  useEffect(() => {
    (async () => {
      await SecureStore.deleteItemAsync("is_logged_in");
      setIsAuthenticated(false);
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      resetInactivityTimer();
    } else {
      clearInactivityTimer();
    }
  }, [isAuthenticated, resetInactivityTimer, clearInactivityTimer]);

  const login = async () => {
    await SecureStore.setItemAsync("is_logged_in", "true");
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, resetInactivityTimer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
