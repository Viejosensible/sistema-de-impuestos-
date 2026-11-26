import React from 'react';
import { ESCENARIOS_PRUEBA, type EscenarioPrueba } from '../services/taxCalculator';

interface EscenariosBarProps {
  onSelectEscenario: (escenario: EscenarioPrueba) => void;
  escenarioActivoId: string | null;
}

export const EscenariosBar: React.FC<EscenariosBarProps> = ({
  onSelectEscenario,
  escenarioActivoId,
}) => {
  return (
    <div className="card shadow-sm border-0 mb-4 bg-white">
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary">Datos de Prueba</span>
            <strong className="text-dark small text-uppercase">Escenarios Preconfigurados de Validación:</strong>
          </div>
          <small className="text-muted">Prueba instantánea con 1 solo clic</small>
        </div>

        <div className="row g-2">
          {ESCENARIOS_PRUEBA.map((esc) => {
            const isActive = escenarioActivoId === esc.id;
            return (
              <div key={esc.id} className="col-lg col-md-4 col-sm-6">
                <button
                  type="button"
                  className={`scenario-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectEscenario(esc)}
                  title={esc.descripcion}
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold small text-truncate text-dark">{esc.subtitulo}</span>
                    {isActive && <span className="badge bg-primary rounded-circle p-1">✓</span>}
                  </div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                    Bruto: Bs. {esc.input.sueldoBruto.toLocaleString()} | Fact: Bs. {esc.input.totalFacturas || 0}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
