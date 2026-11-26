import React, { useState } from 'react';
import { formatMoneda, type FacturaItem } from '../services/taxCalculator';

interface ModalFacturasProps {
  show: boolean;
  facturas: FacturaItem[];
  tasaFacturasPct: number;
  onClose: () => void;
  onUpdateFacturas: (nuevasFacturas: FacturaItem[]) => void;
}

export const ModalFacturas: React.FC<ModalFacturasProps> = ({
  show,
  facturas,
  tasaFacturasPct,
  onClose,
  onUpdateFacturas,
}) => {
  const [numero, setNumero] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [fecha] = useState(new Date().toISOString().slice(0, 10));
  const [monto, setMonto] = useState('');
  const [concepto] = useState('Consumo General');

  if (!show) return null;

  const totalFacturas = facturas.reduce((acc, f) => acc + (Number(f.monto) || 0), 0);
  const totalCredito = totalFacturas * (tasaFacturasPct / 100);

  const handleAgregar = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      alert('Ingresa un monto válido superior a cero.');
      return;
    }

    const nueva: FacturaItem = {
      id: 'fac-' + Date.now(),
      numero: numero.trim() || `F-${Math.floor(1000 + Math.random() * 9000)}`,
      proveedor: proveedor.trim() || 'Comercio Local',
      fecha,
      monto: montoNum,
      concepto,
    };

    onUpdateFacturas([...facturas, nueva]);
    setNumero('');
    setProveedor('');
    setMonto('');
  };

  const handleEliminar = (id: string) => {
    onUpdateFacturas(facturas.filter((f) => f.id !== id));
  };

  const handleCargarEjemplos = () => {
    const ejemplos: FacturaItem[] = [
      { id: 'f1', numero: 'F-8910', proveedor: 'Hipermaxi S.A.', fecha: '2026-11-04', monto: 2500, concepto: 'Alimentación' },
      { id: 'f2', numero: 'F-4412', proveedor: 'Farmacias Bolivia', fecha: '2026-11-12', monto: 1200, concepto: 'Salud y Farmacia' },
      { id: 'f3', numero: 'F-9023', proveedor: 'Equipos y Computación', fecha: '2026-11-20', monto: 4500, concepto: 'Tecnología' },
    ];
    onUpdateFacturas(ejemplos);
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-xl border-0 rounded-4 overflow-hidden">
          {/* Header del Modal */}
          <div className="modal-header bg-dark text-white p-3 border-0" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary bg-opacity-25 text-white p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                <span>🧾</span>
              </div>
              <div>
                <h6 className="modal-title fw-bold mb-0 text-white">Gestor Detallado de Facturas (Formulario 110)</h6>
                <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                  Descargo de compras para crédito fiscal ({tasaFacturasPct}% directo)
                </small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Cerrar"></button>
          </div>

          <div className="modal-body p-4 bg-white">
            {/* Formulario de Registro Rápido */}
            <form onSubmit={handleAgregar} className="p-3 bg-light rounded-3 border mb-3">
              <strong className="d-block text-dark small text-uppercase mb-2">➕ Añadir Nueva Factura:</strong>
              <div className="row g-2">
                <div className="col-md-3 col-6">
                  <label className="form-label small fw-semibold text-muted mb-1">N° Factura:</label>
                  <input
                    type="text"
                    className="form-control form-control-pro form-control-sm"
                    placeholder="Ej: F-1029"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                </div>
                <div className="col-md-4 col-6">
                  <label className="form-label small fw-semibold text-muted mb-1">Razón Social / Proveedor:</label>
                  <input
                    type="text"
                    className="form-control form-control-pro form-control-sm"
                    placeholder="Ej: Supermercado Ketal"
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-3 col-6">
                  <label className="form-label small fw-semibold text-muted mb-1">Importe (Bs.):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control form-control-pro form-control-sm fw-bold num-tabular"
                    placeholder="0.00"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-2 col-6 d-flex align-items-end">
                  <button type="submit" className="btn btn-primary btn-sm w-100 fw-bold rounded-3">
                    + Agregar
                  </button>
                </div>
              </div>
            </form>

            {/* Acciones y Lista de Facturas */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-dark small text-uppercase">
                Comprobantes Registrados ({facturas.length}):
              </span>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-primary btn-sm rounded-3 py-1" onClick={handleCargarEjemplos}>
                  📥 Cargar 3 de Prueba
                </button>
                {facturas.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm rounded-3 py-1"
                    onClick={() => {
                      if (window.confirm('¿Borrar todas las facturas?')) onUpdateFacturas([]);
                    }}
                  >
                    🗑️ Borrar Todas
                  </button>
                )}
              </div>
            </div>

            {facturas.length === 0 ? (
              <div className="text-center py-4 bg-light rounded-3 border text-muted">
                <p className="mb-1 small">No hay facturas desglosadas aún.</p>
                <small>Puedes ingresar una arriba o presionar "Cargar 3 de Prueba".</small>
              </div>
            ) : (
              <div className="table-responsive border rounded-3">
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th>#</th>
                      <th>N° Factura</th>
                      <th>Proveedor</th>
                      <th className="text-end">Importe (Bs.)</th>
                      <th className="text-end">Crédito 13%</th>
                      <th className="text-center">Quitar</th>
                    </tr>
                  </thead>
                  <tbody className="small">
                    {facturas.map((f, idx) => (
                      <tr key={f.id}>
                        <td>{idx + 1}</td>
                        <td className="fw-bold">{f.numero}</td>
                        <td>{f.proveedor}</td>
                        <td className="text-end fw-semibold num-tabular">{formatMoneda(f.monto, false)}</td>
                        <td className="text-end text-success fw-bold num-tabular">
                          {formatMoneda(f.monto * (tasaFacturasPct / 100), false)}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-0 px-2 rounded-circle"
                            onClick={() => handleEliminar(f.id)}
                            title="Eliminar factura"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light fw-bold small">
                    <tr>
                      <td colSpan={3} className="text-end">TOTALES:</td>
                      <td className="text-end text-dark num-tabular">{formatMoneda(totalFacturas)}</td>
                      <td className="text-end text-success num-tabular">{formatMoneda(totalCredito)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="modal-footer bg-light p-3 border-top d-flex justify-content-between align-items-center">
            <div>
              <span className="text-muted small me-2">Total Computable:</span>
              <strong className="text-primary fs-6 num-tabular">{formatMoneda(totalFacturas)}</strong>
              <span className="badge bg-success ms-2">Crédito: {formatMoneda(totalCredito)}</span>
            </div>
            <button type="button" className="btn btn-primary fw-bold rounded-3 px-4 shadow-sm" onClick={onClose}>
              Aplicar y Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
