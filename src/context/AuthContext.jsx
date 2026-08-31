import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('medai_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const loginAsPatient = () => {
    const patientUser = { id: 1, role: 'patient', name: 'John Doe (Patient)' };
    setUser(patientUser);
    localStorage.setItem('medai_user', JSON.stringify(patientUser));
  };

  const loginAsDoctor = (customDoctor = null) => {
    const doctorUser = customDoctor || { id: 2, role: 'doctor', name: 'Dr. Jane Smith (Doctor)' };
    setUser(doctorUser);
    localStorage.setItem('medai_user', JSON.stringify(doctorUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('medai_user');
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
