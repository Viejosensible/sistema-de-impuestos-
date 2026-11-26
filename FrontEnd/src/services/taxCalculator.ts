/**
 * Motor de Cálculo Tributario RC-IVA Bolivia (Planilla Salarial - 2 SMN)
 * Codificación: UTF-8
 *
 * Reglas normativas aplicadas (Ley 843 / D.S. 21531):
 * - Sueldo Neto = Sueldo Bruto - Aportes Laborales (12.71%)
 * - Mínimo No Imponible = 2 Salarios Mínimos Nacionales (2 SMN)
 * - Base Imponible = max(0, Sueldo Neto - 2 SMN)
 * - Impuesto Determinado = Base Imponible * 13%
 * - Compensación:
 *   1) Crédito automático 13% de 2 SMN (no acumulable para el siguiente período)
 *   2) Crédito fiscal 13% de facturas declaradas (F-110)
 *   3) Saldo a favor del período anterior (actualizado por variación UFV si se proporcionan las UFV)
 * - Total a Pagar / Retener = max(0, Impuesto Determinado - Crédito 13% 2 SMN - Crédito Facturas - Saldo Anterior Actualizado)
 * - Saldo Siguiente = max(0, (Crédito Facturas + Saldo Anterior Actualizado) - max(0, Impuesto Determinado - Crédito 13% 2 SMN))
 */

export interface TaxConfig {
  alicuotaAportesLaboralesPct: number; // Por defecto: 12.71%
  smn: number;                         // Salario Mínimo Nacional vigente (Por defecto: Bs. 3,300.00)
  alicuotaImpuestoPct: number;          // Por defecto: 13.00%
  alicuotaFacturasPct: number;          // Por defecto: 13.00%
}

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  alicuotaAportesLaboralesPct: 12.71,
  smn: 3300.0,
  alicuotaImpuestoPct: 13.0,
  alicuotaFacturasPct: 13.0,
};

export interface FacturaItem {
  id: string;
  numero: string;
  proveedor: string;
  fecha: string;
  monto: number;
  concepto?: string;
}

export interface ContribuyenteInfo {
  nombre: string;
  documento: string;
  periodo: string; // Ej: "2026-11"
  empresa: string;
  cargo: string;
}

export interface TaxCalculationInput {
  sueldoBruto: number;
  totalFacturas?: number;
  facturas?: FacturaItem[];
  saldoAnterior?: number;
  ufvAnterior?: number;
  ufvActual?: number;
  config?: Partial<TaxConfig>;
}

export type TaxStatusCode =
  | 'SIN_SALDO_PAGAR'
  | 'COMPENSADO_FACTURAS'
  | 'COMPENSADO_SALDO_ANTERIOR'
  | 'COMPENSADO_MIXTO'
  | 'SALDO_A_RETENER';

export interface TaxCalculationResult {
  sueldoBruto: number;
  tasaAportesLaboralesPct: number;
  descuentoAportes: number;
  sueldoNeto: number;

  smn: number;
  minimoNoImponible: number;
  baseImponible: number;
  tasaImpuestoPct: number;
  impuestoDeterminado: number;

  creditoMinimoNoImponible: number;
  creditoSMNAplicado: number;
  totalFacturas: number;
  tasaFacturasPct: number;
  creditoFacturas: number;
  saldoAnterior: number;
  ufvAnterior: number;
  ufvActual: number;
  ufvAplicada: boolean;
  mantenimientoValor: number;
  saldoAnteriorActualizado: number;

  totalCreditoDisponible: number;
  creditoUtilizado: number;
  totalPagar: number;
  saldoSiguiente: number;

  statusCode: TaxStatusCode;
  statusLabel: string;
  statusDescription: string;
  statusBadgeVariant: 'success' | 'warning' | 'danger' | 'info';

  timestampCalculo: string;
}

/**
 * Redondea a 2 decimales evitando imprecisiones de coma flotante
 */
