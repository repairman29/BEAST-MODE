"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  plan?: 'free' | 'developer' | 'team' | 'enterprise';
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isFirstTime: boolean;
  setUser: (user: User | null) => void;
  signOut: () => void;
  completeOnboarding: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    // Check for existing user session
    const token = localStorage.getItem('beastModeToken');
    const storedUser = localStorage.getItem('beastModeUser');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserState(parsedUser);
      } catch (e) {
        // Invalid stored user, clear it
        localStorage.removeItem('beastModeUser');
        localStorage.removeItem('beastModeToken');
      }
    }

    // Check if this is first time user
    const hasCompletedOnboarding = localStorage.getItem('beastModeOnboardingCompleted');
    const hasVisitedBefore = localStorage.getItem('beastModeHasVisited');
    
    if (!hasVisitedBefore) {
      setIsFirstTime(true);
      localStorage.setItem('beastModeHasVisited', 'true');
    } else if (!hasCompletedOnboarding) {
      setIsFirstTime(true);
    }

    setIsLoading(false);
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('beastModeUser', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('beastModeUser');
      localStorage.removeItem('beastModeToken');
    }
  };

  const signOut = () => {
    setUserState(null);
    localStorage.removeItem('beastModeUser');
    localStorage.removeItem('beastModeToken');
  };

  const completeOnboarding = () => {
    setIsFirstTime(false);
    localStorage.setItem('beastModeOnboardingCompleted', 'true');
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isFirstTime,
        setUser,
        signOut,
        completeOnboarding
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

