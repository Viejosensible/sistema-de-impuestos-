import React, { useState } from 'react';
import { formatMoneda, type TaxCalculationResult } from '../services/taxCalculator';
import { type Usuario } from '../services/authService';

interface SidebarProps {
  usuario: Usuario;
  resultado: TaxCalculationResult;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mostrarMenuEjemplos: boolean;
  setMostrarMenuEjemplos: (v: boolean) => void;
  onOpenPerfil: () => void;
  onPrint: () => void;
  onVaciarFormulario: () => void;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { id: 'formulario', icon: '📝', label: 'Formulario', sublabel: 'Rellena tus datos' },
  { id: 'informe',    icon: '📑', label: 'Informe F-110', sublabel: 'Certificado oficial' },
  { id: 'facturas',   icon: '🧾', label: 'Facturas', sublabel: 'Gestor de comprobantes' },
  { id: 'historial',  icon: '📂', label: 'Historial', sublabel: 'Declaraciones pasadas' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  usuario,
  resultado,
  activeTab,
  setActiveTab,
  mostrarMenuEjemplos,
  setMostrarMenuEjemplos,
  onOpenPerfil,
  onPrint,
  onVaciarFormulario,
  onLogout,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sidebar-nav no-print ${collapsed ? 'sidebar-collapsed' : ''}`}
      style={{
        width: collapsed ? 68 : 220,
        minWidth: collapsed ? 68 : 220,
        background: 'linear-gradient(180deg, #0b0f19 0%, #111827 60%, #0f172a 100%)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 1030,
        transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1)',
        overflowX: 'hidden',
        boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* ── LOGO / HEADER ── */}
      <div
        style={{
          padding: collapsed ? '16px 12px' : '16px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 64,
        }}
      >
        <div
          style={{
            width: 36, height: 36, flexShrink: 0,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px rgba(37,99,235,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.82rem', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              SIN Tributario
            </div>
            <div style={{ color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
              RC-IVA • Planilla Salarial
            </div>
          </div>
        )}

        {/* Botón colapsar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            width: 26, height: 26,
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* ── RESULTADO EN VIVO ── */}
      {!collapsed && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Resultado en vivo
          </div>
          <div
            style={{
              background: resultado.totalPagar > 0
                ? 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(185,28,28,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.1) 100%)',
              border: `1px solid ${resultado.totalPagar > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
              borderRadius: 10,
              padding: '8px 10px',
            }}
          >
            <div style={{ color: resultado.totalPagar > 0 ? '#f87171' : '#34d399', fontSize: '0.68rem', fontWeight: 700 }}>
              {resultado.totalPagar > 0 ? '⚠ Por pagar' : '✓ ' + resultado.statusLabel}
            </div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
              {formatMoneda(resultado.totalPagar)}
            </div>
            {resultado.totalPagar === 0 && resultado.saldoSiguiente > 0 && (
              <div style={{ color: '#6ee7b7', fontSize: '0.68rem', fontWeight: 600, marginTop: 2 }}>
                Saldo a favor: {formatMoneda(resultado.saldoSiguiente)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NAVEGACIÓN PRINCIPAL ── */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 6px 4px', marginBottom: 2 }}>
          {!collapsed && 'Navegación'}
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : ''}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '9px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 10,
                border: 'none',
                marginBottom: 2,
                cursor: 'pointer',
                transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
                background: isActive
                  ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                  : 'transparent',
                boxShadow: isActive ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
                color: isActive ? '#fff' : '#94a3b8',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && (
                <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: isActive ? 'rgba(255,255,255,0.65)' : '#475569', whiteSpace: 'nowrap' }}>
                    {item.sublabel}
                  </div>
                </div>
              )}
              {isActive && !collapsed && (
                <div style={{
                  marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                  background: '#fff', flexShrink: 0,
                }} />
              )}
            </button>
          );
        })}

        {/* Separador */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 4px' }} />

        {/* Botón Ejemplos */}
        <button
          onClick={() => setMostrarMenuEjemplos(!mostrarMenuEjemplos)}
          title={collapsed ? 'Ejemplos de Guía' : ''}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '10px 0' : '9px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10,
            border: mostrarMenuEjemplos ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(255,255,255,0.08)',
            marginBottom: 2,
            cursor: 'pointer',
            background: mostrarMenuEjemplos
              ? 'rgba(234,179,8,0.12)'
              : 'rgba(255,255,255,0.03)',
            color: mostrarMenuEjemplos ? '#fbbf24' : '#64748b',
            transition: 'all 0.18s',
          }}
        >
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>📚</span>
          {!collapsed && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, lineHeight: 1.2 }}>
                Ejemplos Guía
              </div>
              <div style={{ fontSize: '0.62rem', color: '#475569' }}>
                {mostrarMenuEjemplos ? 'Ocultar panel' : 'Casos 1 al 5'}
              </div>
            </div>
          )}
        </button>

        {/* Botón Vaciar */}
        <button
          onClick={onVaciarFormulario}
          title={collapsed ? 'Vaciar formulario' : ''}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '10px 0' : '9px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: 2,
            cursor: 'pointer',
            background: 'transparent',
            color: '#64748b',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
        >
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>🧹</span>
          {!collapsed && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.2 }}>Vaciar Formulario</div>
              <div style={{ fontSize: '0.62rem', color: '#475569' }}>Pone todo en 0</div>
            </div>
          )}
        </button>
      </nav>

      {/* ── PERFIL DE USUARIO ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '10px 8px' }}>
        {/* Botón Imprimir */}
        <button
          onClick={onPrint}
          title={collapsed ? 'Imprimir PDF' : ''}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '8px 0' : '8px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10,
            border: 'none',
            marginBottom: 6,
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.78rem',
            transition: 'all 0.18s',
            boxShadow: '0 2px 10px rgba(37,99,235,0.3)',
          }}
        >
          <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>🖨️</span>
          {!collapsed && <span>Imprimir PDF</span>}
        </button>

        {/* Avatar + nombre */}
        <div
          onClick={onOpenPerfil}
          title="Ver mi perfil"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: collapsed ? '8px 0' : '8px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10,
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            marginBottom: 6,
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            backgroundColor: usuario.avatarColor || '#2563eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            {usuario.nombre.charAt(0)}
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {usuario.nombre.split(' ')[0]} {usuario.nombre.split(' ')[1] || ''}
              </div>
              <div style={{ color: '#475569', fontSize: '0.62rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {usuario.email}
              </div>
            </div>
          )}
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={onLogout}
          title={collapsed ? 'Cerrar sesión' : ''}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: collapsed ? '7px 0' : '7px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10,
            border: '1px solid rgba(239,68,68,0.25)',
            cursor: 'pointer',
            background: 'rgba(239,68,68,0.06)',
            color: '#f87171',
            fontWeight: 600,
            fontSize: '0.75rem',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)'; }}
        >
          <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>🚪</span>
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};
