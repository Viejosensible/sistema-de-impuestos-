/**
 * Motor de Cálculo Tributario RC-IVA Bolivia (Planilla Salarial - 2 SMN)
 * Codificación: UTF-8
 */

const DEFAULT_TAX_CONFIG = {
  alicuotaAportesLaboralesPct: 12.71,
  smn: 3300.0,
  alicuotaImpuestoPct: 13.0,
  alicuotaFacturasPct: 13.0,
};

const round2 = (val) => {
  if (isNaN(val) || !isFinite(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

const formatMoneda = (val) => {
  return `Bs. ${round2(val).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

function calcularImpuesto(input = {}) {
  const rawConfig = input.config || {};
  const config = {
    alicuotaAportesLaboralesPct: rawConfig.alicuotaAportesLaboralesPct ?? DEFAULT_TAX_CONFIG.alicuotaAportesLaboralesPct,
    smn: rawConfig.smn ?? DEFAULT_TAX_CONFIG.smn,
    alicuotaImpuestoPct: rawConfig.alicuotaImpuestoPct ?? DEFAULT_TAX_CONFIG.alicuotaImpuestoPct,
    alicuotaFacturasPct: rawConfig.alicuotaFacturasPct ?? DEFAULT_TAX_CONFIG.alicuotaFacturasPct,
  };

  const sueldoBruto = Math.max(0, round2(input.sueldoBruto || 0));

  // 1. Ingresos Laborales
  const tasaAportes = Math.min(100, Math.max(0, Number(config.alicuotaAportesLaboralesPct) || 0));
  const descuentoAportes = round2(sueldoBruto * (tasaAportes / 100));
  const sueldoNeto = round2(Math.max(0, sueldoBruto - descuentoAportes));

  // 2. Deducción de 2 SMN, Base Imponible e Impuesto Determinado
  const smn = Math.max(0, round2(Number(config.smn) || 0));
  const minimoNoImponible = round2(smn * 2);
  const baseImponible = round2(Math.max(0, sueldoNeto - minimoNoImponible));
  const tasaImpuesto = Math.min(100, Math.max(0, Number(config.alicuotaImpuestoPct) || 0));
  const impuestoDeterminado = round2(baseImponible * (tasaImpuesto / 100));

  // 3. Crédito automático 13% de 2 SMN, Facturas y Saldo Anterior (con UFV opcional)
  const creditoMinimoNoImponible = round2(minimoNoImponible * (tasaImpuesto / 100));
  const creditoSMNAplicado = round2(Math.min(impuestoDeterminado, creditoMinimoNoImponible));
  const impuestoTrasCreditoSMN = round2(Math.max(0, impuestoDeterminado - creditoSMNAplicado));

  let sumaFacturas = 0;
  if (Array.isArray(input.facturas) && input.facturas.length > 0) {
    sumaFacturas = input.facturas.reduce((acc, item) => acc + Math.max(0, Number(item.monto) || 0), 0);
  } else if (input.totalFacturas !== undefined) {
    sumaFacturas = Math.max(0, Number(input.totalFacturas) || 0);
  }
  const totalFacturas = Math.max(0, round2(sumaFacturas));
  const tasaFacturas = Math.min(100, Math.max(0, Number(config.alicuotaFacturasPct) || 0));
  const creditoFacturas = round2(totalFacturas * (tasaFacturas / 100));

  const saldoAnterior = Math.max(0, round2(input.saldoAnterior || 0));
  const ufvAnterior = Math.max(0, Number(input.ufvAnterior) || 0);
  const ufvActual = Math.max(0, Number(input.ufvActual) || 0);
  const ufvAplicada = saldoAnterior > 0 && ufvAnterior > 0 && ufvActual > 0;
  const saldoAnteriorActualizado = ufvAplicada
    ? round2(saldoAnterior * (ufvActual / ufvAnterior))
    : saldoAnterior;
  const mantenimientoValor = round2(saldoAnteriorActualizado - saldoAnterior);

  const creditoAcumulable = round2(creditoFacturas + saldoAnteriorActualizado);
  const totalCreditoDisponible = round2(creditoSMNAplicado + creditoAcumulable);

  // 4. Total a Pagar / Retener y Saldo a Favor para el período siguiente
  const totalPagar = round2(Math.max(0, impuestoTrasCreditoSMN - creditoAcumulable));
  const creditoUtilizado = round2(creditoSMNAplicado + Math.min(impuestoTrasCreditoSMN, creditoAcumulable));
  const saldoSiguiente = round2(Math.max(0, creditoAcumulable - impuestoTrasCreditoSMN));

  // 5. Determinación de Estado
  let statusCode;
  let statusLabel;
  let statusDescription;
  let statusBadgeVariant;

  if (impuestoDeterminado === 0) {
    statusCode = 'SIN_SALDO_PAGAR';
    statusLabel = 'Sin saldo a pagar';
    statusBadgeVariant = 'info';
    statusDescription = sueldoNeto > 0
      ? `El sueldo neto (${formatMoneda(sueldoNeto)}) no supera los 2 SMN (${formatMoneda(minimoNoImponible)}). Base imponible en Bs. 0,00; no corresponde retención RC-IVA.`
      : 'No existe materia imponible gravada en este período (Ingreso en cero).';
  } else if (totalPagar === 0) {
    if (impuestoTrasCreditoSMN === 0) {
      statusCode = 'SIN_SALDO_PAGAR';
      statusLabel = 'Cubierto por 13% de 2 SMN';
      statusBadgeVariant = 'info';
      statusDescription = `El impuesto determinado (${formatMoneda(impuestoDeterminado)}) fue cubierto íntegramente por el crédito automático del ${tasaImpuesto}% de 2 SMN (${formatMoneda(creditoMinimoNoImponible)}).${
        saldoSiguiente > 0 ? ` Se mantiene íntegro el saldo acumulado de ${formatMoneda(saldoSiguiente)} para el siguiente período.` : ''
      }`;
    } else {
      const hayFacturas = totalFacturas > 0 && creditoFacturas > 0;
      const haySaldoAnterior = saldoAnteriorActualizado > 0;

      if (hayFacturas && !haySaldoAnterior) {
        statusCode = 'COMPENSADO_FACTURAS';
        statusLabel = 'Compensado por facturas';
        statusBadgeVariant = 'success';
        statusDescription = `El impuesto determinado (${formatMoneda(impuestoDeterminado)}) fue cubierto con el crédito de 2 SMN (${formatMoneda(creditoSMNAplicado)}) y el crédito fiscal de facturas (${formatMoneda(creditoFacturas)}).${
          saldoSiguiente > 0 ? ` Genera un saldo a favor de ${formatMoneda(saldoSiguiente)} para el siguiente período.` : ''
        }`;
      } else if (!hayFacturas && haySaldoAnterior) {
        statusCode = 'COMPENSADO_SALDO_ANTERIOR';
        statusLabel = 'Compensado por saldo anterior';
        statusBadgeVariant = 'success';
        statusDescription = `El impuesto determinado (${formatMoneda(impuestoDeterminado)}) fue cubierto con el crédito de 2 SMN (${formatMoneda(creditoSMNAplicado)}) y el saldo anterior${ufvAplicada ? ' actualizado por UFV' : ''} (${formatMoneda(saldoAnteriorActualizado)}).${
          saldoSiguiente > 0 ? ` Queda un saldo restante a favor de ${formatMoneda(saldoSiguiente)} para el mes siguiente.` : ''
        }`;
      } else {
        statusCode = 'COMPENSADO_MIXTO';
        statusLabel = 'Compensado por facturas y saldo anterior';
        statusBadgeVariant = 'success';
        statusDescription = `El impuesto determinado (${formatMoneda(impuestoDeterminado)}) fue cubierto con el crédito de 2 SMN (${formatMoneda(creditoSMNAplicado)}), facturas (${formatMoneda(creditoFacturas)}) y saldo anterior${ufvAplicada ? ' actualizado por UFV' : ''} (${formatMoneda(saldoAnteriorActualizado)}).${
          saldoSiguiente > 0 ? ` Queda un saldo a favor de ${formatMoneda(saldoSiguiente)} para el siguiente período.` : ''
        }`;
      }
    }
  } else {
    statusCode = 'SALDO_A_RETENER';
    statusLabel = 'Saldo a retener';
    statusBadgeVariant = 'danger';
    statusDescription = creditoAcumulable > 0
      ? `Corresponde retener ${formatMoneda(totalPagar)} en planilla tras aplicar el crédito automático de 2 SMN (${formatMoneda(creditoSMNAplicado)}), facturas (${formatMoneda(creditoFacturas)}) y saldo anterior${ufvAplicada ? ' actualizado por UFV' : ''} (${formatMoneda(saldoAnteriorActualizado)}).`
      : `Corresponde retener ${formatMoneda(totalPagar)} en planilla tras descontar el crédito automático del ${tasaImpuesto}% de 2 SMN (${formatMoneda(creditoSMNAplicado)}).`;
  }

  return {
    sueldoBruto,
    tasaAportesLaboralesPct: tasaAportes,
    descuentoAportes,
    sueldoNeto,

    smn,
    minimoNoImponible,
    baseImponible,
    tasaImpuestoPct: tasaImpuesto,
    impuestoDeterminado,

    creditoMinimoNoImponible,
    creditoSMNAplicado,
    totalFacturas,
    tasaFacturasPct: tasaFacturas,
    creditoFacturas,
    saldoAnterior,
    ufvAnterior,
    ufvActual,
    ufvAplicada,
    mantenimientoValor,
    saldoAnteriorActualizado,

    totalCreditoDisponible,
    creditoUtilizado,
    totalPagar,
    saldoSiguiente,

    statusCode,
    statusLabel,
    statusDescription,
    statusBadgeVariant,

    timestampCalculo: new Date().toISOString(),
  };
}

module.exports = {
  DEFAULT_TAX_CONFIG,
  calcularImpuesto,
  round2,
  formatMoneda,
};
