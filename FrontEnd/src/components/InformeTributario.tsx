import React, { useState } from 'react';
import {
  formatMoneda,
  type ContribuyenteInfo,
  type TaxCalculationResult,
  type FacturaItem,
  type TaxConfig,
} from '../services/taxCalculator';

interface InformeTributarioProps {
  contribuyente: ContribuyenteInfo;
  resultado: TaxCalculationResult;
  config: TaxConfig;
  facturas: FacturaItem[];
  onPrint: () => void;
}

export const InformeTributario: React.FC<InformeTributarioProps> = ({
  contribuyente,
  resultado,
  config,
  facturas,
  onPrint,
}) => {
  const [copiado, setCopiado] = useState(false);

  const copiarResumen = () => {
    const texto = `=== INFORME TRIBUTARIO FORMAL ===
Contribuyente: ${contribuyente.nombre || 'No especificado'}
Doc. Identidad: ${contribuyente.documento || 'No especificado'}
Período Declarado: ${contribuyente.periodo || 'N/A'}
Empresa / Cargo: ${contribuyente.empresa || 'N/A'} - ${contribuyente.cargo || 'N/A'}

1. INGRESOS LABORALES:
- Sueldo Bruto: ${formatMoneda(resultado.sueldoBruto)}
- Aportes Laborales (${resultado.tasaAportesLaboralesPct}%): -${formatMoneda(resultado.descuentoAportes)}
- Sueldo Neto: ${formatMoneda(resultado.sueldoNeto)}

2. CÁLCULO DEL IMPUESTO:
- Deducción 2 SMN: ${formatMoneda(resultado.minimoNoImponible)}
- Base Imponible: ${formatMoneda(resultado.baseImponible)}
- Alícuota Impositiva (${resultado.tasaImpuestoPct}%): ${resultado.tasaImpuestoPct}%
- Impuesto Determinado: ${formatMoneda(resultado.impuestoDeterminado)}

3. DEDUCCIONES Y COMPENSACIONES:
- Total Facturas Declaradas: ${formatMoneda(resultado.totalFacturas)}
- Crédito Fiscal Facturas (${resultado.tasaFacturasPct}%): ${formatMoneda(resultado.creditoFacturas)}
- Saldo a Favor Período Anterior: ${formatMoneda(resultado.saldoAnterior)}
- Saldo Siguiente para el Próximo Mes: ${formatMoneda(resultado.saldoSiguiente)}

ESTADO DE LIQUIDACIÓN: ${resultado.statusLabel.toUpperCase()}
TOTAL A RETENER / PAGAR: ${formatMoneda(resultado.totalPagar)}
Fundamentación: ${resultado.statusDescription}
==========================================`;

    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const getBannerClass = () => {
    if (resultado.statusCode === 'SALDO_A_RETENER') return 'banner-danger';
    if (resultado.statusCode === 'SIN_SALDO_PAGAR') return 'banner-info';
    return 'banner-success';
  };

  const getStatusPillClass = () => {
    if (resultado.statusCode === 'SALDO_A_RETENER') return 'status-pill-danger';
    if (resultado.statusCode === 'SIN_SALDO_PAGAR') return 'status-pill-info';
    return 'status-pill-success';
  };

  // Porcentaje de cobertura del impuesto
  const porcentajeCubierto = resultado.impuestoDeterminado > 0
    ? Math.min(100, Math.round((resultado.creditoUtilizado / resultado.impuestoDeterminado) * 100))
    : 100;

  return (
    <div className="card-pro h-100">
      {/* Barra de herramientas superior */}
      <div className="card-pro-header no-print">
        <div className="d-flex align-items-center gap-2">
          <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
            <span className="fs-6">📑</span>
          </div>
          <div>
            <h6 className="fw-bold mb-0 text-dark">Informe Tributario Certificado</h6>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Hoja de liquidación oficial F-110 (En vivo)</span>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-3 px-3"
            onClick={copiarResumen}
            title="Copiar texto formal al portapapeles"
          >
            <span>{copiado ? '✅ ¡Copiado!' : '📋 Copiar'}</span>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary d-flex align-items-center gap-1 fw-bold rounded-3 px-3 shadow-sm"
            onClick={onPrint}
            title="Imprimir informe en papel o guardar en PDF"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', border: 'none' }}
          >
            <span>🖨️ Imprimir / PDF</span>
          </button>
        </div>
      </div>

      <div className="card-body p-3 p-md-4 official-report-sheet">
        {/* Marca de agua gráfica sutil */}
        <div className="report-watermark">RC</div>

        {/* ENCABEZADO CON DATOS DEL CONTRIBUYENTE Y SELLO INSTITUCIONAL */}
        <div className="border-bottom pb-3 mb-3 position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-dark text-white px-2 py-1 small fw-bold">FORMULARIO F-110</span>
                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 small fw-semibold">
                  Régimen Directo (Con SMN)
                </span>
                <span className="badge bg-light text-secondary border small">Versión 2.0</span>
              </div>
              <h5 className="fw-bold text-dark mb-0 tracking-tight">CERTIFICADO DE LIQUIDACIÓN TRIBUTARIA</h5>
              <div className="text-secondary small" style={{ fontSize: '0.78rem' }}>
                Régimen Complementario al Impuesto al Valor Agregado • Trabajo en Relación de Dependencia
              </div>
            </div>

            {/* Sello Institucional y Código QR de verificación */}
            <div className="d-flex align-items-center gap-3">
              <div className="official-seal d-none d-sm-flex">
                <span style={{ fontSize: '0.5rem', fontWeight: 800 }}>SIN OFICIAL</span>
                <span style={{ fontSize: '0.65rem' }}>★ ★ ★</span>
                <span style={{ fontSize: '0.45rem' }}>CERTIFICADO</span>
              </div>

              <div className="text-md-end text-start">
                <div className="badge bg-light text-dark border px-3 py-1 mb-1 shadow-sm">
                  Período: <strong className="text-primary">{contribuyente.periodo || '2026-11'}</strong>
                </div>
                <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                  Emisión: {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* FICHA TÉCNICA DEL CONTRIBUYENTE */}
          <div className="mt-3 p-3 bg-light rounded-3 border">
            <div className="row g-2 small">
              <div className="col-md-5 col-12">
                <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>CONTRIBUYENTE / DEPENDIENTE:</span>
                <strong className="text-dark fs-6">{contribuyente.nombre || 'No especificado'}</strong>
              </div>
              <div className="col-md-3 col-6">
                <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>DOCUMENTO (CI / NIT):</span>
                <strong className="text-dark">{contribuyente.documento || 'No especificado'}</strong>
              </div>
              <div className="col-md-4 col-6">
                <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>ENTIDAD EMPLEADORA / CARGO:</span>
                <span className="text-dark text-truncate d-block fw-semibold">
                  {contribuyente.empresa ? `${contribuyente.empresa} (${contribuyente.cargo || 'Funcionario'})` : 'No informada'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 1: INGRESOS LABORALES */}
        <div className="report-section-pro">
          <div className="report-section-pro-header">
            <span>SECCIÓN 1: INGRESOS LABORALES</span>
            <span className="badge bg-primary bg-opacity-10 text-primary">Base Salarial</span>
          </div>
          <div>
            <div className="report-item-row">
              <div>
                <span className="op-sign op-plus">+</span>
                <span className="text-dark">Sueldo Bruto Mensual (Total Ganado)</span>
              </div>
              <strong className="num-tabular text-dark">{formatMoneda(resultado.sueldoBruto)}</strong>
            </div>

            <div className="report-item-row text-danger">
              <div>
                <span className="op-sign op-minus">-</span>
                <span>Descuento Aportes Laborales ({resultado.tasaAportesLaboralesPct}% AFP/Gestora)</span>
              </div>
              <span className="num-tabular fw-bold">-{formatMoneda(resultado.descuentoAportes)}</span>
            </div>

            <div className="report-item-row report-item-subtotal text-primary">
              <div>
                <span className="op-sign op-equal">=</span>
                <strong className="text-dark">Sueldo Neto Laboral Imponible</strong>
              </div>
              <strong className="num-tabular fs-6 text-primary">{formatMoneda(resultado.sueldoNeto)}</strong>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: CÁLCULO DEL IMPUESTO */}
        <div className="report-section-pro">
          <div className="report-section-pro-header">
            <span>SECCIÓN 2: CÁLCULO DEL IMPUESTO</span>
            <span className="badge bg-secondary bg-opacity-10 text-secondary">Determinación Tributaria</span>
          </div>
          <div>
            <div className="report-item-row">
              <div>
                <span className="op-sign op-minus">-</span>
                <span className="text-muted">Deducción 2 SMN</span>
              </div>
              <span className="num-tabular text-muted">-{formatMoneda(resultado.minimoNoImponible)}</span>
            </div>

            <div className="report-item-row report-item-subtotal">
              <div>
                <span className="op-sign op-equal">=</span>
                <strong>Base Imponible Neta Sujeta a Gravamen</strong>
              </div>
              <strong className="num-tabular text-dark">{formatMoneda(resultado.baseImponible)}</strong>
            </div>

            <div className="report-item-row">
              <div>
                <span className="op-sign op-mul">×</span>
                <span>Alícuota Impositiva Aplicable</span>
              </div>
              <span className="badge bg-secondary">{resultado.tasaImpuestoPct}%</span>
            </div>

            <div className="report-item-row report-item-total text-dark">
              <div>
                <span className="op-sign op-equal">=</span>
                <strong className="fw-bold">Impuesto Determinado del Período</strong>
              </div>
              <strong className="num-tabular fs-6 text-dark">{formatMoneda(resultado.impuestoDeterminado)}</strong>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: DEDUCCIONES Y COMPENSACIONES */}
        <div className="report-section-pro">
          <div className="report-section-pro-header">
            <span>SECCIÓN 3: DEDUCCIONES Y COMPENSACIONES</span>
            <span className="badge bg-success bg-opacity-10 text-success">Créditos Computables</span>
          </div>
          <div>
            <div className="report-item-row">
              <div>
                <span className="op-sign op-plus">+</span>
                <span>
                  Total Facturas Presentadas en Descargo
                  {facturas.length > 0 && ` (${facturas.length} comprobantes)`}
                </span>
              </div>
              <span className="num-tabular fw-semibold text-dark">{formatMoneda(resultado.totalFacturas)}</span>
            </div>

            <div className="report-item-row text-success">
              <div>
                <span className="op-sign op-minus">-</span>
                <span className="fw-semibold">Crédito Fiscal Computable por Facturas ({resultado.tasaFacturasPct}%)</span>
              </div>
              <strong className="num-tabular">-{formatMoneda(resultado.creditoFacturas)}</strong>
            </div>

            <div className="report-item-row text-info">
              <div>
                <span className="op-sign op-minus">-</span>
                <span className="fw-semibold">Saldo a Favor del Contribuyente del Período Anterior</span>
              </div>
              <strong className="num-tabular">-{formatMoneda(resultado.saldoAnterior)}</strong>
            </div>

            <div className="report-item-row report-item-subtotal">
              <div>
                <span className="op-sign op-equal">=</span>
                <strong>Total Crédito y Compensaciones Disponibles</strong>
              </div>
              <strong className="num-tabular text-dark">{formatMoneda(resultado.totalCreditoDisponible)}</strong>
            </div>

            <div className="report-item-row" style={{ backgroundColor: resultado.saldoSiguiente > 0 ? '#f0fdf4' : '#ffffff' }}>
              <div>
                <span className="op-sign op-equal">=</span>
                <span className="fw-bold text-success">Saldo a Favor para el Siguiente Mes (Remanente)</span>
              </div>
              <strong className="num-tabular fs-6 text-success">{formatMoneda(resultado.saldoSiguiente)}</strong>
            </div>
          </div>
        </div>

        {/* Mini barra visual de absorción del impuesto */}
        {resultado.impuestoDeterminado > 0 && (
          <div className="mb-3 p-3 bg-light rounded-3 border">
            <div className="d-flex justify-content-between align-items-center mb-1 small">
              <span className="text-secondary fw-semibold">Nivel de Cobertura del Impuesto:</span>
              <strong className={porcentajeCubierto === 100 ? 'text-success' : 'text-danger'}>
                {porcentajeCubierto}% cubierto
              </strong>
            </div>
            <div className="tax-visual-bar">
              <div
                className="tax-visual-segment segment-cubierto"
                style={{ width: `${porcentajeCubierto}%` }}
                title={`Cubierto: ${formatMoneda(resultado.creditoUtilizado)}`}
              />
              <div
                className="tax-visual-segment segment-pagar"
                style={{ width: `${100 - porcentajeCubierto}%` }}
                title={`Por Pagar: ${formatMoneda(resultado.totalPagar)}`}
              />
            </div>
          </div>
        )}

        {/* RECUADRO FINAL DESTACADO */}
        <div className={`featured-tax-banner mb-3 ${getBannerClass()}`}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <span className="small text-uppercase fw-bold text-muted d-block mb-1">
                Total a Pagar / A Retener en Planilla:
              </span>
              <h2 className={`display-6 fw-bold mb-1 num-tabular ${resultado.totalPagar > 0 ? 'text-danger' : 'text-success'}`}>
                {formatMoneda(resultado.totalPagar)}
              </h2>
              <div className="mt-2">
                <span className={`status-pill ${getStatusPillClass()}`}>
                  <span
                    className="pulse-dot"
                    style={{
                      backgroundColor:
                        resultado.statusCode === 'SALDO_A_RETENER'
                          ? '#dc2626'
                          : resultado.statusCode === 'SIN_SALDO_PAGAR'
                          ? '#0284c7'
                          : '#16a34a',
                    }}
                  ></span>
                  {resultado.statusLabel}
                </span>
              </div>
            </div>

            <div className="text-md-end text-start" style={{ maxWidth: 380 }}>
              <strong className="d-block text-dark small text-uppercase mb-1">Diagnóstico Tributario Real:</strong>
              <p className="small text-secondary mb-0" style={{ lineHeight: 1.45 }}>
                {resultado.statusDescription}
              </p>
            </div>
          </div>
        </div>

        {/* ANEXO DE FACTURAS SI EXISTEN */}
        {facturas.length > 0 && (
          <div className="mt-3 pt-2">
            <h6 className="fw-bold text-dark text-uppercase small mb-2 d-flex justify-content-between align-items-center">
              <span>Anexo I: Comprobantes Declarados ({facturas.length})</span>
              <span className="badge bg-light text-dark border">13% Crédito Directo</span>
            </h6>
            <div className="table-responsive rounded-3 border">
              <table className="table table-sm table-hover align-middle small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>N° Factura</th>
                    <th>Proveedor / Razón Social</th>
                    <th className="text-end">Importe (Bs.)</th>
                    <th className="text-end">Crédito Fiscal</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((f, idx) => (
                    <tr key={f.id || idx}>
                      <td>{idx + 1}</td>
                      <td className="fw-bold">{f.numero}</td>
                      <td>{f.proveedor}</td>
                      <td className="text-end num-tabular">{formatMoneda(f.monto, false)}</td>
                      <td className="text-end text-success fw-semibold num-tabular">
                        {formatMoneda(f.monto * (config.alicuotaFacturasPct / 100), false)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FIRMAS DE VALIDEZ LEGAL */}
        <div className="mt-4 pt-4 border-top">
          <div className="row text-center g-3">
            <div className="col-4">
              <div className="signature-box"></div>
              <small className="d-block mt-1 fw-bold text-dark">
                {contribuyente.nombre || 'Firma Dependiente'}
              </small>
              <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Contribuyente</span>
            </div>
            <div className="col-4">
              <div className="signature-box"></div>
              <small className="d-block mt-1 fw-bold text-dark">Agente Retención</small>
              <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Recursos Humanos / Planillas</span>
            </div>
            <div className="col-4">
              <div className="signature-box"></div>
              <small className="d-block mt-1 fw-bold text-dark">Auditoría Contable</small>
              <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Conformidad Tributaria</span>
            </div>
          </div>

          <div className="text-center mt-3 text-muted" style={{ fontSize: '0.7rem' }}>
            Documento emitido con plena conformidad tributaria • Codificación UTF-8 • Sin aplicación de SMN
          </div>
        </div>
      </div>
    </div>
  );
};
