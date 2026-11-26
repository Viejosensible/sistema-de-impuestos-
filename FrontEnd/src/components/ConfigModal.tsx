import React, { useState } from 'react';
import { DEFAULT_TAX_CONFIG, type TaxConfig } from '../services/taxCalculator';

interface ConfigModalProps {
  show: boolean;
  config: TaxConfig;
  onSave: (nuevaConfig: TaxConfig) => void;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  show,
  config,
  onSave,
  onClose,
}) => {
  const [localConfig, setLocalConfig] = useState<TaxConfig>(config);

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localConfig);
    onClose();
  };

  const handleRestablecer = () => {
    setLocalConfig(DEFAULT_TAX_CONFIG);
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className="modal-header bg-dark text-white rounded-top-4">
            <h5 className="modal-title fw-bold">⚙️ Configuración de Alícuotas y Deducciones</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Cerrar"></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="alert alert-info py-2 small mb-3">
                <strong>Planilla Salarial RC-IVA:</strong> Los porcentajes y el Salario Mínimo Nacional (SMN) son configurables según la normativa vigente.
              </div>

              {/* Aportes Laborales */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark d-flex justify-content-between">
                  <span>Alícuota Aportes Laborales de Ley (%):</span>
                  <span className="badge bg-primary">{localConfig.alicuotaAportesLaboralesPct}%</span>
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="form-control"
                    value={localConfig.alicuotaAportesLaboralesPct}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        alicuotaAportesLaboralesPct: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                  <span className="input-group-text">%</span>
                </div>
                <small className="text-muted">Por defecto en Bolivia: 12.71% (SIP/AFP/Gestora).</small>
              </div>

              {/* Salario Mínimo Nacional (SMN) */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark d-flex justify-content-between">
                  <span>Salario Mínimo Nacional - SMN (Bs.):</span>
                  <span className="badge bg-secondary">2 SMN = Bs. {(localConfig.smn * 2).toFixed(2)}</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text">Bs.</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className="form-control"
                    value={localConfig.smn}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        smn: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    placeholder="3300.00"
                    required
                  />
                </div>
                <small className="text-muted">
                  Se deducen 2 SMN del sueldo neto y se aplica el 13% de 2 SMN como crédito automático.
                </small>
              </div>

              {/* Alícuota de Impuesto */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark d-flex justify-content-between">
                  <span>Alícuota del Impuesto (%):</span>
                  <span className="badge bg-success">{localConfig.alicuotaImpuestoPct}%</span>
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="form-control"
                    value={localConfig.alicuotaImpuestoPct}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        alicuotaImpuestoPct: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                  <span className="input-group-text">%</span>
                </div>
                <small className="text-muted">Tasa oficial de aplicación sobre la base imponible (por defecto 13.00%).</small>
              </div>

              {/* Alícuota Crédito por Facturas */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark d-flex justify-content-between">
                  <span>Porcentaje Crédito Fiscal Facturas (%):</span>
                  <span className="badge bg-info text-dark">{localConfig.alicuotaFacturasPct}%</span>
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="form-control"
                    value={localConfig.alicuotaFacturasPct}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        alicuotaFacturasPct: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                  <span className="input-group-text">%</span>
                </div>
                <small className="text-muted">Crédito fiscal deducible sobre el total de facturas (por defecto 13.00%).</small>
              </div>
            </div>

            <div className="modal-footer bg-light rounded-bottom-4 d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleRestablecer}
              >
                Restablecer Valores por Defecto
              </button>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Aplicar Cambios
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
