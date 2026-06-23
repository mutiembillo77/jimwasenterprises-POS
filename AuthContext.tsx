import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: string;
  username: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const raw = localStorage.getItem("jimwas-user");
        if (raw) setUser(JSON.parse(raw));
      } catch (error) {
        console.error("Auth initialization failed:", error);
        localStorage.removeItem("jimwas-user");
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const login = (nextUser: User) => {
    setUser(nextUser);
    localStorage.setItem("jimwas-user", JSON.stringify(nextUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("jimwas-user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
