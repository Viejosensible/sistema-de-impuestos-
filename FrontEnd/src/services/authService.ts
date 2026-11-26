import { type FacturaItem, type TaxConfig, type TaxCalculationResult, DEFAULT_TAX_CONFIG } from './taxCalculator';
import type { DeclaracionGuardada } from '../components/HistorialDeclaraciones';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  documento: string; // CI o NIT
  empresa: string;
  cargo: string;
  tipoCuenta: 'Dependiente' | 'Independiente' | 'Auditor' | 'Administrador';
  passwordHash?: string;
  avatarColor?: string;
  fechaRegistro: string;
}

export interface UserTaxData {
  sueldoBruto: number;
  saldoAnterior: number;
  ufvAnterior?: number;
  ufvActual?: number;
  totalFacturasManual: number;
  usaFacturasDetalladas: boolean;
  facturas: FacturaItem[];
  periodo: string;
  config?: TaxConfig;
}

export interface UserWithTaxSummary {
  usuario: Usuario;
  taxData: UserTaxData;
  taxResult: TaxCalculationResult;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';
const STORAGE_KEY_SESION = 'sistema_impuestos_sesion_activa_v3';
const STORAGE_KEY_TOKEN = 'sistema_impuestos_token_v3';

export const ADMIN_CREDENTIALS = {
  email: 'admin@impuestos.bo',
  password: 'Admin123*',
};

function getToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error HTTP ${res.status}`);
  }
  return data as T;
}

const EMPTY_TAX_DATA = (): UserTaxData => ({
  sueldoBruto: 0,
  saldoAnterior: 0,
  ufvAnterior: 0,
  ufvActual: 0,
  totalFacturasManual: 0,
  usaFacturasDetalladas: false,
  facturas: [],
  periodo: new Date().toISOString().slice(0, 7),
  config: DEFAULT_TAX_CONFIG,
});

export const authService = {
  async login(email: string, password: string): Promise<{ ok: boolean; usuario?: Usuario; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    if (!cleanEmail) return { ok: false, error: 'Por favor ingresa tu correo electrónico.' };
    if (!cleanPass) return { ok: false, error: 'Por favor ingresa tu contraseña.' };

    try {
      const data = await apiRequest<{ ok: boolean; token: string; usuario: Usuario }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
      });
      localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
      localStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(data.usuario));
      return { ok: true, usuario: data.usuario };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Error de conexión con el servidor.' };
    }
  },

  async register(datos: {
    nombre: string;
    email: string;
    password: string;
    documento: string;
    empresa: string;
    cargo: string;
    tipoCuenta?: 'Dependiente' | 'Independiente' | 'Auditor';
  }): Promise<{ ok: boolean; usuario?: Usuario; error?: string }> {
    try {
      const data = await apiRequest<{ ok: boolean; token: string; usuario: Usuario }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(datos),
      });
      localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
      localStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(data.usuario));
      return { ok: true, usuario: data.usuario };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Error al registrar usuario.' };
    }
  },

  getSesionActiva(): Usuario | null {
    try {
      const token = getToken();
      const stored = localStorage.getItem(STORAGE_KEY_SESION);
      if (!token || !stored) return null;
      return JSON.parse(stored) as Usuario;
    } catch {
      return null;
    }
  },

  async refreshSesion(): Promise<Usuario | null> {
    if (!getToken()) return null;
    try {
      const data = await apiRequest<{ ok: boolean; usuario: Usuario }>('/auth/me');
      localStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(data.usuario));
      return data.usuario;
    } catch {
      this.logout();
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY_SESION);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  },

  async getUserTaxData(): Promise<UserTaxData> {
    try {
      const res = await apiRequest<{ ok: boolean; data: UserTaxData }>('/tributario/datos');
      return res.data || EMPTY_TAX_DATA();
    } catch {
      return EMPTY_TAX_DATA();
    }
  },

  async saveUserTaxData(data: UserTaxData): Promise<void> {
    try {
      await apiRequest('/tributario/datos', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('Error guardando datos del usuario en MySQL', e);
    }
  },

  async getUserHistorial(): Promise<DeclaracionGuardada[]> {
    try {
      const res = await apiRequest<{ ok: boolean; historial: DeclaracionGuardada[] }>('/declaraciones');
      return Array.isArray(res.historial) ? res.historial : [];
    } catch {
      return [];
    }
  },

  async saveDeclaracion(declaracion: DeclaracionGuardada): Promise<void> {
    await apiRequest('/declaraciones', {
      method: 'POST',
      body: JSON.stringify(declaracion),
    });
  },

  async importDeclaraciones(declaraciones: DeclaracionGuardada[]): Promise<void> {
    await apiRequest('/declaraciones/import', {
      method: 'POST',
      body: JSON.stringify({ declaraciones }),
    });
  },

  async deleteDeclaracion(id: string): Promise<void> {
    await apiRequest(`/declaraciones/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async clearHistorial(): Promise<void> {
    await apiRequest('/declaraciones', {
      method: 'DELETE',
    });
  },

  async updatePerfil(userId: string, updates: Partial<Usuario>): Promise<Usuario | null> {
    try {
      const res = await apiRequest<{ ok: boolean; usuario: Usuario }>(`/usuarios/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      localStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(res.usuario));
      return res.usuario;
    } catch (e) {
      console.warn('Error actualizando perfil', e);
      return null;
    }
  },

  async getMatrizTributariaGlobal(): Promise<UserWithTaxSummary[]> {
    const res = await apiRequest<{ ok: boolean; matriz: UserWithTaxSummary[] }>('/admin/matriz');
    return res.matriz || [];
  },

  async eliminarContribuyente(userId: string): Promise<boolean> {
    if (userId === 'user-admin') return false;
    await apiRequest(`/admin/usuarios/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    return true;
  },

  async getNormativaGlobal(): Promise<TaxConfig> {
    try {
      const res = await apiRequest<{ ok: boolean; config: TaxConfig }>('/normativa');
      return res.config || DEFAULT_TAX_CONFIG;
    } catch {
      return DEFAULT_TAX_CONFIG;
    }
  },

  async saveNormativaGlobal(config: TaxConfig): Promise<void> {
    await apiRequest('/normativa', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  },
};
