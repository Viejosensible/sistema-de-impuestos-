import React from 'react';
import {
  formatMoneda,
  type ContribuyenteInfo,
  type TaxCalculationResult,
  type TaxConfig,
} from '../services/taxCalculator';

interface CalculadoraTabProps {
  contribuyente: ContribuyenteInfo;
  setContribuyente: React.Dispatch<React.SetStateAction<ContribuyenteInfo>>;
  sueldoBruto: number;
  setSueldoBruto: (val: number) => void;
  saldoAnterior: number;
  setSaldoAnterior: (val: number) => void;
  totalFacturasManual: number;
  setTotalFacturasManual: (val: number) => void;
  usaFacturasDetalladas: boolean;
  setUsaFacturasDetalladas: (val: boolean) => void;
  config: TaxConfig;
  resultado: TaxCalculationResult;
  onOpenConfig: () => void;
  onIrAInforme: () => void;
  onIrAFacturas: () => void;
  onGuardarEnHistorial: () => void;
}

export const CalculadoraTab: React.FC<CalculadoraTabProps> = ({
  contribuyente,
  setContribuyente,
  sueldoBruto,
  setSueldoBruto,
  saldoAnterior,
  setSaldoAnterior,
  totalFacturasManual,
  setTotalFacturasManual,
  usaFacturasDetalladas,
  setUsaFacturasDetalladas,
  config,
  resultado,
  onOpenConfig,
  onIrAInforme,
  onIrAFacturas,
  onGuardarEnHistorial,
}) => {
  return (
    <div className="container py-4">
      {/* TARJETAS KPI DE IMPACTO SUPERIOR */}
      <div className="row g-3 mb-4">
        {/* KPI 1: Sueldo Neto */}
        <div className="col-lg-3 col-sm-6">
          <div className="kpi-card kpi-info h-100 shadow-sm">
            <span className="text-muted small text-uppercase fw-semibold d-block">
              Sueldo Neto (Laboral)
            </span>
            <h3 className="fw-bold text-dark mb-1">{formatMoneda(resultado.sueldoNeto)}</h3>
            <div className="text-secondary small">
              Aportes: -{formatMoneda(resultado.descuentoAportes)} ({resultado.tasaAportesLaboralesPct}%)
            </div>
          </div>
        </div>

        {/* KPI 2: Impuesto Determinado */}
        <div className="col-lg-3 col-sm-6">
          <div className="kpi-card kpi-warning h-100 shadow-sm">
            <span className="text-muted small text-uppercase fw-semibold d-block">
              Impuesto Determinado ({resultado.tasaImpuestoPct}%)
            </span>
            <h3 className="fw-bold text-dark mb-1">{formatMoneda(resultado.impuestoDeterminado)}</h3>
            <div className="text-secondary small">
              Base Imponible: {formatMoneda(resultado.baseImponible)}
            </div>
          </div>
        </div>

        {/* KPI 3: Crédito Fiscal y Compensaciones */}
        <div className="col-lg-3 col-sm-6">
          <div className="kpi-card kpi-success h-100 shadow-sm">
            <span className="text-muted small text-uppercase fw-semibold d-block">
              Crédito Total Disponible
            </span>
            <h3 className="fw-bold text-success mb-1">{formatMoneda(resultado.totalCreditoDisponible)}</h3>
            <div className="text-secondary small">
              Facturas: {formatMoneda(resultado.creditoFacturas)} | Anterior: {formatMoneda(resultado.saldoAnterior)}
            </div>
          </div>
        </div>

        {/* KPI 4: Total a Pagar / Retener */}
        <div className="col-lg-3 col-sm-6">
          <div
            className={`kpi-card h-100 shadow-sm ${
              resultado.statusCode === 'SALDO_A_RETENER'
                ? 'kpi-danger'
                : resultado.statusCode === 'SIN_SALDO_PAGAR'
                ? 'kpi-info'
                : 'kpi-success'
            }`}
          >
            <span className="text-muted small text-uppercase fw-semibold d-block">
              Total a Pagar / Retener
            </span>
            <h3
              className={`fw-bold mb-1 ${
                resultado.totalPagar > 0 ? 'text-danger' : 'text-success'
              }`}
            >
              {formatMoneda(resultado.totalPagar)}
            </h3>
            <div className="text-truncate">
              <span className={`tax-badge tax-badge-${resultado.statusBadgeVariant} py-0 px-2 small`}>
                {resultado.statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* PANEL IZQUIERDO: FORMULARIO DE LIQUIDACIÓN */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-3 bg-white mb-4">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">📝 Parámetros del Contribuyente y Sueldo</h5>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={onOpenConfig}
                title="Configurar tasas porcentuales"
              >
                ⚙️ Ajustar Tasas
              </button>
            </div>
            <div className="card-body p-4">
              {/* DATOS GENERALES */}
              <div className="row g-2 mb-3">
                <div className="col-md-7">
                  <label className="form-label small fw-semibold">Nombre y Apellido:</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={contribuyente.nombre}
                    onChange={(e) => setContribuyente({ ...contribuyente, nombre: e.target.value })}
                    placeholder="Ej: Lic. Juan Pérez"
                  />
                </div>
                <div className="col-md-5">
                  <label className="form-label small fw-semibold">Documento (CI / NIT):</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={contribuyente.documento}
                    onChange={(e) => setContribuyente({ ...contribuyente, documento: e.target.value })}
                    placeholder="Ej: 4892019-LP"
                  />
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Período Declarado (Mes/Año):</label>
                  <input
                    type="month"
                    className="form-control form-control-sm"
                    value={contribuyente.periodo}
                    onChange={(e) => setContribuyente({ ...contribuyente, periodo: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Empresa / Razón Social:</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={contribuyente.empresa}
                    onChange={(e) => setContribuyente({ ...contribuyente, empresa: e.target.value })}
                    placeholder="Ej: Banco o Empresa S.A."
                  />
                </div>
              </div>

              <hr className="my-3 text-muted" />

              {/* ENTRADAS FINANCIERAS CLAVE */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark d-flex justify-content-between">
                  <span>1. Sueldo Bruto Mensual (Total Ganado):</span>
                  <span className="text-primary">{formatMoneda(sueldoBruto)}</span>
                </label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text bg-light fw-bold text-dark">Bs.</span>
                  <input
                    type="number"
                    step="50"
                    min="0"
                    className="form-control fw-bold fs-4"
                    value={sueldoBruto || ''}
                    onChange={(e) => setSueldoBruto(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-text small">
                  Base laboral sobre la cual se descuentan los aportes de ley del {config.alicuotaAportesLaboralesPct}%.
                </div>
              </div>

              {/* FACTURAS PRESENTADAS */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-bold text-dark mb-0">
                    2. Facturas de Descargo (Formulario 110):
                  </label>
                  <div className="form-check form-switch small">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="switchFacturas"
                      checked={usaFacturasDetalladas}
                      onChange={(e) => setUsaFacturasDetalladas(e.target.checked)}
                    />
                    <label className="form-check-label text-muted" htmlFor="switchFacturas">
                      {usaFacturasDetalladas ? 'Modo Ítem por Ítem' : 'Monto Directo'}
                    </label>
                  </div>
                </div>

                {usaFacturasDetalladas ? (
                  <div className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted small d-block">Total acumulado en Gestor:</span>
                      <strong className="fs-5 text-dark">{formatMoneda(resultado.totalFacturas)}</strong>
                      <span className="text-success small d-block">
                        Crédito 13%: {formatMoneda(resultado.creditoFacturas)}
                      </span>
                    </div>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={onIrAFacturas}>
                      Abrir Gestor de Facturas 🧾
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="input-group">
                      <span className="input-group-text">Bs.</span>
                      <input
                        type="number"
                        step="10"
                        min="0"
                        className="form-control"
                        value={totalFacturasManual || ''}
                        onChange={(e) => setTotalFacturasManual(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="d-flex justify-content-between small text-muted mt-1">
                      <span>Crédito Fiscal computado ({config.alicuotaFacturasPct}%):</span>
                      <strong className="text-success">{formatMoneda(resultado.creditoFacturas)}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* SALDO DEL PERÍODO ANTERIOR */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark d-flex justify-content-between">
                  <span>3. Saldo a Favor del Período Anterior:</span>
                  <span className="text-info">{formatMoneda(saldoAnterior)}</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text">Bs.</span>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    className="form-control"
                    value={saldoAnterior || ''}
                    onChange={(e) => setSaldoAnterior(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-text small">
                  Crédito a favor arrastrado del mes precedente.
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="d-flex gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-primary flex-grow-1 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                  onClick={onIrAInforme}
                >
                  <span>Ver Informe Tributario Oficial</span>
                  <span>📑</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success py-2"
                  onClick={onGuardarEnHistorial}
                  title="Guardar declaración en historial"
                >
                  💾 Guardar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: DESGLOSE MATEMÁTICO TRANSPARENTE Y ESTADO */}
        <div className="col-lg-6">
          {/* TARJETA DE ESTADO FINAL */}
          <div
            className={`card shadow-sm border-0 rounded-3 mb-4 final-tax-box ${
              resultado.statusCode === 'SALDO_A_RETENER'
                ? 'box-danger'
                : resultado.statusCode === 'SIN_SALDO_PAGAR'
                ? 'box-info'
                : 'box-success'
            }`}
          >
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-uppercase small fw-bold text-muted">
                  Estado de la Liquidación
                </span>
                <span className={`tax-badge tax-badge-${resultado.statusBadgeVariant}`}>
                  {resultado.statusLabel}
                </span>
              </div>

              <div className="my-2">
                <div className="text-muted small">Monto Total a Retener en Planilla:</div>
                <h1 className={`display-5 fw-bold mb-0 ${resultado.totalPagar > 0 ? 'text-danger' : 'text-success'}`}>
                  {formatMoneda(resultado.totalPagar)}
                </h1>
              </div>

              <div className="mt-3 p-3 bg-white bg-opacity-75 rounded-3 border">
                <strong className="d-block text-dark small text-uppercase mb-1">
                  Explicación Tributaria Coherente:
                </strong>
                <p className="text-secondary small mb-0">{resultado.statusDescription}</p>
              </div>

              {resultado.saldoSiguiente > 0 && (
                <div className="mt-3 alert alert-success py-2 mb-0 small d-flex justify-content-between align-items-center">
                  <span>Saldo a favor para el siguiente mes:</span>
                  <strong className="fs-6">{formatMoneda(resultado.saldoSiguiente)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* DESGLOSE PASO A PASO */}
          <div className="card shadow-sm border-0 rounded-3 bg-white">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="fw-bold mb-0 text-dark">🔍 Desglose Paso a Paso del Cálculo</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <tbody className="small">
                    <tr>
                      <td className="ps-3 fw-semibold">Total Ganado (Sueldo Bruto)</td>
                      <td className="text-end pe-3 fw-bold">{formatMoneda(resultado.sueldoBruto)}</td>
                    </tr>
                    <tr className="text-danger">
                      <td className="ps-3">
                        (-) Descuento Aportes Laborales ({resultado.tasaAportesLaboralesPct}%)
                      </td>
                      <td className="text-end pe-3">-{formatMoneda(resultado.descuentoAportes)}</td>
                    </tr>
                    <tr className="table-light fw-bold text-primary">
                      <td className="ps-3">(=) Sueldo Neto Obtenido</td>
                      <td className="text-end pe-3">{formatMoneda(resultado.sueldoNeto)}</td>
                    </tr>
                    <tr>
                      <td className="ps-3 text-muted">(-) Deducción / Monto Exento Autorizado</td>
                      <td className="text-end pe-3 text-muted">-{formatMoneda(resultado.minimoNoImponible)}</td>
                    </tr>
                    <tr className="fw-semibold">
                      <td className="ps-3">(=) Base Imponible Neta</td>
                      <td className="text-end pe-3">{formatMoneda(resultado.baseImponible)}</td>
                    </tr>
                    <tr>
                      <td className="ps-3">(x) Alícuota Impositiva</td>
                      <td className="text-end pe-3">{resultado.tasaImpuestoPct}%</td>
                    </tr>
                    <tr className="table-warning fw-bold">
                      <td className="ps-3">(=) Impuesto Determinado Inicial</td>
                      <td className="text-end pe-3">{formatMoneda(resultado.impuestoDeterminado)}</td>
                    </tr>
                    <tr className="text-success">
                      <td className="ps-3">
                        (-) Crédito por Facturas ({resultado.tasaFacturasPct}% de {formatMoneda(resultado.totalFacturas)})
                      </td>
                      <td className="text-end pe-3">-{formatMoneda(resultado.creditoFacturas)}</td>
                    </tr>
                    <tr className="text-info">
                      <td className="ps-3">(-) Saldo a Favor Período Anterior</td>
                      <td className="text-end pe-3">-{formatMoneda(resultado.saldoAnterior)}</td>
                    </tr>
                    <tr className="table-light fw-bold">
                      <td className="ps-3">Total Deducción y Créditos Disponibles</td>
                      <td className="text-end pe-3">{formatMoneda(resultado.totalCreditoDisponible)}</td>
                    </tr>
                    <tr className="table-active fw-bold fs-6 border-top">
                      <td className="ps-3">TOTAL A RETENER / PAGAR</td>
                      <td className={`text-end pe-3 ${resultado.totalPagar > 0 ? 'text-danger' : 'text-success'}`}>
                        {formatMoneda(resultado.totalPagar)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
