import { UserInter } from '@/constants/types';
import React, { createContext, useContext, useState, useEffect } from 'react';
import StorageService from '@/src/services/StorageService';

const EMPTY_USER: UserInter = {
  id: -1,
  is_online: 0,
  last_seen: '',
  name: null,
  phone: '',
  profile_picture: '',
  username: '',
  created_at: 'null',
};

interface AuthContextType {
  user: UserInter;
  setUser: (user: UserInter) => Promise<void>;
  logout: () => Promise<void>;
  /** true while restoring the session from storage on first mount */
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserInter>(EMPTY_USER);
  const [isLoading, setIsLoading] = useState(true);

  // Restore persisted session on mount
  useEffect(() => {
    StorageService.getUser()
      .then((saved) => {
        if (saved) setUserState(saved);
      })
      .catch((e) => console.warn('Failed to restore session:', e))
      .finally(() => setIsLoading(false));
  }, []);

  /** Call after a successful login – persists the user to storage. */
  const setUser = async (newUser: UserInter) => {
    setUserState(newUser);
    if (newUser.id !== -1) {
      await StorageService.saveUser(newUser);
    } else {
      await StorageService.clearUser();
    }
  };

  /** Clears stored user and resets state → routing will redirect to Welcome. */
  const logout = async () => {
    await StorageService.clearUser();
    setUserState(EMPTY_USER);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
