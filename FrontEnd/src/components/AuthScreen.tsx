import React, { useState } from 'react';
import { authService, type Usuario, ADMIN_CREDENTIALS } from '../services/authService';

interface AuthScreenProps {
  onLoginSuccess: (usuario: Usuario) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Estado formulario Login Normal
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Estado formulario Registro
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDocumento, setRegDocumento] = useState('');
  const [regEmpresa, setRegEmpresa] = useState('');
  const [regCargo, setRegCargo] = useState('');
  const [regTipo, setRegTipo] = useState<'Dependiente' | 'Independiente'>('Dependiente');

  // Mensajes de error y carga
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const res = await authService.login(loginEmail, loginPassword);
    setLoading(false);
    if (res.ok && res.usuario) {
      onLoginSuccess(res.usuario);
    } else {
      setErrorMsg(res.error || 'Credenciales inválidas.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const res = await authService.register({
      nombre: regNombre,
      email: regEmail,
      password: regPassword,
      documento: regDocumento,
      empresa: regEmpresa,
      cargo: regCargo,
      tipoCuenta: regTipo,
    });
    setLoading(false);

    if (res.ok && res.usuario) {
      onLoginSuccess(res.usuario);
    } else {
      setErrorMsg(res.error || 'Error al registrar usuario.');
    }
  };

  const llenarCredencialesAdmin = () => {
    setLoginEmail(ADMIN_CREDENTIALS.email);
    setLoginPassword(ADMIN_CREDENTIALS.password);
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3 p-md-4"
      style={{
        background: 'radial-gradient(ellipse at 15% 20%, #1e3a8a 0%, #0f172a 50%, #020617 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Círculos de luz ambiental decorativos */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ maxWidth: '1060px', position: 'relative', zIndex: 1 }}>
        <div
          className="row g-0 rounded-4 overflow-hidden border shadow-2xl"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* COLUMNA IZQUIERDA: PRESENTACIÓN CORPORATIVA */}
          <div
            className="col-lg-5 p-4 p-md-5 d-flex flex-column justify-content-between text-white"
            style={{
              background: 'linear-gradient(145deg, #1e3a8a 0%, #0f172a 80%, #020617 100%)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div>
              {/* Emblema y Título */}
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="brand-emblem p-3 d-flex align-items-center justify-content-center text-white"
                  style={{ width: 54, height: 54, borderRadius: '14px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 className="fw-bold mb-0 tracking-tight text-white">SIN Tributario</h4>
                  <small style={{ color: '#93c5fd', fontSize: '0.8rem', letterSpacing: '0.02em' }}>
                    Portal Oficial de Liquidación & Control Fiscal
                  </small>
                </div>
              </div>

              <h4 className="fw-bold mb-3 tracking-tight text-white" style={{ lineHeight: 1.3 }}>
                Liquidación de Impuestos sobre Ingresos Laborales
              </h4>
              <p className="small mb-4 text-light text-opacity-75" style={{ lineHeight: 1.6, fontSize: '0.85rem' }}>
                Ingresa con tu correo y contraseña para gestionar tus retenciones mensuales, computar facturas deducibles y generar tu certificado oficial en tiempo real.
              </p>

              {/* Puntos destacados con micro-iconos */}
              <div className="d-flex flex-column gap-3 mb-4">
                <div
                  className="d-flex align-items-center gap-3 p-3 rounded-3"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                >
                  <span className="fs-5">⚖️</span>
                  <div>
                    <strong className="d-block small text-white">Planilla Salarial RC-IVA</strong>
                    <small className="text-light text-opacity-70" style={{ fontSize: '0.75rem' }}>Deducción de 2 SMN, Aportes (12.71%) y Alícuota (13%)</small>
                  </div>
                </div>

                <div
                  className="d-flex align-items-center gap-3 p-3 rounded-3"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                >
                  <span className="fs-5">👑</span>
                  <div>
                    <strong className="d-block small text-white">Consola Central del Administrador</strong>
                    <small className="text-light text-opacity-70" style={{ fontSize: '0.75rem' }}>Auditoría fiscal de todos los contribuyentes</small>
                  </div>
                </div>

                <div
                  className="d-flex align-items-center gap-3 p-3 rounded-3"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                >
                  <span className="fs-5">🔒</span>
                  <div>
                    <strong className="d-block small text-white">Seguridad y Aislamiento de Datos</strong>
                    <small className="text-light text-opacity-70" style={{ fontSize: '0.75rem' }}>Cada sesión conserva su propio sueldo, facturas y saldos</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-top border-white border-opacity-10 text-light text-opacity-50 small d-flex justify-content-between" style={{ fontSize: '0.72rem' }}>
              <span>Codificación UTF-8 pura</span>
              <span>Bolivia 2026</span>
            </div>
          </div>

          {/* COLUMNA DERECHA: FORMULARIO NORMAL DE LOGIN Y REGISTRO */}
          <div className="col-lg-7 p-4 p-md-5 d-flex flex-column justify-content-center bg-white">
            {/* Pestañas de Login / Registro */}
            <div className="d-flex p-1 bg-light rounded-pill mb-4 border" style={{ maxWidth: 320 }}>
              <button
                type="button"
                className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${tab === 'login' ? 'btn-primary shadow-sm text-white' : 'btn-light text-secondary'}`}
                onClick={() => { setTab('login'); setErrorMsg(null); }}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${tab === 'register' ? 'btn-primary shadow-sm text-white' : 'btn-light text-secondary'}`}
                onClick={() => { setTab('register'); setErrorMsg(null); }}
              >
                Crear Cuenta
              </button>
            </div>

            {/* Alerta de Error */}
            {errorMsg && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: FORMULARIO NORMAL DE INICIO DE SESIÓN */}
            {tab === 'login' && (
              <div>
                <h4 className="fw-bold text-dark mb-1 tracking-tight">Iniciar Sesión</h4>
                <p className="text-muted small mb-4">
                  Ingresa con tu correo electrónico y tu contraseña para acceder a tu panel.
                </p>

                <form onSubmit={handleLoginSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Correo Electrónico:</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted border-end-0" style={{ borderRadius: '10px 0 0 10px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                        </svg>
                      </span>
                      <input
                        type="email"
                        className="form-control form-control-pro border-start-0"
                        placeholder="tu-correo@empresa.bo"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        style={{ borderRadius: '0 10px 10px 0' }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-semibold text-dark mb-0">Contraseña:</label>
                      <button
                        type="button"
                        className="btn btn-link p-0 small text-decoration-none text-muted"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setMostrarPassword(!mostrarPassword)}
                      >
                        {mostrarPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted border-end-0" style={{ borderRadius: '10px 0 0 10px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                        </svg>
                      </span>
                      <input
                        type={mostrarPassword ? 'text' : 'password'}
                        className="form-control form-control-pro border-start-0"
                        placeholder="Tu contraseña secreta"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        style={{ borderRadius: '0 10px 10px 0' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-100 py-2 fw-bold rounded-3 shadow-sm mb-3"
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      border: 'none',
                      fontSize: '0.95rem',
                    }}
                  >
                    {loading ? 'Ingresando...' : 'Ingresar al Sistema →'}
                  </button>
                </form>

                {/* Tarjeta de ayuda discreta para Administrador */}
                <div className="p-3 bg-light rounded-3 border mt-3 small">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="d-block text-dark" style={{ fontSize: '0.8rem' }}>👑 Acceso del Administrador:</strong>
                      <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                        Correo: <strong className="text-dark">{ADMIN_CREDENTIALS.email}</strong> • Contraseña: <strong className="text-dark">{ADMIN_CREDENTIALS.password}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm py-1 px-3 rounded-pill fw-semibold"
                      style={{ fontSize: '0.72rem' }}
                      onClick={llenarCredencialesAdmin}
                      title="Autorrellenar credenciales del administrador"
                    >
                      Autocompletar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FORMULARIO NORMAL DE REGISTRO */}
            {tab === 'register' && (
              <div>
                <h4 className="fw-bold text-dark mb-1 tracking-tight">Registro de Nuevo Contribuyente</h4>
                <p className="text-muted small mb-3">Crea tu propia cuenta privada para gestionar tus retenciones.</p>

                <form onSubmit={handleRegisterSubmit}>
                  <div className="row g-2 mb-2">
                    <div className="col-sm-7 col-12">
                      <label className="form-label small fw-semibold text-dark mb-1">Nombre Completo:</label>
                      <input
                        type="text"
                        className="form-control form-control-pro form-control-sm"
                        placeholder="Ej: Lic. Marcelo Gutiérrez"
                        value={regNombre}
                        onChange={(e) => setRegNombre(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-sm-5 col-12">
                      <label className="form-label small fw-semibold text-dark mb-1">Documento (CI / NIT):</label>
                      <input
                        type="text"
                        className="form-control form-control-pro form-control-sm"
                        placeholder="Ej: 5829102-LP"
                        value={regDocumento}
                        onChange={(e) => setRegDocumento(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-sm-6 col-12">
                      <label className="form-label small fw-semibold text-dark mb-1">Correo Electrónico:</label>
                      <input
                        type="email"
                        className="form-control form-control-pro form-control-sm"
                        placeholder="marcelo@empresa.bo"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-sm-6 col-12">
                      <label className="form-label small fw-semibold text-dark mb-1">Contraseña:</label>
                      <input
                        type="password"
                        className="form-control form-control-pro form-control-sm"
                        placeholder="Mínimo 4 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-sm-6 col-12">
                      <label className="form-label small fw-semibold text-dark mb-1">Empresa / Empleador:</label>
                      <input
                        type="text"
                        className="form-control form-control-pro form-control-sm"
                        placeholder="Ej: Banco Nacional S.A."
                        value={regEmpresa}
                        onChange={(e) => setRegEmpresa(e.target.value)}
                      />
                    </div>
                    <div className="col-sm-6 col-12">
                      <label className="form-label small fw-semibold text-dark mb-1">Cargo / Puesto:</label>
                      <input
                        type="text"
                        className="form-control form-control-pro form-control-sm"
                        placeholder="Ej: Analista Financiero"
                        value={regCargo}
                        onChange={(e) => setRegCargo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Tipo de Contribuyente:</label>
                    <select
                      className="form-select form-control-pro form-select-sm"
                      value={regTipo}
                      onChange={(e) => setRegTipo(e.target.value as 'Dependiente' | 'Independiente')}
                    >
                      <option value="Dependiente">Dependiente (Retención en Planilla de Haberes)</option>
                      <option value="Independiente">Independiente (Consultor de Línea / Servicios)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-100 py-2 fw-bold rounded-3 shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', border: 'none' }}
                  >
                    {loading ? 'Creando cuenta...' : 'Crear mi Cuenta y Entrar →'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
