import React, { useState } from 'react';
import { formatMoneda, type FacturaItem } from '../services/taxCalculator';

interface GestorFacturasProps {
  facturas: FacturaItem[];
  tasaFacturasPct: number;
  onUpdateFacturas: (nuevasFacturas: FacturaItem[]) => void;
  onIrAInforme: () => void;
}

export const GestorFacturas: React.FC<GestorFacturasProps> = ({
  facturas,
  tasaFacturasPct,
  onUpdateFacturas,
  onIrAInforme,
}) => {
  const [numero, setNumero] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [monto, setMonto] = useState<string>('');
  const [concepto, setConcepto] = useState('Consumo General');

  const totalFacturas = facturas.reduce((acc, f) => acc + (Number(f.monto) || 0), 0);
  const totalCredito = totalFacturas * (tasaFacturasPct / 100);

  const handleAgregarFactura = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      alert('Por favor ingrese un monto válido superior a cero.');
      return;
    }

    const nuevaFactura: FacturaItem = {
      id: 'fac-' + Date.now(),
      numero: numero.trim() || `F-${Math.floor(1000 + Math.random() * 9000)}`,
      proveedor: proveedor.trim() || 'Comercio Local',
      fecha,
      monto: montoNum,
      concepto: concepto.trim(),
    };

    onUpdateFacturas([...facturas, nuevaFactura]);
    setNumero('');
    setProveedor('');
    setMonto('');
  };

  const handleEliminar = (id: string) => {
    onUpdateFacturas(facturas.filter((f) => f.id !== id));
  };

  const handleLimpiarTodas = () => {
    if (window.confirm('¿Está seguro de eliminar todas las facturas registradas?')) {
      onUpdateFacturas([]);
    }
  };

  const handleCargarEjemplos = () => {
    const ejemplos: FacturaItem[] = [
      { id: 'f-1', numero: 'FAC-8091', proveedor: 'Hipermaxi S.A.', fecha: '2026-11-05', monto: 2450.0, concepto: 'Alimentación familiar' },
      { id: 'f-2', numero: 'FAC-1234', proveedor: 'Farmacias Chávez S.A.', fecha: '2026-11-10', monto: 890.5, concepto: 'Medicamentos' },
      { id: 'f-3', numero: 'FAC-9912', proveedor: 'CRE / Delapaz Servicios Básicos', fecha: '2026-11-15', monto: 620.0, concepto: 'Energía eléctrica' },
      { id: 'f-4', numero: 'FAC-5520', proveedor: 'CompuMundo Bolivia', fecha: '2026-11-22', monto: 3800.0, concepto: 'Material tecnológico de trabajo' },
    ];
    onUpdateFacturas(ejemplos);
  };

  return (
    <div className="container py-4">
      {/* Encabezado del Gestor */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 bg-white p-3 rounded-3 shadow-sm border">
        <div>
          <h4 className="fw-bold text-dark mb-1">🧾 Gestor de Facturas para Crédito Fiscal</h4>
          <p className="text-muted small mb-0">
            Descargo de compras para compensación del impuesto ({tasaFacturasPct}% de crédito directo computable).
          </p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleCargarEjemplos}>
            📥 Cargar Facturas de Ejemplo
          </button>
          {facturas.length > 0 && (
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleLimpiarTodas}>
              🗑️ Limpiar Facturas
            </button>
          )}
          <button type="button" className="btn btn-success btn-sm" onClick={onIrAInforme}>
            Ver en Informe Oficial 📑
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Formulario de Registro de Facturas */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-3 bg-white">
            <div className="card-header bg-primary text-white fw-bold py-3">
              ➕ Registrar Nueva Factura
            </div>
            <div className="card-body p-3">
              <form onSubmit={handleAgregarFactura}>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">N° de Factura / Autorización:</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ej: FAC-4892"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label small fw-semibold">Proveedor / Razón Social:</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ej: Farmacias Bolivia S.A."
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    required
                  />
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Fecha Emisión:</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Importe (Bs.):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control form-control-sm"
                      placeholder="0.00"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Concepto / Categoría:</label>
                  <select
                    className="form-select form-select-sm"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                  >
                    <option value="Alimentación e Insumos">Alimentación e Insumos</option>
                    <option value="Salud y Farmacia">Salud y Farmacia</option>
                    <option value="Servicios Básicos">Servicios Básicos</option>
                    <option value="Educación y Libros">Educación y Libros</option>
                    <option value="Equipamiento y Tecnología">Equipamiento y Tecnología</option>
                    <option value="Transporte y Combustible">Transporte y Combustible</option>
                    <option value="Consumo General">Consumo General</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary w-100 btn-sm py-2 fw-semibold">
                  Agregar a la Declaración
                </button>
              </form>
            </div>
          </div>

          {/* Tarjetas de Resumen de Facturas */}
          <div className="card shadow-sm border-0 rounded-3 bg-white mt-3">
            <div className="card-body p-3">
              <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Resumen de Crédito Fiscal</h6>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Total Documentos:</span>
                <strong className="text-dark">{facturas.length}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Total Compras Facturadas:</span>
                <strong className="text-dark fs-6">{formatMoneda(totalFacturas)}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2 text-success">
                <span className="small fw-semibold">Crédito Fiscal ({tasaFacturasPct}%):</span>
                <strong className="fs-5">{formatMoneda(totalCredito)}</strong>
              </div>
              <div className="alert alert-light border small mt-3 mb-0 text-secondary">
                ℹ️ Este crédito fiscal se deducirá automáticamente del impuesto determinado en la liquidación mensual.
              </div>
            </div>
          </div>
        </div>

        {/* Listado y Tabla de Facturas */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-3 bg-white">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <span className="fw-bold text-dark">
                Documentos Registrados ({facturas.length})
              </span>
              <span className="badge bg-success fs-6">
                Crédito: {formatMoneda(totalCredito)}
              </span>
            </div>
            <div className="card-body p-0">
              {facturas.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <div className="fs-1 mb-2">📄</div>
                  <h6 className="fw-bold text-dark">No hay facturas registradas</h6>
                  <p className="small mb-3">
                    Agrega facturas con el formulario lateral o carga el paquete de prueba.
                  </p>
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleCargarEjemplos}>
                    Cargar Facturas de Ejemplo
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small text-uppercase">
                      <tr>
                        <th>#</th>
                        <th>N° Factura</th>
                        <th>Proveedor</th>
                        <th>Fecha</th>
                        <th>Categoría</th>
                        <th className="text-end">Importe</th>
                        <th className="text-end">Crédito (13%)</th>
                        <th className="text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="small">
                      {facturas.map((f, idx) => (
                        <tr key={f.id}>
                          <td>{idx + 1}</td>
                          <td className="fw-bold">{f.numero}</td>
                          <td>{f.proveedor}</td>
                          <td className="text-muted">{f.fecha}</td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {f.concepto || 'General'}
                            </span>
                          </td>
                          <td className="text-end fw-semibold">{formatMoneda(f.monto, false)}</td>
                          <td className="text-end text-success fw-bold">
                            {formatMoneda(f.monto * (tasaFacturasPct / 100), false)}
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger p-1"
                              onClick={() => handleEliminar(f.id)}
                              title="Eliminar factura"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-light fw-bold small">
                      <tr>
                        <td colSpan={5} className="text-end">TOTALES:</td>
                        <td className="text-end text-dark">{formatMoneda(totalFacturas)}</td>
                        <td className="text-end text-success">{formatMoneda(totalCredito)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
