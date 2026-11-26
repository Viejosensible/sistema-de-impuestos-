import React from 'react';
import { formatMoneda, type TaxCalculationResult } from '../services/taxCalculator';

interface NavbarProps {
  resultado: TaxCalculationResult;
  onOpenConfig: () => void;
  onOpenEscenarios: () => void;
  onPrint: () => void;
  onReset: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  resultado,
  onOpenConfig,
  onOpenEscenarios,
  onPrint,
  onReset,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-dark text-white shadow-sm no-print sticky-top">
      <div className="container-fluid px-4 py-2">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Logo y Título */}
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 10.5a.5.5 0 0 0 .5-.5V4a.5.5 0 0 0-1 0v6a.5.5 0 0 0 .5.5zm3 0a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-1 0v8a.5.5 0 0 0 .5.5zm3 0a.5.5 0 0 0 .5-.5V6a.5.5 0 0 0-1 0v4a.5.5 0 0 0 .5.5z"/>
                <path d="M1.5 0A1.5 1.5 0 0 0 0 1.5v13A1.5 1.5 0 0 0 1.5 16h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 14.5 0h-13zM1 1.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-13z"/>
              </svg>
            </div>
            <div>
              <h5 className="mb-0 fw-bold tracking-tight">Sistema de Liquidación e Informe Tributario</h5>
              <small className="text-secondary d-none d-sm-inline">
                Motor de cálculo RC-IVA en planilla salarial (2 SMN)
              </small>
            </div>
          </div>

          {/* Estado en vivo */}
          <div className="d-none d-lg-flex align-items-center bg-secondary bg-opacity-25 px-3 py-1 rounded-pill border border-secondary border-opacity-50">
            <span className="text-light small me-2">Resultado en vivo:</span>
            <span className={`badge bg-${resultado.statusBadgeVariant} fs-6`}>
              {resultado.totalPagar > 0
                ? `Por Pagar: ${formatMoneda(resultado.totalPagar)}`
                : resultado.statusLabel}
            </span>
          </div>

          {/* Botones de acción globales */}
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-info btn-sm d-flex align-items-center gap-1"
              onClick={onOpenEscenarios}
              title="Cargar escenarios tributarios de prueba"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.5 15a.5.5 0 1 1 0-1h1a.5.5 0 0 1 0 1h-1zm3 0a.5.5 0 1 1 0-1h1a.5.5 0 0 1 0 1h-1zm3 0a.5.5 0 1 1 0-1h1a.5.5 0 0 1 0 1h-1zm3 0a.5.5 0 1 1 0-1h1a.5.5 0 0 1 0 1h-1zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v2H1V3a1 1 0 0 1 1-1h12zM1 6h14v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6z"/>
              </svg>
              <span>Escenarios de Prueba</span>
            </button>

            <button
              type="button"
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
              onClick={onOpenConfig}
              title="Ajustar alícuotas y deducciones"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
              </svg>
              <span>Tasas</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
              onClick={onPrint}
              title="Imprimir informe tributario o guardar como PDF"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
                <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
              </svg>
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={onReset}
              title="Limpiar y restablecer formulario"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Barra de pestañas secundarias */}
        <div className="d-flex flex-wrap gap-2 mt-2 pt-2 border-top border-secondary border-opacity-25">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'calculadora' ? 'btn-light fw-bold text-primary' : 'btn-outline-secondary text-white'}`}
            onClick={() => setActiveTab('calculadora')}
          >
            📊 Calculadora & Liquidación
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'informe' ? 'btn-light fw-bold text-primary' : 'btn-outline-secondary text-white'}`}
            onClick={() => setActiveTab('informe')}
          >
            📑 Informe Tributario Oficial
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'facturas' ? 'btn-light fw-bold text-primary' : 'btn-outline-secondary text-white'}`}
            onClick={() => setActiveTab('facturas')}
          >
            🧾 Gestor de Facturas ({resultado.totalFacturas > 0 ? formatMoneda(resultado.totalFacturas) : '0'})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'historial' ? 'btn-light fw-bold text-primary' : 'btn-outline-secondary text-white'}`}
            onClick={() => setActiveTab('historial')}
          >
            📂 Historial de Declaraciones
          </button>
        </div>
      </div>
    </header>
  );
};
