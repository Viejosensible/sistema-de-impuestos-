import React, { useState } from 'react';
import {
  ESCENARIOS_PRUEBA,
  formatMoneda,
  calcularImpuesto,
  type EscenarioPrueba,
} from '../services/taxCalculator';

interface MenuEjemplosProps {
  onCargarEjemplo: (escenario: EscenarioPrueba, salirDespues?: boolean) => void;
  onVaciarFormulario: () => void;
  onSalir: () => void;
  ejemploSeleccionadoId: string | null;
}

export const MenuEjemplos: React.FC<MenuEjemplosProps> = ({
  onCargarEjemplo,
  onVaciarFormulario,
  onSalir,
  ejemploSeleccionadoId,
}) => {
  // Guarda cuál ejemplo está abierto en detalle (para entrar y salir de cada ejemplo)
  const [ejemploDetalleId, setEjemploDetalleId] = useState<string | null>(ejemploSeleccionadoId || 'retencion-directa');

  const getBadgeIcon = (id: string) => {
    switch (id) {
      case 'retencion-directa': return '🔴';
      case 'compensado-facturas': return '🟢';
      case 'compensado-saldo-anterior': return '🟡';
      case 'compensado-mixto': return '🟣';
      case 'base-cero-exento': return '⚪';
      default: return '📄';
    }
  };

  return (
    <div
      className="card-pro h-100 shadow-xl no-print d-flex flex-column"
      style={{
        borderLeft: '4px solid #2563eb',
        background: '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Cabecera del Menú con botón visible de SALIR */}
      <div
        className="card-pro-header p-3 d-flex justify-content-between align-items-center text-white"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}
      >
        <div className="d-flex align-items-center gap-2">
          <div className="bg-primary bg-opacity-25 text-white p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
            <span className="fs-6">📚</span>
          </div>
          <div>
            <h6 className="fw-bold mb-0 text-white">Menú de Ejemplos de Guía</h6>
            <small className="text-secondary" style={{ fontSize: '0.75rem', color: '#93c5fd' }}>
              Casos del 1 al 5 para orientarte
            </small>
          </div>
        </div>

        {/* BOTÓN SALIR DEL MENÚ */}
        <button
          type="button"
          className="btn btn-sm btn-outline-light d-flex align-items-center gap-1 rounded-pill px-3 py-1 fw-bold"
          onClick={onSalir}
          title="Salir del menú de ejemplos y volver a mi formulario"
          style={{ fontSize: '0.78rem', borderColor: 'rgba(255,255,255,0.3)' }}
        >
          <span>✕</span>
          <span>Salir</span>
        </button>
      </div>

      <div className="p-3 overflow-auto flex-grow-1" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {/* Banner de orientación */}
        <div className="alert alert-primary bg-opacity-10 border-primary border-opacity-25 p-2 rounded-3 mb-3 small d-flex align-items-start justify-content-between gap-2">
          <div className="d-flex align-items-start gap-2">
            <span className="fs-6">💡</span>
            <div style={{ fontSize: '0.78rem', lineHeight: 1.4 }}>
              Selecciona un ejemplo para <strong>entrar a ver su desglose</strong>. Si quieres usarlo, presiona <strong>"Cargar y Salir"</strong>.
            </div>
          </div>
          <button
            type="button"
            className="btn-close btn-close-sm"
            onClick={onSalir}
            title="Salir"
            aria-label="Salir"
          ></button>
        </div>

        {/* Botón para vaciar y dejar en blanco */}
        <div className="mb-3">
          <button
            type="button"
            className="btn btn-outline-danger btn-sm w-100 rounded-3 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
            onClick={onVaciarFormulario}
            title="Poner todos los montos en 0 para rellenar en blanco"
          >
            <span>🧹</span>
            <span>Dejar mi Formulario Vacío (En blanco)</span>
          </button>
        </div>

        <span className="text-muted small text-uppercase fw-bold d-block mb-2" style={{ fontSize: '0.72rem' }}>
          Toca cualquier caso para entrar / salir de su detalle:
        </span>

        {/* Lista de Ejemplos 1 al 5 */}
        <div className="d-flex flex-column gap-2">
          {ESCENARIOS_PRUEBA.map((esc, index) => {
            const isActivo = ejemploSeleccionadoId === esc.id;
            const isAbierto = ejemploDetalleId === esc.id;
            const resCalculo = calcularImpuesto(esc.input);

            return (
              <div
                key={esc.id}
                className={`p-3 rounded-3 border transition-all ${
                  isActivo
                    ? 'border-primary bg-primary bg-opacity-10 shadow-sm'
                    : 'border-light bg-white hover-shadow'
                }`}
                style={{
                  cursor: 'pointer',
                  borderWidth: isActivo ? '2px' : '1px',
                  borderColor: isActivo ? '#2563eb' : '#e2e8f0',
                }}
                onClick={() => setEjemploDetalleId(isAbierto ? null : esc.id)}
              >
                {/* Cabecera del Ejemplo */}
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-6">{getBadgeIcon(esc.id)}</span>
                    <div>
                      <strong className="d-block text-dark small" style={{ fontSize: '0.82rem' }}>
                        Opción {index + 1}: {esc.subtitulo}
                      </strong>
                      <span className="text-secondary small d-block" style={{ fontSize: '0.72rem' }}>
                        {esc.titulo}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-1">
                    <span className="badge bg-light text-secondary border small" style={{ fontSize: '0.68rem' }}>
                      {isAbierto ? '▲ Salir detalle' : '▼ Entrar detalle'}
                    </span>
                  </div>
                </div>

                {/* Resumen rápido visible */}
                <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-light text-muted small" style={{ fontSize: '0.75rem' }}>
                  <span>Bruto: <strong>{formatMoneda(esc.input.sueldoBruto)}</strong></span>
                  <span>
                    Resultado:{' '}
                    <strong className={resCalculo.totalPagar > 0 ? 'text-danger' : 'text-success'}>
                      {resCalculo.totalPagar > 0 ? formatMoneda(resCalculo.totalPagar) : 'Bs. 0.00'}
                    </strong>
                  </span>
                </div>

                {/* DETALLE EXPANDIDO: ENTRAR A VER EL EJEMPLO COMPLETO */}
                {isAbierto && (
                  <div className="mt-3 pt-2 border-top border-secondary border-opacity-25 small" onClick={(e) => e.stopPropagation()}>
                    <p className="text-secondary mb-2" style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                      <strong>¿Cómo funciona este caso?</strong> {esc.descripcion}
                    </p>

                    <div className="p-2 bg-light rounded-3 border mb-3" style={{ fontSize: '0.73rem' }}>
                      <div className="d-flex justify-content-between mb-1">
                        <span>• Sueldo Neto (después de 12.71%):</span>
                        <strong>{formatMoneda(resCalculo.sueldoNeto)}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span>• Impuesto Determinado (13%):</span>
                        <strong>{formatMoneda(resCalculo.impuestoDeterminado)}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span>• Facturas Computables:</span>
                        <strong>{formatMoneda(resCalculo.totalFacturas)} ({formatMoneda(resCalculo.creditoFacturas)})</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span>• Saldo Mes Anterior:</span>
                        <strong>{formatMoneda(resCalculo.saldoAnterior)}</strong>
                      </div>
                      <div className="d-flex justify-content-between pt-1 border-top fw-bold text-dark">
                        <span>• Estado Final:</span>
                        <span className={`text-${resCalculo.statusBadgeVariant}`}>
                          {resCalculo.statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* BOTONES DE ACCIÓN PARA ESTE EJEMPLO */}
                    <div className="d-flex flex-column gap-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm w-100 rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                        style={{ fontSize: '0.78rem' }}
                        onClick={() => onCargarEjemplo(esc, true)}
                        title="Carga los datos de este ejemplo en tu formulario y cierra el menú para ver tu informe"
                      >
                        <span>📥</span>
                        <span>Cargar este Ejemplo y Salir</span>
                      </button>

                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm flex-grow-1 rounded-3 py-1"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => onCargarEjemplo(esc, false)}
                          title="Carga los datos pero mantiene abierto este menú"
                        >
                          Solo Cargar (Seguir viendo)
                        </button>
                        <button
                          type="button"
                          className="btn btn-light btn-sm rounded-3 py-1 border text-muted"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => setEjemploDetalleId(null)}
                          title="Salir del detalle de este ejemplo"
                        >
                          Cerrar detalle ▲
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pie del menú con botón grande de SALIR */}
      <div className="p-3 bg-light border-top d-flex justify-content-between align-items-center">
        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
          ¿Terminaste de consultar?
        </small>
        <button
          type="button"
          className="btn btn-outline-dark btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm"
          onClick={onSalir}
        >
          <span>← Salir del Menú</span>
        </button>
      </div>
    </div>
  );
};
