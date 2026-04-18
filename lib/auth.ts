import Cookies from 'js-cookie';

export interface Usuario {
  id: string;
  nombre: string;
  username: string;
  rol: 'ADMIN' | 'TECNICO';
}

export function getUsuario(): Usuario | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('sivi_usuario');
  if (!data) return null;
  try { return JSON.parse(data); } catch { return null; }
}

export function setAuth(token: string, usuario: Usuario) {
  Cookies.set('sivi_token', token, { expires: 1 });
  localStorage.setItem('sivi_usuario', JSON.stringify(usuario));
}

export function clearAuth() {
  Cookies.remove('sivi_token');
  localStorage.removeItem('sivi_usuario');
}

export function isAdmin(): boolean {
  return getUsuario()?.rol === 'ADMIN';
}
