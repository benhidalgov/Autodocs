import React, { createContext, useContext, useState, useEffect } from 'react';
import { UsuarioDTO, LoginPayload, RolUsuario } from '@shared/types';
import { login as apiLogin, fetchPerfil, getAuthToken, removeAuthToken } from '../services/api';

interface AuthContextType {
  usuario: UsuarioDTO | null;
  token: string | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  isStaff: boolean;
  isAdmin: boolean;
  isSoporte: boolean;
  isSolicitante: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<UsuarioDTO | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const perfil = await fetchPerfil();
        setUsuario(perfil);
      } catch (err) {
        console.warn('[AUTH] Sesion expirada o invalida:', err);
        removeAuthToken();
        setToken(null);
        setUsuario(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await apiLogin(payload);
      setToken(res.token);
      setUsuario(res.usuario);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUsuario(null);
  };

  const rol: RolUsuario | undefined = usuario?.rol;
  const isStaff = rol === 'AGENTE_SOPORTE' || rol === 'SUPERVISOR_ADMIN';
  const isAdmin = rol === 'SUPERVISOR_ADMIN';
  const isSoporte = rol === 'AGENTE_SOPORTE';
  const isSolicitante = rol === 'SOLICITANTE';

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        isLoading,
        login,
        logout,
        isStaff,
        isAdmin,
        isSoporte,
        isSolicitante
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
