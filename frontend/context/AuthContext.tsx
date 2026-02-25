import { UserInter } from '@/constants/types';
import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: UserInter;
  setUser: React.Dispatch<React.SetStateAction<UserInter>>;
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

  return (
    <AuthContext.Provider value={{ user, setUser }}>
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
