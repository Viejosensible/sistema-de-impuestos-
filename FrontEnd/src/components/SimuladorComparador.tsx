import React, { useState } from 'react';
import { formatMoneda, type TaxCalculationResult, type TaxConfig } from '../services/taxCalculator';

interface SimuladorComparadorProps {
  resultado: TaxCalculationResult;
  config: TaxConfig;
  onAplicarFacturas: (monto: number) => void;
}

export const SimuladorComparador: React.FC<SimuladorComparadorProps> = ({
  resultado,
  config,
  onAplicarFacturas,
}) => {
  const [sliderAdicional, setSliderAdicional] = useState<number>(0);

  // Cuánto de facturas necesita el contribuyente para no pagar nada de impuesto (Impuesto Determinado = Crédito Facturas + Saldo Anterior)
  const deficitImpuesto = Math.max(0, resultado.impuestoDeterminado - resultado.saldoAnterior);
  const facturasNecesariasTotal = deficitImpuesto > 0
    ? deficitImpuesto / (config.alicuotaFacturasPct / 100)
    : 0;

  const facturasFaltantes = Math.max(0, facturasNecesariasTotal - resultado.totalFacturas);

  // Simulación interactiva con el slider adicional
  const nuevoTotalFacturas = resultado.totalFacturas + sliderAdicional;
  const nuevoCreditoFacturas = nuevoTotalFacturas * (config.alicuotaFacturasPct / 100);
  const nuevoCreditoTotal = nuevoCreditoFacturas + resultado.saldoAnterior;
  const nuevoTotalPagar = Math.max(0, resultado.impuestoDeterminado - nuevoCreditoTotal);
  const nuevoSaldoSiguiente = Math.max(0, nuevoCreditoTotal - resultado.impuestoDeterminado);

  return (
    <div className="container py-4">
      <div className="card shadow-sm border-0 rounded-3 bg-white mb-4">
        <div className="card-header bg-primary text-white py-3">
          <h5 className="fw-bold mb-0">💡 Simulador Tributario de Sensibilidad (What-If)</h5>
        </div>
        <div className="card-body p-4">
          <p className="text-secondary">
            Este módulo calcula de forma automática la cantidad exacta de facturas requeridas para neutralizar la retención tributaria y proyecta el impacto de compras adicionales.
          </p>

          <div className="row g-4 mt-2">
            {/* META: NO PAGAR IMPUESTO */}
            <div className="col-lg-6">
              <div className="p-4 rounded-3 border bg-light h-100">
                <span className="badge bg-success mb-2">Meta: Impuesto a Pagar Bs. 0.00</span>
                <h5 className="fw-bold text-dark">Facturas Requeridas para Neutralizar</h5>

                {resultado.totalPagar === 0 ? (
                  <div className="alert alert-success mt-3 mb-0">
                    🎉 <strong>¡Felicitaciones!</strong> En este período tu total a pagar ya es de <strong>Bs. 0.00</strong>.
                    {resultado.saldoSiguiente > 0 && (
                      <span className="d-block mt-1">
                        Cuentas con un saldo a favor excedente de <strong>{formatMoneda(resultado.saldoSiguiente)}</strong> para el siguiente período.
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="my-3">
                      <span className="text-muted small d-block">Monto en facturas que necesitas presentar:</span>
                      <h2 className="text-primary fw-bold mb-0">{formatMoneda(facturasNecesariasTotal)}</h2>
                      <span className="text-secondary small">
                        Equivalente al {config.alicuotaFacturasPct}% de crédito fiscal ({formatMoneda(deficitImpuesto)}).
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-3 border mb-3">
                      <div className="d-flex justify-content-between mb-1 small">
                        <span>Facturas ya declaradas:</span>
                        <strong>{formatMoneda(resultado.totalFacturas)}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1 small text-danger">
                        <span>Facturas adicionales faltantes:</span>
                        <strong>+{formatMoneda(facturasFaltantes)}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary w-100 fw-semibold"
                      onClick={() => onAplicarFacturas(Math.ceil(facturasNecesariasTotal))}
                    >
                      Aplicar Automáticamente {formatMoneda(Math.ceil(facturasNecesariasTotal))} en Facturas
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SIMULADOR INTERACTIVO CON SLIDER */}
            <div className="col-lg-6">
              <div className="p-4 rounded-3 border bg-light h-100">
                <span className="badge bg-info text-dark mb-2">Proyección Interactiva</span>
                <h5 className="fw-bold text-dark">¿Qué pasaría si presento más facturas?</h5>

                <div className="my-3">
                  <label className="form-label d-flex justify-content-between small fw-semibold text-dark">
                    <span>Monto adicional simulado:</span>
                    <span className="text-primary fs-6">+{formatMoneda(sliderAdicional)}</span>
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    min="0"
                    max={Math.max(10000, Math.ceil(facturasNecesariasTotal * 1.5))}
                    step="100"
                    value={sliderAdicional}
                    onChange={(e) => setSliderAdicional(parseFloat(e.target.value) || 0)}
                  />
                  <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                    <span>Bs. 0.00</span>
                    <span>+{formatMoneda(Math.max(10000, Math.ceil(facturasNecesariasTotal * 1.5)))}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-3 border">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small text-muted">Nuevo Total Facturas:</span>
                    <strong className="text-dark">{formatMoneda(nuevoTotalFacturas)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small text-muted">Nuevo Crédito Fiscal (13%):</span>
                    <strong className="text-success">{formatMoneda(nuevoCreditoFacturas)}</strong>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between mb-1">
                    <span className="small fw-bold">Nuevo Total a Retener / Pagar:</span>
                    <strong className={`fs-5 ${nuevoTotalPagar > 0 ? 'text-danger' : 'text-success'}`}>
                      {formatMoneda(nuevoTotalPagar)}
                    </strong>
                  </div>
                  {nuevoSaldoSiguiente > 0 && (
                    <div className="d-flex justify-content-between text-success small">
                      <span>Nuevo Saldo a Favor Mes Siguiente:</span>
                      <strong>{formatMoneda(nuevoSaldoSiguiente)}</strong>
                    </div>
                  )}
                </div>

                {sliderAdicional > 0 && (
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100 btn-sm mt-3"
                    onClick={() => {
                      onAplicarFacturas(nuevoTotalFacturas);
                      setSliderAdicional(0);
                    }}
                  >
                    Fijar este total ({formatMoneda(nuevoTotalFacturas)}) en la calculadora
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
