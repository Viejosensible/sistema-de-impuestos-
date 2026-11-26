const sueldoBruto = 4000;
const totalFacturas = 0; 
const smn = 3300; 
const multiplicadorSMN = 1; // Corregido a 1 SMN
const minimoNoImponible = smn * multiplicadorSMN;

const aportesAFP = sueldoBruto * 0.1271;
const sueldoNeto = sueldoBruto - aportesAFP;

let baseImponible = sueldoNeto - minimoNoImponible;
if (baseImponible < 0) baseImponible = 0;

const impuestoDeterminado = baseImponible * 0.13;
const topeFacturas = minimoNoImponible * 0.13;

let facturasAplicables = totalFacturas;
if (facturasAplicables > topeFacturas) facturasAplicables = topeFacturas;
if (facturasAplicables > impuestoDeterminado) facturasAplicables = impuestoDeterminado;

const totalPagar = impuestoDeterminado - facturasAplicables;

console.log("\n--- INFORME TRIBUTARIO CORREGIDO ---");
console.log("Sueldo Bruto:            Bs. " + sueldoBruto.toFixed(2));
console.log("Aportes AFP (12.71%):   - Bs. " + aportesAFP.toFixed(2));
console.log("Sueldo Neto:             Bs. " + sueldoNeto.toFixed(2));
console.log("Min. No Imponible (1 SMN): - Bs. " + minimoNoImponible.toFixed(2));
console.log("Base Imponible:          Bs. " + baseImponible.toFixed(2));
console.log("Impuesto Determinado:    Bs. " + impuestoDeterminado.toFixed(2));
console.log("Facturas Aplicables:    - Bs. " + facturasAplicables.toFixed(2));
console.log("------------------------------------");
console.log("TOTAL A PAGAR:           Bs. " + totalPagar.toFixed(2) + "\n");
