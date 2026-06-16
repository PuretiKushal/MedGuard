import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("medguard_user");
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const loginUser = (userData, token) => {
    localStorage.setItem("medguard_token", token);
    localStorage.setItem("medguard_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("medguard_token");
    localStorage.removeItem("medguard_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
