import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const API_URL = 'http://192.168.100.236:3000/api';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const ANIOS = [2024, 2025, 2026, 2027];

export default function App() {
  const [usuario, setUsuario] = useState<any>(null);
  if (!usuario) return <VistaAuth setUsuario={setUsuario} />;
  return <AppPrincipal usuario={usuario} cerrarSesion={() => setUsuario(null)} />;
}

function VistaAuth({ setUsuario }: { setUsuario: any }) {
  const [esLogin, setEsLogin] = useState(true);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState(''); const [ruc, setRuc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = esLogin ? '/auth/login' : '/auth/register';
    const body = esLogin ? { email, password } : { nombre, ruc, email, password, perfil: 'Asalariado' };
    try {
      const res = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        if (esLogin) setUsuario(data);
        else { alert('Registrado. Inicia sesión.'); setEsLogin(true); }
      } else { alert(data.error); }
    } catch (error) { alert('Error de red'); }
  };

  return (
    <div className="d-flex vh-100 w-100" style={{ background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' }}>
      <div className="container-fluid m-0 p-0 d-flex justify-content-center align-items-center">
        <div className="col-md-5 col-lg-4">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <i className="bi bi-wallet2 text-primary display-4"></i>
                <h3 className="fw-bold mt-3">{esLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h3>
              </div>
              <form onSubmit={handleSubmit}>
                {!esLogin && (
                  <>
                    <div className="mb-3"><label className="form-label text-muted small">Nombre Completo</label><input type="text" className="form-control bg-light" value={nombre} onChange={e => setNombre(e.target.value)} required /></div>
                    <div className="mb-3"><label className="form-label text-muted small">RUC / Documento</label><input type="text" className="form-control bg-light" value={ruc} onChange={e => setRuc(e.target.value)} required /></div>
                  </>
                )}
                <div className="mb-3"><label className="form-label text-muted small">Correo Electrónico</label><input type="email" className="form-control bg-light" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                <div className="mb-4"><label className="form-label text-muted small">Contraseña</label><input type="password" className="form-control bg-light" value={password} onChange={e => setPassword(e.target.value)} required /></div>
                <button type="submit" className="btn btn-primary w-100 rounded-pill fw-bold py-2">{esLogin ? 'Ingresar' : 'Registrarme'}</button>
              </form>
              <div className="text-center mt-4">
                <button className="btn btn-link text-decoration-none text-muted small" onClick={() => setEsLogin(!esLogin)}>{esLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppPrincipal({ usuario, cerrarSesion }: any) {
  const [vista, setVista] = useState<'historial' | 'facturas'>('historial');
  const [facturas, setFacturas] = useState<any[]>([]);
  const [salarios, setSalarios] = useState<any[]>([]);

  const cargarDatos = async () => {
    try {
      const resF = await fetch(`${API_URL}/movimientos/${usuario.id}`);
      setFacturas(await resF.json());
      const resS = await fetch(`${API_URL}/salarios/${usuario.id}`);
      setSalarios(await resS.json());
    } catch (error) { console.error(error); }
  };
  useEffect(() => { cargarDatos(); }, []);

  return (
    <div className="d-flex w-100 vh-100" style={{ backgroundColor: '#f4f6f9', overflow: 'hidden' }}>
      <div className="bg-dark text-white p-3 d-flex flex-column" style={{ width: '260px', flexShrink: 0 }}>
        <h4 className="text-center fw-bold mb-4 mt-2"><i className="bi bi-wallet2 text-success me-2"></i> Mis Finanzas</h4>
        <hr className="text-secondary" />
        <ul className="nav flex-column gap-2 mt-2 flex-grow-1">
          <li className="nav-item"><button className={`nav-link w-100 text-start text-white ${vista === 'historial' ? 'bg-primary rounded fw-bold' : 'opacity-75'}`} onClick={() => setVista('historial')}><i className="bi bi-journal-text me-2"></i> Historial de Salarios</button></li>
          <li className="nav-item"><button className={`nav-link w-100 text-start text-white ${vista === 'facturas' ? 'bg-primary rounded fw-bold' : 'opacity-75'}`} onClick={() => setVista('facturas')}><i className="bi bi-receipt me-2"></i> Mis Facturas</button></li>
        </ul>
        <div className="mt-auto">
          <hr className="text-secondary" />
          <div className="d-flex align-items-center mb-3 px-2">
            <div className="bg-success rounded-circle d-flex justify-content-center align-items-center me-2 text-white fw-bold" style={{ width: '40px', height: '40px' }}>{usuario.nombre.charAt(0)}</div>
            <div className="text-truncate" style={{ maxWidth: '140px' }}><small>{usuario.nombre}</small></div>
          </div>
          <button className="btn btn-outline-danger w-100 btn-sm rounded-pill" onClick={cerrarSesion}><i className="bi bi-box-arrow-right me-1"></i> Salir</button>
        </div>
      </div>

      <div className="flex-grow-1 p-4 w-100 m-0" style={{ overflowY: 'auto' }}>
        {vista === 'historial' && <VistaHistorial usuario={usuario} facturas={facturas} salarios={salarios} recargar={cargarDatos} />}
        {vista === 'facturas' && <VistaFacturas usuario={usuario} facturas={facturas} recargar={cargarDatos} />}
      </div>
    </div>
  );
}

// --- VISTA DE HISTORIAL DE SALARIOS ---
function VistaHistorial({ usuario, facturas, salarios, recargar }: any) {
  const [mes, setMes] = useState('11');
  const [anio, setAnio] = useState('2026');
  const [nuevoSalario, setNuevoSalario] = useState('');
  const [reporteActivo, setReporteActivo] = useState<any>(null); // Estado para el informe

  const guardarSalario = async () => {
    if (!nuevoSalario || nuevoSalario <= 0) return alert('Ingresa un monto válido');
    const mes_anio = `${anio}-${mes.padStart(2, '0')}`;

    const res = await fetch(`${API_URL}/salarios`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contribuyente_id: usuario.id, monto: nuevoSalario, mes_anio })
    });
    
    if (res.ok) { 
      setNuevoSalario(''); recargar(); 
      alert(`Salario de ${MESES[parseInt(mes)-1]} ${anio} registrado.`);
    } else { const error = await res.json(); alert(error.error); }
  };

  const borrarSalario = async (id: number) => {
    if (window.confirm('¿Borrar este salario del historial?')) {
      await fetch(`${API_URL}/salarios/${id}`, { method: 'DELETE' });
      recargar();
    }
  };

  const calcularDetalle = (montoSalario: number, mes_anio: string) => {
    const smn = 3300;
    const aportes = montoSalario * 0.1271;
    const sueldoNeto = montoSalario - aportes;
    const minimoNoImponible = smn * 2;
    
    const facturasMes = facturas.filter((f: any) => f.fecha && f.fecha.startsWith(mes_anio) && f.tipo_movimiento === 'compra');
    const totalCompras = facturasMes.reduce((acc: number, f: any) => acc + parseFloat(f.monto_total), 0);

    let data = {
      montoSalario, aportes, sueldoNeto, minimoNoImponible, totalCompras,
      baseImponible: 0, impuestoDeterminado: 0, descuentoMinimo: 0, descuentoCompras: 0,
      iva: 0, exento: false, facturas: facturasMes
    };

    if (sueldoNeto > minimoNoImponible) {
      data.baseImponible = sueldoNeto - minimoNoImponible;
      data.impuestoDeterminado = data.baseImponible * 0.13;
      data.descuentoMinimo = minimoNoImponible * 0.13;
      data.descuentoCompras = totalCompras * 0.13;
      let calculo = data.impuestoDeterminado - data.descuentoMinimo - data.descuentoCompras;
      data.iva = calculo > 0 ? Math.round(calculo) : 0;
    } else {
      data.exento = true;
    }

    return data;
  };

  return (
    <div className="animate__animated animate__fadeIn w-100">
      <h3 className="fw-bold text-secondary mb-4">Historial de Salarios y RC-IVA</h3>
      
      <div className="row g-4">
        {/* Formulario de Registro */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-4 border-top border-4 border-primary sticky-top" style={{ top: '20px' }}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4">Registrar Salario</h5>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label text-muted small">Mes</label>
                  <select className="form-select bg-light" value={mes} onChange={e => setMes(e.target.value)}>
                    {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small">Año</label>
                  <select className="form-select bg-light" value={anio} onChange={e => setAnio(e.target.value)}>
                    {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label text-muted small">Sueldo Bruto (Bs)</label>
                <input type="number" className="form-control bg-light" placeholder="Ej. 4500" value={nuevoSalario} onChange={e => setNuevoSalario(e.target.value)} />
              </div>
              <button className="btn btn-primary w-100 rounded-pill fw-bold" onClick={guardarSalario}>
                <i className="bi bi-save me-2"></i> Guardar en Historial
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Historial */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white p-4 border-0"><h5 className="fw-bold mb-0">Mis Registros</h5></div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small">
                  <tr>
                    <th className="ps-4">Mes / Año</th>
                    <th>Salario Bruto</th>
                    <th>RC-IVA Calculado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {salarios.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-5 text-muted">Aún no has registrado ningún salario.</td></tr>
                  ) : (
                    salarios.map((s: any) => {
                      const det = calcularDetalle(parseFloat(s.monto), s.mes_anio);
                      const [year, month] = s.mes_anio.split('-');
                      return (
                        <tr key={s.id}>
                          <td className="ps-4 fw-bold">{MESES[parseInt(month)-1]} {year}</td>
                          <td>Bs. {parseFloat(s.monto).toFixed(2)}</td>
                          <td>
                            {det.exento ? (
                              <span className="badge bg-success bg-opacity-25 text-success">Exento</span>
                            ) : det.iva > 0 ? (
                              <span className="fw-bold text-danger">Bs. {det.iva}</span>
                            ) : (
                              <span className="badge bg-success bg-opacity-25 text-success">Cubierto</span>
                            )}
                          </td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setReporteActivo({ ...s, det, year, month })} title="Ver Reporte Completo">
                              <i className="bi bi-eye"></i> Informe
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => borrarSalario(s.id)} title="Eliminar">
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE INFORME DETALLADO */}
      {reporteActivo && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header bg-primary text-white border-0 rounded-top-4">
                <h5 className="modal-title fw-bold"><i className="bi bi-file-earmark-text me-2"></i> Informe Tributario</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setReporteActivo(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between mb-4 pb-3 border-bottom">
                  <div>
                    <h6 className="text-muted mb-1">Contribuyente:</h6>
                    <h5 className="fw-bold mb-0">{usuario.nombre}</h5>
                    <small>RUC: {usuario.ruc}</small>
                  </div>
                  <div className="text-end">
                    <h6 className="text-muted mb-1">Periodo Declarado:</h6>
                    <h5 className="fw-bold mb-0">{MESES[parseInt(reporteActivo.month)-1]} {reporteActivo.year}</h5>
                  </div>
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-3">1. Ingresos Laborales</h6>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr><td className="text-muted">Sueldo Bruto</td><td className="text-end fw-bold">Bs. {reporteActivo.det.montoSalario.toFixed(2)}</td></tr>
                        <tr><td className="text-muted">Aportes AFP (12.71%)</td><td className="text-end text-danger">- Bs. {reporteActivo.det.aportes.toFixed(2)}</td></tr>
                        <tr className="border-top"><td className="fw-bold">Sueldo Neto</td><td className="text-end fw-bold">Bs. {reporteActivo.det.sueldoNeto.toFixed(2)}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-3">2. Cálculo RC-IVA</h6>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr><td className="text-muted">Sueldo Neto</td><td className="text-end fw-bold">Bs. {reporteActivo.det.sueldoNeto.toFixed(2)}</td></tr>
                        <tr><td className="text-muted">Mínimo No Imponible (2 SMN)</td><td className="text-end text-danger">- Bs. {reporteActivo.det.minimoNoImponible.toFixed(2)}</td></tr>
                        <tr className="border-top"><td className="fw-bold">Base Imponible</td><td className="text-end fw-bold">Bs. {reporteActivo.det.baseImponible.toFixed(2)}</td></tr>
                        <tr><td className="text-muted">Impuesto Determinado (13%)</td><td className="text-end fw-bold">Bs. {reporteActivo.det.impuestoDeterminado.toFixed(2)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <h6 className="fw-bold text-primary mb-3">3. Deducciones (Facturas)</h6>
                <div className="bg-light p-3 rounded-3 mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Descuento Mínimo (13% de 2 SMN)</span>
                    <span className="fw-bold text-success">- Bs. {reporteActivo.det.descuentoMinimo.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Total Facturas del mes (Bs. {reporteActivo.det.totalCompras.toFixed(2)})</span>
                    <span className="fw-bold text-success">- Bs. {reporteActivo.det.descuentoCompras.toFixed(2)}</span>
                  </div>
                  {reporteActivo.det.facturas.length > 0 && (
                    <ul className="small text-muted mb-0 mt-3" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                      {reporteActivo.det.facturas.map((f: any, i: number) => (
                        <li key={i}>{f.fecha} - {f.categoria} - Bs. {parseFloat(f.monto_total).toFixed(2)}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={`alert ${reporteActivo.det.iva > 0 ? 'alert-danger' : 'alert-success'} border-0 rounded-4 d-flex align-items-center justify-content-between mb-0`}>
                  <div>
                    <h5 className="fw-bold mb-0">Total RC-IVA a Pagar</h5>
                    <small>{reporteActivo.det.exento ? 'Exento (Sueldo menor a 2 SMN)' : reporteActivo.det.iva === 0 ? 'Cubierto por facturas' : 'Monto a declarar en Formulario 110'}</small>
                  </div>
                  <h2 className="fw-bold mb-0">Bs. {reporteActivo.det.iva.toFixed(2)}</h2>
                </div>

              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary rounded-pill px-4" onClick={() => setReporteActivo(null)}>Cerrar Informe</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- VISTA FACTURAS ---
function VistaFacturas({ usuario, facturas, recargar }: any) {
  const [tipo, setTipo] = useState('compra'); const [monto, setMonto] = useState(''); const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]); const [factura, setFactura] = useState(''); const [categoria, setCategoria] = useState('Alimentación');

  const guardarFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/movimientos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contribuyente_id: usuario.id, tipo_movimiento: tipo, monto_total: monto, periodo_trimestre: 'Mensual', numero_factura: factura, categoria: categoria, fecha: fecha })
    });
    alert('Factura guardada'); setMonto(''); setFactura(''); recargar();
  };

  const eliminarFactura = async (id: number) => {
    if (window.confirm('¿Borrar esta factura? El impuesto de su mes subirá de nuevo.')) {
      await fetch(`${API_URL}/movimientos/${id}`, { method: 'DELETE' });
      recargar();
    }
  };

  return (
    <div className="animate__animated animate__fadeIn w-100">
      <h3 className="fw-bold text-secondary mb-4">Mis Facturas</h3>
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-4 border-top border-4 border-success sticky-top" style={{ top: '20px' }}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4">Registrar Factura</h5>
              <form onSubmit={guardarFactura}>
                <div className="mb-3"><label className="form-label text-muted small">Tipo</label><select className="form-select bg-light" value={tipo} onChange={e => setTipo(e.target.value)}><option value="compra">Gasto / Compra</option><option value="venta">Ingreso / Venta</option></select></div>
                <div className="mb-3"><label className="form-label text-muted small">Monto Total (Bs)</label><input type="number" className="form-control bg-light" value={monto} onChange={e => setMonto(e.target.value)} required /></div>
                <div className="mb-3"><label className="form-label text-muted small">Fecha de la factura</label><input type="date" className="form-control bg-light" value={fecha} onChange={e => setFecha(e.target.value)} required /></div>
                <div className="mb-4"><label className="form-label text-muted small">Categoría</label><select className="form-select bg-light" value={categoria} onChange={e => setCategoria(e.target.value)}><option value="Alimentación">Alimentación</option><option value="Transporte">Transporte</option><option value="Servicios">Servicios</option><option value="General">General</option></select></div>
                <button type="submit" className="btn btn-success w-100 rounded-pill fw-bold">Guardar Factura</button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white p-4 border-0"><h5 className="fw-bold mb-0">Historial de Facturas</h5></div>
            <div className="table-responsive" style={{ maxHeight: '600px' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small sticky-top"><tr><th className="ps-4">Fecha</th><th>Tipo</th><th>Categoría</th><th className="text-end">Monto</th><th className="text-center">Acción</th></tr></thead>
                <tbody>
                  {facturas.map((f: any) => (
                    <tr key={f.id}>
                      <td className="ps-4 text-muted">{f.fecha}</td>
                      <td><span className={`badge rounded-pill ${f.tipo_movimiento === 'venta' ? 'bg-success' : 'bg-danger'}`}>{f.tipo_movimiento.toUpperCase()}</span></td>
                      <td>{f.categoria}</td>
                      <td className={`text-end fw-bold ${f.tipo_movimiento === 'venta' ? 'text-success' : 'text-danger'}`}>Bs. {parseFloat(f.monto_total).toFixed(2)}</td>
                      <td className="text-center"><button className="btn btn-sm btn-outline-danger" onClick={() => eliminarFactura(f.id)}><i className="bi bi-trash"></i></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}