import React from 'react';
import {
  formatMoneda,
  type ContribuyenteInfo,
  type TaxCalculationResult,
  type FacturaItem,
  type TaxConfig,
} from '../services/taxCalculator';

export interface DeclaracionGuardada {
  id: string;
  fechaGuardado: string;
  contribuyente: ContribuyenteInfo;
  resultado: TaxCalculationResult;
  config: TaxConfig;
  facturas: FacturaItem[];
  sueldoBruto: number;
  saldoAnterior: number;
  totalFacturasManual: number;
  usaFacturasDetalladas: boolean;
}

interface HistorialDeclaracionesProps {
  historial: DeclaracionGuardada[];
  onCargarDeclaracion: (decl: DeclaracionGuardada) => void;
  onEliminarDeclaracion: (id: string) => void;
  onLimpiarHistorial: () => void;
  onExportarJSON: () => void;
  onImportarJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const HistorialDeclaraciones: React.FC<HistorialDeclaracionesProps> = ({
  historial,
  onCargarDeclaracion,
  onEliminarDeclaracion,
  onLimpiarHistorial,
  onExportarJSON,
  onImportarJSON,
}) => {
  return (
    <div className="container py-4">
      <div className="card shadow-sm border-0 rounded-3 bg-white">
        <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h5 className="fw-bold mb-0 text-dark">📂 Historial de Declaraciones Tributarias</h5>
            <small className="text-muted">
              Archivo persistente de períodos calculados y liquidados
            </small>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <label className="btn btn-outline-secondary btn-sm mb-0">
              📥 Importar JSON
              <input
                type="file"
                accept=".json"
                className="d-none"
                onChange={onImportarJSON}
              />
            </label>
            {historial.length > 0 && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={onExportarJSON}
                >
                  📤 Exportar Todo en JSON
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={onLimpiarHistorial}
                >
                  🗑️ Borrar Historial
                </button>
              </>
            )}
          </div>
        </div>

        <div className="card-body p-0">
          {historial.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div className="fs-1 mb-2">📁</div>
              <h6 className="fw-bold text-dark">No hay declaraciones archivadas todavía</h6>
              <p className="small mb-0">
                Puedes guardar cualquier cálculo activo haciendo clic en "💾 Guardar en Historial" desde la pestaña de Formulario.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase">
                  <tr>
                    <th>Fecha Guardado</th>
                    <th>Contribuyente</th>
                    <th>Período</th>
                    <th className="text-end">Sueldo Bruto</th>
                    <th className="text-end">Impuesto Det.</th>
                    <th className="text-end">Total a Retener</th>
                    <th>Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {historial.map((item) => (
                    <tr key={item.id}>
                      <td className="text-muted">
                        {new Date(item.fechaGuardado).toLocaleDateString('es-BO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <strong className="text-dark d-block">{item.contribuyente.nombre}</strong>
                        <small className="text-muted">CI: {item.contribuyente.documento}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {item.contribuyente.periodo}
                        </span>
                      </td>
                      <td className="text-end fw-semibold">{formatMoneda(item.sueldoBruto)}</td>
                      <td className="text-end">{formatMoneda(item.resultado.impuestoDeterminado)}</td>
                      <td
                        className={`text-end fw-bold ${
                          item.resultado.totalPagar > 0 ? 'text-danger' : 'text-success'
                        }`}
                      >
                        {formatMoneda(item.resultado.totalPagar)}
                      </td>
                      <td>
                        <span className={`tax-badge tax-badge-${item.resultado.statusBadgeVariant} py-0 px-2 small`}>
                          {item.resultado.statusLabel}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => onCargarDeclaracion(item)}
                            title="Recargar esta declaración en la calculadora"
                          >
                            Recargar 🔄
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => onEliminarDeclaracion(item.id)}
                            title="Eliminar registro"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
