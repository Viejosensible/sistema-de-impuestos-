import { useState, useMemo, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './App.css';

import {
  calcularImpuesto,
  formatMoneda,
  DEFAULT_TAX_CONFIG,
  type ContribuyenteInfo,
  type FacturaItem,
  type TaxConfig,
  type EscenarioPrueba,
} from './services/taxCalculator';

import { authService, type Usuario } from './services/authService';
import { AuthScreen } from './components/AuthScreen';
import { InformeTributario } from './components/InformeTributario';
import { ModalFacturas } from './components/ModalFacturas';
import { ModalPerfil } from './components/ModalPerfil';
import { MenuEjemplos } from './components/MenuEjemplos';
import { AdminDashboard } from './components/AdminDashboard';
import { Sidebar } from './components/Sidebar';
import { HistorialDeclaraciones, type DeclaracionGuardada } from './components/HistorialDeclaraciones';

export default function App() {
  // Estado de sesión del usuario
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(() => {
    return authService.getSesionActiva();
  });

  // Modales y control de menú de ejemplos (entrar / salir)
  const [showModalPerfil, setShowModalPerfil] = useState(false);
  const [showModalFacturas, setShowModalFacturas] = useState(false);
  const [mostrarMenuEjemplos, setMostrarMenuEjemplos] = useState(false); // Inicia cerrado para que el usuario tenga su espacio limpio

  // Parámetros tributarios
  const [config, setConfig] = useState<TaxConfig>(DEFAULT_TAX_CONFIG);
  const [mostrarConfigAvanzada, setMostrarConfigAvanzada] = useState(false);

  // Tab activo del sidebar
  const [activeTab, setActiveTab] = useState<'formulario' | 'informe' | 'facturas' | 'historial'>('formulario');

  // Vista activa en la zona del usuario (Formulario / Informe / Ambos)
  const [subVistaUsuario, setSubVistaUsuario] = useState<'formulario' | 'informe' | 'ambos'>('ambos');

  // Datos del contribuyente
  const [contribuyente, setContribuyente] = useState<ContribuyenteInfo>({
    nombre: '',
    documento: '',
    periodo: '2026-11',
    empresa: '',
    cargo: '',
  });

  // Datos financieros para rellenar (inicia limpio para el usuario)
  const [sueldoBruto, setSueldoBruto] = useState<number>(0);
  const [saldoAnterior, setSaldoAnterior] = useState<number>(0);
  const [totalFacturasManual, setTotalFacturasManual] = useState<number>(0);
  const [facturas, setFacturas] = useState<FacturaItem[]>([]);
  const [usaFacturasDetalladas, setUsaFacturasDetalladas] = useState<boolean>(false);

  // Control de ejemplo seleccionado de referencia
  const [ejemploActivoId, setEjemploActivoId] = useState<string | null>(null);

  // Bandera para evitar sobreescritura durante la carga inicial
  const [datosCargados, setDatosCargados] = useState(false);

  // Historial de declaraciones guardadas del usuario actual
  const [historial, setHistorial] = useState<DeclaracionGuardada[]>([]);
  const [guardadoReciente, setGuardadoReciente] = useState(false);

  // Carga los datos propios del usuario desde MySQL al iniciar sesión
  const cargarDatosUsuario = useCallback(async (user: Usuario) => {
    const [data, hist] = await Promise.all([
      authService.getUserTaxData(),
      authService.getUserHistorial(),
    ]);
    setSueldoBruto(data.sueldoBruto || 0);
    setSaldoAnterior(data.saldoAnterior || 0);
    setTotalFacturasManual(data.totalFacturasManual || 0);
    setUsaFacturasDetalladas(data.usaFacturasDetalladas || false);
    setFacturas(data.facturas || []);
    if (data.config) setConfig(data.config);

    setContribuyente({
      nombre: user.nombre,
      documento: user.documento,
      periodo: data.periodo || new Date().toISOString().slice(0, 7),
      empresa: user.empresa,
      cargo: user.cargo,
    });

    setHistorial(hist);
    setDatosCargados(true);
  }, []);

  // Verifica el token almacenado al montar
  useEffect(() => {
    if (usuarioActual) {
      authService.refreshSesion().then((fresh) => {
        if (!fresh) setUsuarioActual(null);
      });
    }
  }, []);

  // Efecto cuando cambia el usuario activo
  useEffect(() => {
    if (usuarioActual && usuarioActual.tipoCuenta !== 'Administrador') {
      cargarDatosUsuario(usuarioActual);
    } else if (!usuarioActual) {
      setDatosCargados(false);
      setHistorial([]);
    }
  }, [usuarioActual, cargarDatosUsuario]);

  // Guardado automático con debounce hacia MySQL para el usuario actual
  useEffect(() => {
    if (!usuarioActual || !datosCargados || usuarioActual.tipoCuenta === 'Administrador') return;
    const timer = window.setTimeout(() => {
      authService.saveUserTaxData({
        sueldoBruto,
        saldoAnterior,
        totalFacturasManual,
        usaFacturasDetalladas,
        facturas,
        periodo: contribuyente.periodo,
        config,
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [usuarioActual, datosCargados, sueldoBruto, saldoAnterior, totalFacturasManual, usaFacturasDetalladas, facturas, contribuyente.periodo, config]);

  // Temporizador para ocultar el aviso de guardado reciente
  useEffect(() => {
    if (!guardadoReciente) return;
    const timer = window.setTimeout(() => setGuardadoReciente(false), 4000);
    return () => window.clearTimeout(timer);
  }, [guardadoReciente]);

  // Manejo de inicio de sesión exitoso
  const handleLoginSuccess = (user: Usuario) => {
    setUsuarioActual(user);
  };

  // Cierre de sesión
  const handleLogout = () => {
    if (window.confirm('¿Deseas cerrar tu sesión? Tus datos y cálculos quedan guardados de forma segura.')) {
      authService.logout();
      setUsuarioActual(null);
      setDatosCargados(false);
    }
  };

  // Actualizar perfil
  const handleUpdatePerfil = async (updates: Partial<Usuario>) => {
    if (!usuarioActual) return;
    const actualizado = await authService.updatePerfil(usuarioActual.id, updates);
    if (actualizado) {
      setUsuarioActual(actualizado);
      setContribuyente((prev) => ({
        ...prev,
        nombre: actualizado.nombre,
        documento: actualizado.documento,
        empresa: actualizado.empresa,
        cargo: actualizado.cargo,
      }));
    }
  };

  // Motor de cálculo reactivo puro sobre los datos que rellena el usuario
  const resultado = useMemo(() => {
    return calcularImpuesto({
      sueldoBruto,
      totalFacturas: usaFacturasDetalladas ? undefined : totalFacturasManual,
      facturas: usaFacturasDetalladas ? facturas : undefined,
      saldoAnterior,
      config,
    });
  }, [sueldoBruto, totalFacturasManual, usaFacturasDetalladas, facturas, saldoAnterior, config]);

  // Vaciar completamente el formulario para que el usuario rellene en blanco desde cero
  const handleVaciarFormulario = () => {
    setSueldoBruto(0);
    setSaldoAnterior(0);
    setTotalFacturasManual(0);
    setFacturas([]);
    setUsaFacturasDetalladas(false);
    setEjemploActivoId(null);
  };

  // Cargar un ejemplo con opción de SALIR automáticamente del menú
  const handleCargarEjemplo = (esc: EscenarioPrueba, salirDespues = true) => {
    setEjemploActivoId(esc.id);
    setSueldoBruto(esc.input.sueldoBruto);
    setSaldoAnterior(esc.input.saldoAnterior || 0);

    if (esc.input.facturas && esc.input.facturas.length > 0) {
      setFacturas([...esc.input.facturas]);
      setUsaFacturasDetalladas(true);
      setTotalFacturasManual(0);
    } else {
      setFacturas([]);
      setUsaFacturasDetalladas(false);
      setTotalFacturasManual(esc.input.totalFacturas || 0);
    }

    if (esc.input.config) {
      setConfig({
        ...DEFAULT_TAX_CONFIG,
        ...esc.input.config,
      });
    }

    // Si seleccionó "Cargar y Salir", cerramos el menú para que vea su informe con pantalla completa
    if (salirDespues) {
      setMostrarMenuEjemplos(false);
    }
  };

  // Imprimir informe
  const handlePrint = () => {
    window.print();
  };

  // Guardar la declaración actual en el historial del usuario (MySQL)
  const handleGuardarEnHistorial = async () => {
    const nuevaDeclaracion: DeclaracionGuardada = {
      id: `decl-${Date.now()}`,
      fechaGuardado: new Date().toISOString(),
      contribuyente: {
        ...contribuyente,
        nombre: contribuyente.nombre.trim() || usuarioActual?.nombre || 'Contribuyente',
        documento: contribuyente.documento.trim() || usuarioActual?.documento || 'S/N',
      },
      resultado: { ...resultado },
      config: { ...config },
      facturas: usaFacturasDetalladas ? facturas.map((f) => ({ ...f })) : [],
      sueldoBruto,
      saldoAnterior,
      totalFacturasManual,
      usaFacturasDetalladas,
    };

    try {
      await authService.saveDeclaracion(nuevaDeclaracion);
      setHistorial((prev) => [nuevaDeclaracion, ...prev]);
      setGuardadoReciente(true);
    } catch (err) {
      console.warn('Error guardando declaración en MySQL', err);
    }
  };

  // Recargar una declaración guardada en el formulario
  const handleCargarDeclaracion = (decl: DeclaracionGuardada) => {
    setContribuyente({ ...decl.contribuyente });
    setSueldoBruto(decl.sueldoBruto);
    setSaldoAnterior(decl.saldoAnterior);
    setTotalFacturasManual(decl.totalFacturasManual);
    setUsaFacturasDetalladas(decl.usaFacturasDetalladas);
    setFacturas(decl.facturas ? decl.facturas.map((f) => ({ ...f })) : []);
    if (decl.config) {
      setConfig({ ...DEFAULT_TAX_CONFIG, ...decl.config });
    }
    setEjemploActivoId(null);
    setActiveTab('formulario');
  };

  // Eliminar una declaración del historial
  const handleEliminarDeclaracion = async (id: string) => {
    await authService.deleteDeclaracion(id);
    setHistorial((prev) => prev.filter((item) => item.id !== id));
  };

  // Limpiar todo el historial
  const handleLimpiarHistorial = async () => {
    if (window.confirm('¿Estás seguro de que deseas borrar todo tu historial de declaraciones?')) {
      await authService.clearHistorial();
      setHistorial([]);
    }
  };

  // Exportar historial a JSON
  const handleExportarJSON = () => {
    const blob = new Blob([JSON.stringify(historial, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historial-declaraciones-${contribuyente.periodo || 'rc-iva'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Importar historial desde JSON
  const handleImportarJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) {
          window.alert('El archivo JSON no contiene una lista válida de declaraciones.');
          return;
        }
        const validas = parsed.filter(
          (item): item is DeclaracionGuardada =>
            Boolean(item && typeof item.id === 'string' && item.contribuyente && item.resultado)
        );
        authService.importDeclaraciones(validas).then(() => {
          setHistorial((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const nuevas = validas.filter((v) => !existingIds.has(v.id));
            return [...nuevas, ...prev];
          });
        });
      } catch {
        window.alert('No se pudo leer el archivo JSON. Verifica que tenga un formato válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // SI NO HAY SESIÓN ACTIVA, MOSTRAR PANTALLA DE INICIO DE SESIÓN / REGISTRO
  if (!usuarioActual) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // SI LA SESIÓN ES DE ADMINISTRADOR, MOSTRAR PANEL EXCLUSIVO DEL ADMINISTRADOR
  if (usuarioActual.tipoCuenta === 'Administrador') {
    return <AdminDashboard usuario={usuarioActual} onLogout={handleLogout} />;
  }

  return (
    <div className="min-vh-100 d-flex flex-row" style={{ backgroundColor: '#f8fafc' }}>
      {/* ══════════════════════════════════════════
          SIDEBAR LATERAL IZQUIERDO
         ══════════════════════════════════════════ */}
      <Sidebar
        usuario={usuarioActual}
        resultado={resultado}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as any)}
        mostrarMenuEjemplos={mostrarMenuEjemplos}
        setMostrarMenuEjemplos={setMostrarMenuEjemplos}
        onOpenPerfil={() => setShowModalPerfil(true)}
        onPrint={handlePrint}
        onVaciarFormulario={handleVaciarFormulario}
        onLogout={handleLogout}
      />

      {/* ══════════════════════════════════════════
          ÁREA DE CONTENIDO PRINCIPAL (a la derecha del sidebar)
         ══════════════════════════════════════════ */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0, overflowX: 'hidden' }}>

        {/* Barra superior compacta con breadcrumb */}
        <header className="header-executive py-2 px-3 px-lg-4 no-print" style={{ minHeight: 52 }}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="text-secondary" style={{ fontSize: '0.75rem' }}>SIN Tributario</span>
              <span className="text-secondary" style={{ fontSize: '0.75rem' }}>›</span>
              <span className="fw-bold text-white" style={{ fontSize: '0.82rem' }}>
                {activeTab === 'formulario' && '📝 Formulario'}
                {activeTab === 'informe' && '📑 Informe F-110'}
                {activeTab === 'facturas' && '🧾 Facturas'}
                {activeTab === 'historial' && '📂 Historial'}
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-success bg-opacity-25 text-white border border-success border-opacity-50 small" style={{ fontSize: '0.68rem' }}>
                <span className="pulse-dot bg-success me-1"></span>
                Directo (Con SMN)
              </span>
              <span className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                {usuarioActual.nombre}
              </span>
            </div>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="container-fluid px-3 px-lg-4 py-3 flex-grow-1">
          <div className="row g-3">
            {/* ═══════════════════════════════════════
                ZONA DE TRABAJO PRINCIPAL
               ═══════════════════════════════════════ */}
            <div className={mostrarMenuEjemplos ? 'col-xl-8 col-lg-7' : 'col-12'}>

              {/* ── TAB: FORMULARIO ── */}
              {activeTab === 'formulario' && (
                <>
                  {/* Barra de control de subvista */}
                  <div className="card-pro p-3 mb-3 bg-white no-print">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary px-2 py-1 small fw-bold">Tu Espacio</span>
                        <strong className="text-dark small text-uppercase">
                          Formulario para que tú rellenes con tus propios datos:
                        </strong>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <div className="btn-group btn-group-sm">
                          <button type="button" className={`btn btn-sm ${subVistaUsuario === 'ambos' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setSubVistaUsuario('ambos')}>
                            Ver Ambos
                          </button>
                          <button type="button" className={`btn btn-sm ${subVistaUsuario === 'formulario' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setSubVistaUsuario('formulario')}>
                            Solo Formulario
                          </button>
                          <button type="button" className={`btn btn-sm ${subVistaUsuario === 'informe' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setSubVistaUsuario('informe')}>
                            Solo Informe
                          </button>
                        </div>
                        <button
                          type="button"
                          className="btn btn-success btn-sm fw-semibold d-flex align-items-center gap-1"
                          onClick={handleGuardarEnHistorial}
                          title="Guardar cálculo actual en el historial"
                        >
                          <span>💾</span>
                          <span>Guardar en Historial</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="row g-3">
                    {/* FORMULARIO */}
                    {(subVistaUsuario === 'formulario' || subVistaUsuario === 'ambos') && (
                      <div className={subVistaUsuario === 'ambos' ? 'col-xl-6 col-12' : 'col-12'}>
                        {/* TARJETA 1: DATOS DEL CONTRIBUYENTE */}
                        <div className="card-pro mb-3">
                          <div className="card-pro-header">
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-primary fw-bold">👤</span>
                              <span className="fw-bold text-dark small text-uppercase">1. Datos Personales</span>
                            </div>
                            <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none small text-primary fw-semibold" onClick={() => setShowModalPerfil(true)}>
                              Editar Perfil ✏️
                            </button>
                          </div>
                          <div className="p-3">
                            <div className="row g-2">
                              <div className="col-sm-7 col-12">
                                <label className="form-label small fw-semibold text-muted mb-1">Tu Nombre:</label>
                                <input type="text" className="form-control form-control-pro form-control-sm" value={contribuyente.nombre} onChange={(e) => setContribuyente({ ...contribuyente, nombre: e.target.value })} placeholder="Ej: Juan Pérez" />
                              </div>
                              <div className="col-sm-5 col-12">
                                <label className="form-label small fw-semibold text-muted mb-1">Doc. Identidad (CI):</label>
                                <input type="text" className="form-control form-control-pro form-control-sm" value={contribuyente.documento} onChange={(e) => setContribuyente({ ...contribuyente, documento: e.target.value })} placeholder="Ej: 5829102-LP" />
                              </div>
                              <div className="col-sm-6 col-12">
                                <label className="form-label small fw-semibold text-muted mb-1">Mes Declarado:</label>
                                <input type="month" className="form-control form-control-pro form-control-sm" value={contribuyente.periodo} onChange={(e) => setContribuyente({ ...contribuyente, periodo: e.target.value })} />
                              </div>
                              <div className="col-sm-6 col-12">
                                <label className="form-label small fw-semibold text-muted mb-1">Entidad Empleadora:</label>
                                <input type="text" className="form-control form-control-pro form-control-sm" value={contribuyente.empresa} onChange={(e) => setContribuyente({ ...contribuyente, empresa: e.target.value })} placeholder="Ej: Banco o Empresa S.A." />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* TARJETA 2: INGRESOS LABORALES */}
                        <div className="card-pro mb-3">
                          <div className="card-pro-header">
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-primary fw-bold">💰</span>
                              <span className="fw-bold text-dark small text-uppercase">2. Rellena tus Ingresos</span>
                            </div>
                            <span className="badge bg-primary bg-opacity-10 text-primary small">Sueldo Bruto</span>
                          </div>
                          <div className="p-3">
                            <label className="form-label fw-bold text-dark small d-flex justify-content-between align-items-center mb-1">
                              <span>Tu Sueldo Bruto Mensual (Total Ganado):</span>
                              <span className="badge bg-light text-primary border fs-6">{formatMoneda(sueldoBruto)}</span>
                            </label>
                            <div className="input-group mb-3">
                              <span className="input-group-text input-hero-addon">Bs.</span>
                              <input type="number" step="50" min="0" className="form-control form-control-pro input-hero" value={sueldoBruto || ''} onChange={(e) => { setSueldoBruto(parseFloat(e.target.value) || 0); setEjemploActivoId(null); }} placeholder="0.00" />
                            </div>
                            <div className="mini-kpi">
                              <div className="d-flex justify-content-between align-items-center text-danger small mb-1">
                                <span><span className="op-sign op-minus">-</span>Aportes de Ley ({config.alicuotaAportesLaboralesPct}% AFP/Gestora):</span>
                                <strong className="num-tabular">-{formatMoneda(resultado.descuentoAportes)}</strong>
                              </div>
                              <div className="d-flex justify-content-between align-items-center text-primary pt-2 border-top">
                                <span className="fw-bold small"><span className="op-sign op-equal">=</span>Sueldo Neto Resultante:</span>
                                <strong className="fs-6 num-tabular">{formatMoneda(resultado.sueldoNeto)}</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* TARJETA 3: FACTURAS Y CRÉDITOS */}
                        <div className="card-pro mb-3">
                          <div className="card-pro-header">
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-primary fw-bold">🧾</span>
                              <span className="fw-bold text-dark small text-uppercase">3. Rellena tus Descargos</span>
                            </div>
                            <button type="button" className="btn btn-outline-primary btn-sm py-1 px-3 rounded-pill fw-semibold" style={{ fontSize: '0.78rem' }} onClick={() => setShowModalFacturas(true)}>
                              {usaFacturasDetalladas ? `Facturas (${facturas.length}) ✏️` : 'Desglosar facturas ➕'}
                            </button>
                          </div>
                          <div className="p-3">
                            <div className="mb-3">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <label className="form-label small fw-semibold text-dark mb-0">Total Facturas que tienes (Formulario 110):</label>
                                <span className="text-success small fw-bold">Crédito 13%: {formatMoneda(resultado.creditoFacturas)}</span>
                              </div>
                              {usaFacturasDetalladas ? (
                                <div className="p-2 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                                  <div>
                                    <strong className="text-dark fs-6 num-tabular">{formatMoneda(resultado.totalFacturas)}</strong>
                                    <span className="text-muted small d-block">{facturas.length} comprobantes registrados</span>
                                  </div>
                                  <button type="button" className="btn btn-sm btn-outline-secondary rounded-3" onClick={() => setShowModalFacturas(true)}>Ver / Editar</button>
                                </div>
                              ) : (
                                <div className="input-group">
                                  <span className="input-group-text bg-light fw-bold text-muted">Bs.</span>
                                  <input type="number" step="10" min="0" className="form-control form-control-pro" value={totalFacturasManual || ''} onChange={(e) => { setTotalFacturasManual(parseFloat(e.target.value) || 0); setEjemploActivoId(null); }} placeholder="0.00 (Si no tienes, deja en 0)" />
                                </div>
                              )}
                            </div>
                            <div className="mb-3">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <label className="form-label small fw-semibold text-dark mb-0">Saldo a favor del mes anterior (si tienes):</label>
                                <span className="text-info small fw-bold">{formatMoneda(saldoAnterior)}</span>
                              </div>
                              <div className="input-group">
                                <span className="input-group-text bg-light fw-bold text-muted">Bs.</span>
                                <input type="number" step="10" min="0" className="form-control form-control-pro" value={saldoAnterior || ''} onChange={(e) => { setSaldoAnterior(parseFloat(e.target.value) || 0); setEjemploActivoId(null); }} placeholder="0.00" />
                              </div>
                            </div>
                            <div className="mini-kpi">
                              <div className="d-flex justify-content-between text-muted small mb-1">
                                <span>Crédito por Facturas ({config.alicuotaFacturasPct}%):</span>
                                <strong className="num-tabular">{formatMoneda(resultado.creditoFacturas)}</strong>
                              </div>
                              <div className="d-flex justify-content-between text-muted small mb-1">
                                <span>Saldo anterior acumulado:</span>
                                <strong className="num-tabular">{formatMoneda(resultado.saldoAnterior)}</strong>
                              </div>
                              <div className="d-flex justify-content-between text-success pt-1 border-top fw-bold">
                                <span>Total Crédito Disponible para el mes:</span>
                                <span className="num-tabular">{formatMoneda(resultado.totalCreditoDisponible)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ACORDEÓN DE CONFIGURACIÓN DE TASAS */}
                        <div className="card-pro mb-3">
                          <div className="p-3">
                            <button type="button" className="btn btn-link text-decoration-none p-0 w-100 text-start d-flex justify-content-between align-items-center text-secondary small fw-semibold" onClick={() => setMostrarConfigAvanzada(!mostrarConfigAvanzada)}>
                              <span className="d-flex align-items-center gap-1"><span>⚙️</span><span>Ajustar Tasas y Deducción Exenta (Opcional)</span></span>
                              <span>{mostrarConfigAvanzada ? '▲ Ocultar' : '▼ Modificar'}</span>
                            </button>
                            {mostrarConfigAvanzada && (
                              <div className="mt-3 pt-3 border-top small">
                                <div className="row g-2">
                                  <div className="col-6">
                                    <label className="form-label mb-1 fw-semibold text-dark">Aportes Laborales (%):</label>
                                    <input type="number" step="0.01" className="form-control form-control-pro form-control-sm" value={config.alicuotaAportesLaboralesPct} onChange={(e) => setConfig({ ...config, alicuotaAportesLaboralesPct: parseFloat(e.target.value) || 0 })} />
                                  </div>
                                  <div className="col-6">
                                    <label className="form-label mb-1 fw-semibold text-dark">Alícuota Impuesto (%):</label>
                                    <input type="number" step="0.01" className="form-control form-control-pro form-control-sm" value={config.alicuotaImpuestoPct} onChange={(e) => setConfig({ ...config, alicuotaImpuestoPct: parseFloat(e.target.value) || 0 })} />
                                  </div>
                                  <div className="col-12">


                                  </div>
                                </div>
                                <button type="button" className="btn btn-outline-secondary btn-sm w-100 mt-2 rounded-3" onClick={() => setConfig(DEFAULT_TAX_CONFIG)}>
                                  Restablecer Tasas por Defecto (12.71% / 13%)
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* BOTÓN DE GUARDADO EN HISTORIAL */}
                        <div className="card-pro p-3 mb-3 bg-white no-print">
                          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                            <button
                              type="button"
                              className="btn btn-success flex-grow-1 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                              onClick={handleGuardarEnHistorial}
                            >
                              <span>💾</span>
                              <span>Guardar Declaración en Historial</span>
                            </button>
                            {historial.length > 0 && (
                              <button
                                type="button"
                                className="btn btn-outline-primary py-2 fw-semibold"
                                onClick={() => setActiveTab('historial')}
                              >
                                📂 Ver Historial ({historial.length})
                              </button>
                            )}
                          </div>
                          {guardadoReciente && (
                            <div className="alert alert-success py-2 px-3 mt-2 mb-0 small d-flex justify-content-between align-items-center">
                              <span>✓ Declaración guardada en tu historial.</span>
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 fw-bold text-success text-decoration-none"
                                onClick={() => setActiveTab('historial')}
                              >
                                Ir al Historial →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* INFORME EN VIVO */}
                    {(subVistaUsuario === 'informe' || subVistaUsuario === 'ambos') && (
                      <div className={subVistaUsuario === 'ambos' ? 'col-xl-6 col-12' : 'col-12'}>
                        <InformeTributario contribuyente={contribuyente} resultado={resultado} config={config} facturas={usaFacturasDetalladas ? facturas : []} onPrint={handlePrint} />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── TAB: INFORME OFICIAL ── */}
              {activeTab === 'informe' && (
                <InformeTributario contribuyente={contribuyente} resultado={resultado} config={config} facturas={usaFacturasDetalladas ? facturas : []} onPrint={handlePrint} />
              )}

              {/* ── TAB: FACTURAS ── */}
              {activeTab === 'facturas' && (
                <div className="card-pro bg-white p-4">
                  <h6 className="fw-bold text-dark mb-3">🧾 Gestión de Facturas y Comprobantes</h6>
                  <p className="text-muted small">Total declarado: <strong className="text-dark num-tabular">{formatMoneda(resultado.totalFacturas)}</strong> — Crédito fiscal (13%): <strong className="text-success num-tabular">{formatMoneda(resultado.creditoFacturas)}</strong></p>
                  <button type="button" className="btn btn-primary rounded-pill px-4" onClick={() => setShowModalFacturas(true)}>
                    {usaFacturasDetalladas ? `✏️ Editar Facturas (${facturas.length} registradas)` : '➕ Agregar / Desglosar Facturas'}
                  </button>
                </div>
              )}

              {/* ── TAB: HISTORIAL ── */}
              {activeTab === 'historial' && (
                <HistorialDeclaraciones
                  historial={historial}
                  onCargarDeclaracion={handleCargarDeclaracion}
                  onEliminarDeclaracion={handleEliminarDeclaracion}
                  onLimpiarHistorial={handleLimpiarHistorial}
                  onExportarJSON={handleExportarJSON}
                  onImportarJSON={handleImportarJSON}
                />
              )}
            </div>

            {/* ═══════════════════════════════════════
                PANEL LATERAL DE EJEMPLOS (a la derecha del contenido)
               ═══════════════════════════════════════ */}
            {mostrarMenuEjemplos && (
              <div className="col-xl-4 col-lg-5">
                <MenuEjemplos
                  onCargarEjemplo={handleCargarEjemplo}
                  onVaciarFormulario={handleVaciarFormulario}
                  onSalir={() => setMostrarMenuEjemplos(false)}
                  ejemploSeleccionadoId={ejemploActivoId}
                />
              </div>
            )}
          </div>
        </main>

        {/* FOOTER */}
        <footer className="bg-white border-top py-2 px-3 no-print mt-auto">
          <div className="container-fluid px-0">
            <div className="d-flex flex-wrap justify-content-between align-items-center text-muted small" style={{ fontSize: '0.78rem' }}>
              <span>
                <strong>Sistema Tributario Oficial</strong> • Usuario: <strong>{usuarioActual.nombre}</strong> ({usuarioActual.email})
              </span>
              <span>
                Codificación UTF-8 • React 19 + TypeScript • Modelo con SMN
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* MODAL PARA DESGLOSAR FACTURAS */}
      <ModalFacturas
        show={showModalFacturas}
        facturas={facturas}
        tasaFacturasPct={config.alicuotaFacturasPct}
        onClose={() => setShowModalFacturas(false)}
        onUpdateFacturas={(nuevasFacturas) => {
          setFacturas(nuevasFacturas);
          setUsaFacturasDetalladas(nuevasFacturas.length > 0);
          if (nuevasFacturas.length > 0) setTotalFacturasManual(0);
        }}
      />

      {/* MODAL DE PERFIL */}
      <ModalPerfil
        show={showModalPerfil}
        usuario={usuarioActual}
        onClose={() => setShowModalPerfil(false)}
        onUpdatePerfil={handleUpdatePerfil}
      />
    </div>
  );
}
