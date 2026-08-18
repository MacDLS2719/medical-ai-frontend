import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const loginAsPatient = () => {
    setUser({ id: 1, role: 'patient', name: 'John Doe (Patient)' });
  };

  const loginAsDoctor = () => {
    setUser({ id: 2, role: 'doctor', name: 'Dr. Jane Smith (Doctor)' });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginAsPatient, loginAsDoctor, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
