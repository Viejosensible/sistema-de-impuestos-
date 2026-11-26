import React, { useState, useEffect, useCallback } from 'react';
import {
  authService,
  type Usuario,
  type UserWithTaxSummary,
} from '../services/authService';
import {
  formatMoneda,
  DEFAULT_TAX_CONFIG,
  calcularImpuesto,
  type TaxConfig,
} from '../services/taxCalculator';
import { InformeTributario } from './InformeTributario';

interface AdminDashboardProps {
  usuario: Usuario;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ usuario, onLogout }) => {
  const [tab, setTab] = useState<'matriz' | 'padron' | 'normativa' | 'simulador'>('matriz');

  // Matriz de usuarios y sus liquidaciones
  const [datosMatriz, setDatosMatriz] = useState<UserWithTaxSummary[]>([]);

  // Usuario seleccionado para auditar su informe oficial F-110
  const [inspeccionUsuario, setInspeccionUsuario] = useState<UserWithTaxSummary | null>(null);

  // Parámetros normativos globales
  const [normativaConfig, setNormativaConfig] = useState<TaxConfig>(DEFAULT_TAX_CONFIG);
  const [normativaGuardada, setNormativaGuardada] = useState(false);

  // Simulador del Administrador
  const [simSueldoBruto, setSimSueldoBruto] = useState<number>(15000);
  const [simFacturas, setSimFacturas] = useState<number>(5000);
  const [simSaldoAnterior, setSimSaldoAnterior] = useState<number>(0);

  const recargarMatriz = useCallback(async () => {
    try {
      const matriz = await authService.getMatrizTributariaGlobal();
      setDatosMatriz(matriz);
    } catch (err) {
      console.warn('Error cargando matriz tributaria', err);
    }
  }, []);

  useEffect(() => {
    recargarMatriz();
    authService.getNormativaGlobal().then(setNormativaConfig);
  }, [recargarMatriz]);

  const handleEliminarContribuyente = async (userId: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de eliminar al contribuyente ${nombre} del padrón?`)) {
      await authService.eliminarContribuyente(userId);
      await recargarMatriz();
    }
  };

  // Sumatorias globales
  const totalUsuarios = datosMatriz.length;
  const totalMasaSalarial = datosMatriz.reduce((acc, item) => acc + (item.taxData.sueldoBruto || 0), 0);
  const totalRetenciones = datosMatriz.reduce((acc, item) => acc + (item.taxResult.totalPagar || 0), 0);
  const totalFacturasDeclaradas = datosMatriz.reduce((acc, item) => acc + (item.taxResult.totalFacturas || 0), 0);

  // Cálculo del simulador admin
  const simResultado = calcularImpuesto({
    sueldoBruto: simSueldoBruto,
    totalFacturas: simFacturas,
    saldoAnterior: simSaldoAnterior,
    config: normativaConfig,
  });

  const handleGuardarNormativa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.saveNormativaGlobal(normativaConfig);
      setNormativaGuardada(true);
      setTimeout(() => setNormativaGuardada(false), 3000);
    } catch (err) {
      console.warn('Error guardando normativa', err);
    }
  };

  const handleExportarAuditoriaJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datosMatriz, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `auditoria_tributaria_sin_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-vh-100 d-flex flex-row" style={{ backgroundColor: '#f1f5f9' }}>

      {/* ══════════════════════════════════════════
          SIDEBAR LATERAL DEL ADMINISTRADOR
         ══════════════════════════════════════════ */}
      <aside
        className="no-print"
        style={{
          width: 220,
          minWidth: 220,
          background: 'linear-gradient(180deg, #450a0a 0%, #1a0505 50%, #0f172a 100%)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 1030,
          boxShadow: '4px 0 20px rgba(0,0,0,0.4)',
          overflowY: 'auto',
        }}
      >
        {/* Logo Admin */}
        <div style={{ padding: '16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10, minHeight: 64 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(220,38,38,0.5)', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
            <span style={{ fontSize: '1rem' }}>👑</span>
          </div>
          <div>
            <div style={{ color: '#fca5a5', fontWeight: 800, fontSize: '0.78rem', lineHeight: 1.2 }}>SIN • Admin</div>
            <div style={{ color: '#64748b', fontSize: '0.62rem' }}>Panel de Administración</div>
          </div>
        </div>

        {/* KPI rápido */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Resumen del Sistema</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'Contribuyentes', value: totalUsuarios, color: '#3b82f6' },
              { label: 'Retención Total', value: formatMoneda(totalRetenciones), color: '#f87171' },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '6px 8px' }}>
                <div style={{ color: kpi.color, fontWeight: 800, fontSize: '0.9rem' }}>{kpi.value}</div>
                <div style={{ color: '#475569', fontSize: '0.6rem' }}>{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Navegación */}
        <nav style={{ flex: 1, padding: '8px 8px' }}>
          <div style={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 6px 4px' }}>Módulos</div>
          {[
            { id: 'matriz', icon: '📑', label: 'Matriz de Retenciones', sublabel: 'Auditoría en vivo' },
            { id: 'padron', icon: '👥', label: 'Padrón', sublabel: `${datosMatriz.length} registros` },
            { id: 'normativa', icon: '⚖️', label: 'Normativa Global', sublabel: 'Parámetros oficiales' },
            { id: 'simulador', icon: '🧮', label: 'Simulador Fiscal', sublabel: 'Pruebas técnicas' },
          ].map(item => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as typeof tab)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 10, border: 'none', marginBottom: 2,
                  cursor: 'pointer', transition: 'all 0.18s',
                  background: isActive ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : 'transparent',
                  boxShadow: isActive ? '0 4px 14px rgba(220,38,38,0.3)' : 'none',
                  color: isActive ? '#fff' : '#94a3b8',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, lineHeight: 1.2 }}>{item.label}</div>
                  <div style={{ fontSize: '0.62rem', color: isActive ? 'rgba(255,255,255,0.6)' : '#475569' }}>{item.sublabel}</div>
                </div>
                {isActive && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />}
              </button>
            );
          })}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 4px' }} />

          {/* Exportar */}
          <button
            onClick={handleExportarAuditoriaJSON}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 2, cursor: 'pointer', background: 'rgba(255,255,255,0.03)', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.18s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
          >
            <span>📥</span>
            <span>Exportar Matriz JSON</span>
          </button>

          <button
            onClick={recargarMatriz}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 2, cursor: 'pointer', background: 'rgba(255,255,255,0.03)', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.18s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
          >
            <span>🔄</span>
            <span>Refrescar Datos</span>
          </button>
        </nav>

        {/* Perfil Admin + Cerrar Sesión */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '10px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 6 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
              {usuario.nombre.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fca5a5', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{usuario.nombre}</div>
              <div style={{ color: '#475569', fontSize: '0.62rem' }}>Administrador</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontWeight: 600, fontSize: '0.75rem', transition: 'all 0.18s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.18)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
          >
            <span>🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          ÁREA DE CONTENIDO PRINCIPAL DEL ADMIN
         ══════════════════════════════════════════ */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0, overflowX: 'hidden' }}>

        {/* Barra superior compacta */}
        <header className="no-print py-2 px-3 px-lg-4" style={{ background: 'linear-gradient(135deg, #450a0a 0%, #0f172a 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)', minHeight: 52 }}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="text-secondary" style={{ fontSize: '0.75rem' }}>SIN Admin</span>
              <span className="text-secondary" style={{ fontSize: '0.75rem' }}>›</span>
              <span className="fw-bold text-white" style={{ fontSize: '0.82rem' }}>
                {tab === 'matriz' && '📑 Matriz General de Retenciones'}
                {tab === 'padron' && `👥 Padrón de Contribuyentes (${datosMatriz.length})`}
                {tab === 'normativa' && '⚖️ Parámetros Normativos Globales'}
                {tab === 'simulador' && '🧮 Simulador Fiscal de Pruebas'}
              </span>
            </div>
            <span className="badge bg-danger text-white border border-danger border-opacity-50 small" style={{ fontSize: '0.68rem' }}>
              Nivel Superior • Control Fiscal
            </span>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL DEL ADMINISTRADOR */}
        <main className="container-fluid px-3 px-lg-4 py-3 flex-grow-1">
        {/* TARJETAS KPI GLOBALES DEL SISTEMA */}
        <div className="row g-3 mb-4 no-print">
          {/* KPI 1 */}
          <div className="col-lg-3 col-sm-6">
            <div className="card-pro p-3 h-100 bg-white border-start border-4 border-primary">
              <span className="text-muted small text-uppercase fw-semibold d-block">
                Contribuyentes Registrados
              </span>
              <h2 className="fw-bold text-dark mb-0 num-tabular">{totalUsuarios}</h2>
              <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                Padrón activo en el sistema
              </small>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="col-lg-3 col-sm-6">
            <div className="card-pro p-3 h-100 bg-white border-start border-4 border-info">
              <span className="text-muted small text-uppercase fw-semibold d-block">
                Masa Salarial Monitoreada
              </span>
              <h3 className="fw-bold text-dark mb-0 num-tabular">{formatMoneda(totalMasaSalarial)}</h3>
              <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                Total de sueldos brutos declarados
              </small>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="col-lg-3 col-sm-6">
            <div className="card-pro p-3 h-100 bg-white border-start border-4 border-danger">
              <span className="text-muted small text-uppercase fw-semibold d-block">
                Retención Fiscal Global (Planillas)
              </span>
              <h3 className="fw-bold text-danger mb-0 num-tabular">{formatMoneda(totalRetenciones)}</h3>
              <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                Impuesto total líquido a recaudar
              </small>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="col-lg-3 col-sm-6">
            <div className="card-pro p-3 h-100 bg-white border-start border-4 border-success">
              <span className="text-muted small text-uppercase fw-semibold d-block">
                Facturas de Descargo Fiscal
              </span>
              <h3 className="fw-bold text-success mb-0 num-tabular">{formatMoneda(totalFacturasDeclaradas)}</h3>
              <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                Crédito fiscal computado al 13%
              </small>
            </div>
          </div>
        </div>

        {/* ========================================================
            TAB 1: MATRIZ GENERAL DE RETENCIONES (AUDITORÍA EN VIVO)
           ======================================================== */}
        {tab === 'matriz' && (
          <div className="card-pro bg-white p-0 overflow-hidden no-print">
            <div className="card-pro-header p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
              <div>
                <strong className="text-dark small text-uppercase">
                  Auditoría General de Liquidaciones de Dependientes
                </strong>
                <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                  Supervisión directa de Sueldo Neto, Deducciones, Facturas y Retenciones de cada contribuyente
                </small>
              </div>
              <span className="badge bg-dark text-white">{datosMatriz.length} Registros Activos</span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light text-uppercase" style={{ fontSize: '0.72rem' }}>
                  <tr>
                    <th>Contribuyente</th>
                    <th>Documento</th>
                    <th>Empresa</th>
                    <th className="text-end">Sueldo Bruto</th>
                    <th className="text-end">Aportes (12.71%)</th>
                    <th className="text-end">Base Imponible</th>
                    <th className="text-end">Impuesto (13%)</th>
                    <th className="text-end">Crédito Facturas</th>
                    <th className="text-end">Saldo Ant.</th>
                    <th className="text-end">Total a Retener</th>
                    <th>Estado de Liquidación</th>
                    <th className="text-center">Certificado</th>
                  </tr>
                </thead>
                <tbody>
                  {datosMatriz.map((item) => (
                    <tr key={item.usuario.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0"
                            style={{ width: 28, height: 28, backgroundColor: item.usuario.avatarColor || '#2563eb', fontSize: '0.75rem' }}
                          >
                            {item.usuario.nombre.charAt(0)}
                          </div>
                          <div>
                            <strong className="d-block text-dark">{item.usuario.nombre}</strong>
                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>{item.usuario.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{item.usuario.documento}</span>
                      </td>
                      <td className="text-muted text-truncate" style={{ maxWidth: 140 }}>
                        {item.usuario.empresa}
                      </td>
                      <td className="text-end fw-semibold num-tabular">{formatMoneda(item.taxData.sueldoBruto)}</td>
                      <td className="text-end text-danger num-tabular">-{formatMoneda(item.taxResult.descuentoAportes)}</td>
                      <td className="text-end num-tabular">{formatMoneda(item.taxResult.baseImponible)}</td>
                      <td className="text-end fw-semibold num-tabular">{formatMoneda(item.taxResult.impuestoDeterminado)}</td>
                      <td className="text-end text-success num-tabular">-{formatMoneda(item.taxResult.creditoFacturas)}</td>
                      <td className="text-end text-info num-tabular">-{formatMoneda(item.taxResult.saldoAnterior)}</td>
                      <td className={`text-end fw-bold num-tabular ${item.taxResult.totalPagar > 0 ? 'text-danger' : 'text-success'}`}>
                        {formatMoneda(item.taxResult.totalPagar)}
                      </td>
                      <td>
                        <span className={`status-pill status-pill-${item.taxResult.statusBadgeVariant}`} style={{ fontSize: '0.72rem' }}>
                          {item.taxResult.statusLabel}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary py-1 px-2 rounded-3 fw-semibold"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setInspeccionUsuario(item)}
                          title="Inspeccionar Certificado Oficial F-110"
                        >
                          Ver F-110 📑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: PADRÓN DE CONTRIBUYENTES
           ======================================================== */}
        {tab === 'padron' && (
          <div className="card-pro bg-white p-0 overflow-hidden no-print">
            <div className="card-pro-header p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
              <div>
                <strong className="text-dark small text-uppercase">Padrón de Contribuyentes del Sistema</strong>
                <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                  Gestión y registro de usuarios registrados
                </small>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light text-uppercase" style={{ fontSize: '0.72rem' }}>
                  <tr>
                    <th>Contribuyente</th>
                    <th>Documento (CI / NIT)</th>
                    <th>Empresa</th>
                    <th>Cargo</th>
                    <th>Tipo</th>
                    <th>Fecha Registro</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {datosMatriz.map((item) => (
                    <tr key={item.usuario.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                            style={{ width: 32, height: 32, backgroundColor: item.usuario.avatarColor || '#2563eb' }}
                          >
                            {item.usuario.nombre.charAt(0)}
                          </div>
                          <div>
                            <strong className="d-block text-dark">{item.usuario.nombre}</strong>
                            <small className="text-muted">{item.usuario.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{item.usuario.documento}</span>
                      </td>
                      <td>{item.usuario.empresa}</td>
                      <td>{item.usuario.cargo}</td>
                      <td>
                        <span className={`badge ${item.usuario.tipoCuenta === 'Administrador' ? 'bg-danger text-white' : 'bg-primary bg-opacity-10 text-primary'}`}>
                          {item.usuario.tipoCuenta}
                        </span>
                      </td>
                      <td className="text-muted">
                        {new Date(item.usuario.fechaRegistro).toLocaleDateString('es-BO')}
                      </td>
                      <td className="text-center">
                        {item.usuario.id !== 'user-admin' ? (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm py-1 px-2 rounded-2"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => handleEliminarContribuyente(item.usuario.id, item.usuario.nombre)}
                            title="Eliminar contribuyente"
                          >
                            Eliminar 🗑️
                          </button>
                        ) : (
                          <span className="badge bg-light text-muted border">Protegido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: PARÁMETROS NORMATIVOS GLOBALES
           ======================================================== */}
        {tab === 'normativa' && (
          <div className="row justify-content-center no-print">
            <div className="col-lg-8">
              <div className="card-pro bg-white p-4">
                <div className="d-flex align-items-center gap-2 mb-3 pb-3 border-bottom">
                  <span className="fs-4">⚖️</span>
                  <div>
                    <h5 className="fw-bold text-dark mb-0">Parámetros Normativos Globales del Sistema</h5>
                    <small className="text-muted">
                      Configuración de alícuotas y políticas impositivas sin aplicación de Salario Mínimo Nacional
                    </small>
                  </div>
                </div>

                {normativaGuardada && (
                  <div className="alert alert-success py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                    <span>✅</span>
                    <span>Parámetros normativos actualizados correctamente en el sistema.</span>
                  </div>
                )}

                <form onSubmit={handleGuardarNormativa}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Alícuota Aportes Laborales Ley (%):
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="form-control form-control-pro"
                          value={normativaConfig.alicuotaAportesLaboralesPct}
                          onChange={(e) =>
                            setNormativaConfig({ ...normativaConfig, alicuotaAportesLaboralesPct: parseFloat(e.target.value) || 0 })
                          }
                          required
                        />
                        <span className="input-group-text">%</span>
                      </div>
                      <small className="text-muted">Ley de Pensiones (def: 12.71% Gestora Pública)</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Alícuota Impuesto RC-IVA (%):
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="form-control form-control-pro"
                          value={normativaConfig.alicuotaImpuestoPct}
                          onChange={(e) =>
                            setNormativaConfig({ ...normativaConfig, alicuotaImpuestoPct: parseFloat(e.target.value) || 0 })
                          }
                          required
                        />
                        <span className="input-group-text">%</span>
                      </div>
                      <small className="text-muted">Alícuota impositiva sobre la base imponible (def: 13.00%)</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Tasa Crédito Fiscal Facturas (%):
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="form-control form-control-pro"
                          value={normativaConfig.alicuotaFacturasPct}
                          onChange={(e) =>
                            setNormativaConfig({ ...normativaConfig, alicuotaFacturasPct: parseFloat(e.target.value) || 0 })
                          }
                          required
                        />
                        <span className="input-group-text">%</span>
                      </div>
                      <small className="text-muted">Porcentaje acreditable sobre facturas declaradas (def: 13.00%)</small>
                    </div>


                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm rounded-3"
                      onClick={() => setNormativaConfig(DEFAULT_TAX_CONFIG)}
                    >
                      Restablecer Parámetros Oficiales (12.71% / 13%)
                    </button>
                    <button type="submit" className="btn btn-danger btn-sm px-4 fw-bold rounded-3 shadow-sm">
                      Guardar Normativa Global
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: SIMULADOR FISCAL DE PRUEBAS DEL ADMINISTRADOR
           ======================================================== */}
        {tab === 'simulador' && (
          <div className="row g-3 no-print">
            <div className="col-lg-5">
              <div className="card-pro bg-white p-4">
                <h6 className="fw-bold text-dark small text-uppercase mb-3">
                  Parámetros de Simulación Fiscal
                </h6>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark mb-1">
                    Sueldo Bruto de Prueba:
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">Bs.</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      className="form-control form-control-pro fw-bold"
                      value={simSueldoBruto}
                      onChange={(e) => setSimSueldoBruto(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark mb-1">
                    Total Facturas Declaradas:
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">Bs.</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      className="form-control form-control-pro"
                      value={simFacturas}
                      onChange={(e) => setSimFacturas(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark mb-1">
                    Saldo a Favor Período Anterior:
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">Bs.</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      className="form-control form-control-pro"
                      value={simSaldoAnterior}
                      onChange={(e) => setSimSaldoAnterior(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="p-3 bg-light rounded-3 border small">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Sueldo Neto (menos 12.71%):</span>
                    <strong>{formatMoneda(simResultado.sueldoNeto)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Impuesto Determinado (13%):</span>
                    <strong>{formatMoneda(simResultado.impuestoDeterminado)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Crédito Facturas (13%):</span>
                    <strong>{formatMoneda(simResultado.creditoFacturas)}</strong>
                  </div>
                  <div className="d-flex justify-content-between pt-1 border-top fw-bold">
                    <span>Total a Retener / Pagar:</span>
                    <span className={simResultado.totalPagar > 0 ? 'text-danger' : 'text-success'}>
                      {formatMoneda(simResultado.totalPagar)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <InformeTributario
                contribuyente={{
                  nombre: 'Simulación Oficial de Auditoría',
                  documento: 'AUD-0001-TEST',
                  periodo: new Date().toISOString().slice(0, 7),
                  empresa: 'Servicio de Impuestos Nacionales',
                  cargo: 'Prueba Técnica del Administrador',
                }}
                resultado={simResultado}
                config={normativaConfig}
                facturas={[]}
                onPrint={() => window.print()}
              />
            </div>
          </div>
        )}

        {/* MODAL PARA INSPECCIONAR INFORME OFICIAL F-110 DEL CONTRIBUYENTE */}
        {inspeccionUsuario && (
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content shadow-2xl border-0 rounded-4 overflow-hidden">
                <div className="modal-header bg-dark text-white p-3 border-0" style={{ background: 'linear-gradient(135deg, #450a0a 0%, #0f172a 100%)' }}>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-5">📑</span>
                    <div>
                      <h6 className="modal-title fw-bold mb-0 text-white">
                        Inspección de Certificado F-110: {inspeccionUsuario.usuario.nombre}
                      </h6>
                      <small className="text-secondary" style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                        Doc: {inspeccionUsuario.usuario.documento} • {inspeccionUsuario.usuario.empresa}
                      </small>
                    </div>
                  </div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setInspeccionUsuario(null)} aria-label="Cerrar"></button>
                </div>

                <div className="modal-body p-4 bg-light">
                  <InformeTributario
                    contribuyente={{
                      nombre: inspeccionUsuario.usuario.nombre,
                      documento: inspeccionUsuario.usuario.documento,
                      periodo: inspeccionUsuario.taxData.periodo || '2026-11',
                      empresa: inspeccionUsuario.usuario.empresa,
                      cargo: inspeccionUsuario.usuario.cargo,
                    }}
                    resultado={inspeccionUsuario.taxResult}
                    config={inspeccionUsuario.taxData.config || DEFAULT_TAX_CONFIG}
                    facturas={inspeccionUsuario.taxData.facturas || []}
                    onPrint={() => window.print()}
                  />
                </div>

                <div className="modal-footer bg-white p-3 border-top d-flex justify-content-between">
                  <small className="text-muted">
                    Certificación de auditoría tributaria con validez legal.
                  </small>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm px-3 rounded-3"
                      onClick={() => setInspeccionUsuario(null)}
                    >
                      Cerrar Inspección
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm px-3 fw-bold rounded-3 shadow-sm"
                      onClick={() => window.print()}
                    >
                      🖨️ Imprimir Certificado
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER ADMINISTRADOR */}
      <footer className="bg-white border-top py-2 px-3 no-print mt-auto">
        <div className="container-fluid px-0">
          <div className="d-flex flex-wrap justify-content-between align-items-center text-muted small" style={{ fontSize: '0.78rem' }}>
            <span>
              <strong>Consola Central de Administración Tributaria</strong> • Sesión de: <strong>{usuario.nombre}</strong> ({usuario.email})
            </span>
            <span>
              Bolivia 2026 • Codificación UTF-8 • Modelo Normativo con SMN
            </span>
          </div>
        </div>
      </footer>
    </div>
  </div>
  );
};