export const round2 = (val: number): number => {
  if (isNaN(val) || !isFinite(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

/**
 * Formatea un número como moneda boliviana con 2 decimales
 */
export const formatMoneda = (val: number, conSimbolo = true): string => {
  const formateado = new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
  return conSimbolo ? `Bs. ${formateado}` : formateado;
};

/**
 * Motor central de cálculo tributario RC-IVA Bolivia
 */
export function calcularImpuesto(input: TaxCalculationInput): TaxCalculationResult {
  const rawConfig = input.config || {};
  const config: TaxConfig = {
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

  // 3. Compensaciones: 13% de 2 SMN (no acumulable), Facturas (13%) y Saldo Anterior (UFV opcional)
  const creditoMinimoNoImponible = round2(minimoNoImponible * (tasaImpuesto / 100));
  const creditoSMNAplicado = round2(Math.min(impuestoDeterminado, creditoMinimoNoImponible));
  const impuestoTrasCreditoSMN = round2(Math.max(0, impuestoDeterminado - creditoSMNAplicado));

  let sumaFacturas = 0;
  if (input.facturas && input.facturas.length > 0) {
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

  // 5. Determinación del Estado
  let statusCode: TaxStatusCode;
  let statusLabel: string;
  let statusDescription: string;
  let statusBadgeVariant: 'success' | 'warning' | 'danger' | 'info';

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

/**
 * Escenarios de prueba precargados para verificar comportamiento RC-IVA (2 SMN)
 */
export interface EscenarioPrueba {
  id: string;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  contribuyente: ContribuyenteInfo;
  input: TaxCalculationInput;
}

export const ESCENARIOS_PRUEBA: EscenarioPrueba[] = [
  {
    id: 'retencion-directa',
    titulo: '1. Saldo a Retener (Sin facturas ni saldo previo)',
    subtitulo: 'Sueldo superior a 4 SMN sin descargos',
    descripcion: 'Contribuyente con Sueldo Bruto de Bs. 18,000.00, sin facturas ni saldo anterior. Aplica deducción de 2 SMN y crédito automático del 13% de 2 SMN.',
    contribuyente: {
      nombre: 'Lic. Rodrigo Morales Vega',
      documento: '4928172-LP',
      periodo: '2026-11',
      empresa: 'Corporación Minera Andina S.A.',
      cargo: 'Jefe de Operaciones',
    },
    input: {
      sueldoBruto: 18000,
      totalFacturas: 0,
      saldoAnterior: 0,
      config: DEFAULT_TAX_CONFIG,
    },
  },
  {
    id: 'compensado-facturas',
    titulo: '2. Compensado por Facturas (Total a Pagar = 0)',
    subtitulo: 'Facturas suficientes con excedente',
    descripcion: 'Contribuyente con Sueldo Bruto de Bs. 18,000.00 y facturas válidas por Bs. 5,000.00. Cubre el saldo después de 2 SMN y genera saldo a favor.',
    contribuyente: {
      nombre: 'Ing. Valeria Méndez Castro',
      documento: '6849201-SC',
      periodo: '2026-11',
      empresa: 'Tecnologías del Sur S.R.L.',
      cargo: 'Arquitecta de Software',
    },
    input: {
      sueldoBruto: 18000,
      totalFacturas: 5000,
      saldoAnterior: 0,
      config: DEFAULT_TAX_CONFIG,
      facturas: [
        { id: 'f1', numero: 'F-1092', proveedor: 'Supermercados Ketal S.A.', fecha: '2026-11-04', monto: 2000, concepto: 'Alimentación e insumos' },
        { id: 'f2', numero: 'F-4481', proveedor: 'Farmacias Bolivia', fecha: '2026-11-12', monto: 1200, concepto: 'Medicamentos y salud' },
        { id: 'f3', numero: 'F-8823', proveedor: 'Electrónica Central S.R.L.', fecha: '2026-11-20', monto: 1800, concepto: 'Equipamiento y accesorios' },
      ],
    },
  },
  {
    id: 'compensado-saldo-anterior',
    titulo: '3. Compensado por Saldo Anterior con UFV',
    subtitulo: 'Arrastre previo actualizado por UFV',
    descripcion: 'Contribuyente con Sueldo Bruto de Bs. 18,000.00, Bs. 0.00 en facturas y saldo anterior de Bs. 500.00 actualizado por UFV.',
    contribuyente: {
      nombre: 'Dra. Carmen Cecilia Rojas',
      documento: '3819204-CB',
      periodo: '2026-11',
      empresa: 'Clínica Metropolitana Los Andes',
      cargo: 'Especialista Médica',
    },
    input: {
      sueldoBruto: 18000,
      totalFacturas: 0,
      saldoAnterior: 500,
      ufvAnterior: 2.50,
      ufvActual: 2.52,
      config: DEFAULT_TAX_CONFIG,
      facturas: [],
    },
  },
  {
    id: 'compensado-mixto',
    titulo: '4. Compensación Mixta (2 SMN + Facturas + Saldo UFV)',
    subtitulo: 'Sinergia de créditos con remanente',
    descripcion: 'Contribuyente con Sueldo Bruto de Bs. 20,000.00, facturas por Bs. 3,000.00 y saldo anterior de Bs. 400.00 actualizado por UFV.',
    contribuyente: {
      nombre: 'Lic. Andrés Gabriel Quiroga',
      documento: '5719302-PT',
      periodo: '2026-11',
      empresa: 'Consultores Financieros Asociados',
      cargo: 'Auditor Senior',
    },
    input: {
      sueldoBruto: 20000,
      totalFacturas: 3000,
      saldoAnterior: 400,
      ufvAnterior: 2.50,
      ufvActual: 2.52,
      config: DEFAULT_TAX_CONFIG,
      facturas: [
        { id: 'f4', numero: 'F-9021', proveedor: 'Librerías y Papelería Continental', fecha: '2026-11-08', monto: 1200, concepto: 'Material y libros especializados' },
        { id: 'f5', numero: 'F-3312', proveedor: 'Servicios de Telecomunicaciones Tigo', fecha: '2026-11-15', monto: 1800, concepto: 'Servicios de conectividad anual' },
      ],
    },
  },
  {
    id: 'base-cero-exento',
    titulo: '5. Sueldo igual o menor a 2 SMN (Exento)',
    subtitulo: 'Base imponible en cero',
    descripcion: 'Contribuyente con Sueldo Bruto de Bs. 6,000.00. Al descontar aportes (12.71%), su Sueldo Neto es menor a 2 SMN y queda exento.',
    contribuyente: {
      nombre: 'Mateo Alejandro Flores',
      documento: '7829103-TJ',
      periodo: '2026-11',
      empresa: 'Logística & Transportes del Valle',
      cargo: 'Auxiliar Operativo',
    },
    input: {
      sueldoBruto: 6000,
      totalFacturas: 0,
      saldoAnterior: 0,
      config: DEFAULT_TAX_CONFIG,
    },
  },
];
