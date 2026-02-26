import { UserInter } from '@/constants/types';
import React, { createContext, useContext, useState, useEffect } from 'react';
import StorageService from '@/src/services/StorageService';

interface AuthContextType {
  user: UserInter;
  setUser: React.Dispatch<React.SetStateAction<UserInter>>;
  hasSeenOnboarding: boolean | null;
  completeOnboarding: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInter>({
    id: -1,
    is_online: 0,
    last_seen: '',
    name: null,
    phone: '',
    profile_picture: '',
    username: '',
    created_at: 'null'
  });

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const isFirstTime = await StorageService.isFirstTimeUser();
      setHasSeenOnboarding(!isFirstTime);
    };
    checkOnboarding();
  }, []);

  const completeOnboarding = async () => {
    await StorageService.markOnboardingComplete();
    setHasSeenOnboarding(true);
  };

  const logout = async () => {
    setUser({
      id: -1,
      is_online: 0,
      last_seen: '',
      name: null,
      phone: '',
      profile_picture: '',
      username: '',
      created_at: 'null'
    });
    // Optional: await StorageService.clearAll(); or something similar
  };

  return (
    <AuthContext.Provider value={{ user, setUser, hasSeenOnboarding, completeOnboarding, logout }}>
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
