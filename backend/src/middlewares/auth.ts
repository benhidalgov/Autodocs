import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RolUsuario } from '../../../shared/types';

export const JWT_SECRET = process.env.JWT_SECRET || 'SECRET_KEY_DEV_SISTEMA_TICKETS_2026';

export interface UsuarioTokenPayload {
  id: number;
  rut: string;
  nombre: string;
  email: string;
  departamento: string;
  rol: RolUsuario;
}

export interface AuthRequest extends Request {
  usuario?: UsuarioTokenPayload;
}

export function autenticarToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: '[ERROR] Token de autorizacion no provisto o invalido' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as UsuarioTokenPayload;
    req.usuario = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: '[ERROR] Sesion expirada o token invalido' });
  }
}

export function autorizarRoles(...rolesPermitidos: RolUsuario[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return res.status(401).json({ error: '[ERROR] Usuario no autenticado' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: `[DENEGADO] Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`
      });
    }

    next();
  };
}
