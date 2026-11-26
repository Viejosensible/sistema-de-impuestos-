const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const db = require('./db');
const { calcularImpuesto, DEFAULT_TAX_CONFIG } = require('./src/taxCalculator');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'clave_secreta_sin_bolivia_2024';

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function parseJsonField(val, fallback) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val;
}

function toMysqlDatetime(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function serializeUsuario(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    documento: row.documento,
    empresa: row.empresa,
    cargo: row.cargo,
    tipoCuenta: row.tipo_cuenta,
    avatarColor: row.avatar_color,
    fechaRegistro: row.fecha_registro,
  };
}

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ ok: false, error: 'Debes iniciar sesión' });
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ ok: false, error: 'Sesión inválida o expirada' });
    req.usuario = decoded;
    next();
  });
}

function soloAdmin(req, res, next) {
  if (req.usuario?.tipoCuenta !== 'Administrador') {
    return res.status(403).json({ ok: false, error: 'Acceso exclusivo para Administrador' });
  }
  next();
}

async function initDatabase() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id VARCHAR(64) NOT NULL,
      nombre VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL,
      documento VARCHAR(50) NOT NULL,
      empresa VARCHAR(150) NOT NULL DEFAULT '',
      cargo VARCHAR(150) NOT NULL DEFAULT '',
      tipo_cuenta ENUM('Dependiente','Independiente','Auditor','Administrador') NOT NULL DEFAULT 'Dependiente',
      password_hash VARCHAR(255) NOT NULL,
      avatar_color VARCHAR(20) NOT NULL DEFAULT '#2563eb',
      fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_usuarios_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS datos_tributarios (
      usuario_id VARCHAR(64) NOT NULL,
      sueldo_bruto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      saldo_anterior DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      ufv_anterior DECIMAL(10,5) NOT NULL DEFAULT 0.00000,
      ufv_actual DECIMAL(10,5) NOT NULL DEFAULT 0.00000,
      total_facturas_manual DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      usa_facturas_detalladas TINYINT(1) NOT NULL DEFAULT 0,
      periodo VARCHAR(7) NOT NULL DEFAULT '2026-11',
      config_json JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (usuario_id),
      CONSTRAINT fk_datos_tributarios_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query('ALTER TABLE datos_tributarios ADD COLUMN IF NOT EXISTS ufv_anterior DECIMAL(10,5) NOT NULL DEFAULT 0.00000 AFTER saldo_anterior');
  await db.query('ALTER TABLE datos_tributarios ADD COLUMN IF NOT EXISTS ufv_actual DECIMAL(10,5) NOT NULL DEFAULT 0.00000 AFTER ufv_anterior');

  await db.query(`
    CREATE TABLE IF NOT EXISTS facturas (
      id VARCHAR(64) NOT NULL,
      usuario_id VARCHAR(64) NOT NULL,
      numero VARCHAR(60) NOT NULL,
      proveedor VARCHAR(150) NOT NULL DEFAULT '',
      fecha DATE NOT NULL,
      monto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      concepto VARCHAR(255) NOT NULL DEFAULT '',
      PRIMARY KEY (id),
      KEY idx_facturas_usuario (usuario_id),
      CONSTRAINT fk_facturas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS declaraciones (
      id VARCHAR(64) NOT NULL,
      usuario_id VARCHAR(64) NOT NULL,
      fecha_guardado DATETIME NOT NULL,
      periodo VARCHAR(7) NOT NULL,
      sueldo_bruto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      saldo_anterior DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      total_facturas_manual DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      usa_facturas_detalladas TINYINT(1) NOT NULL DEFAULT 0,
      impuesto_determinado DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      total_pagar DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      status_label VARCHAR(100) NOT NULL DEFAULT '',
      contribuyente_json JSON NOT NULL,
      resultado_json JSON NOT NULL,
      config_json JSON NOT NULL,
      facturas_json JSON NOT NULL,
      PRIMARY KEY (id),
      KEY idx_declaraciones_usuario_fecha (usuario_id, fecha_guardado),
      CONSTRAINT fk_declaraciones_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS normativa_global (
      id TINYINT NOT NULL DEFAULT 1,
      config_json JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [countRows] = await db.query('SELECT COUNT(*) AS total FROM usuarios');
  if (countRows[0].total === 0) {
    const adminPass = await bcrypt.hash('Admin123*', 10);
    const demoPass = await bcrypt.hash('1234', 10);

    const seedUsers = [
      ['user-admin', 'Lic. Administrador General del SIN', 'admin@impuestos.bo', '1000000-LP', 'Servicio de Impuestos Nacionales (SIN)', 'Administrador Central del Sistema', 'Administrador', adminPass, '#dc2626', '2026-01-01 00:00:00'],
      ['user-rodrigo', 'Lic. Rodrigo Morales Vega', 'rodrigo@minera.bo', '4928172-LP', 'Corporación Minera Andina S.A.', 'Jefe de Operaciones', 'Dependiente', demoPass, '#2563eb', '2026-11-01 10:00:00'],
      ['user-valeria', 'Ing. Valeria Méndez Castro', 'valeria@techsur.bo', '6849201-SC', 'Tecnologías del Sur S.R.L.', 'Arquitecta de Software', 'Dependiente', demoPass, '#059669', '2026-11-05 14:30:00'],
      ['user-carmen', 'Dra. Carmen Cecilia Rojas', 'carmen@clinica.bo', '3819204-CB', 'Clínica Metropolitana Los Andes', 'Especialista Médica', 'Dependiente', demoPass, '#d97706', '2026-11-10 09:15:00'],
    ];

    for (const u of seedUsers) {
      await db.query(
        'INSERT INTO usuarios (id, nombre, email, documento, empresa, cargo, tipo_cuenta, password_hash, avatar_color, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        u
      );
    }

    const cfgJson = JSON.stringify(DEFAULT_TAX_CONFIG);
    const seedTaxData = [
      ['user-admin', 18000, 500, 8500, 0, '2026-11', cfgJson],
      ['user-rodrigo', 15000, 0, 0, 0, '2026-11', cfgJson],
      ['user-valeria', 12000, 0, 0, 1, '2026-11', cfgJson],
      ['user-carmen', 10000, 1600, 0, 0, '2026-11', cfgJson],
    ];

    for (const d of seedTaxData) {
      await db.query(
        'INSERT INTO datos_tributarios (usuario_id, sueldo_bruto, saldo_anterior, total_facturas_manual, usa_facturas_detalladas, periodo, config_json) VALUES (?, ?, ?, ?, ?, ?, ?)',
        d
      );
    }

    const valeriaFacturas = [
      ['f1', 'user-valeria', 'F-1092', 'Supermercados Ketal S.A.', '2026-11-04', 3500, 'Alimentación e insumos'],
      ['f2', 'user-valeria', 'F-4481', 'Farmacias Bolivia', '2026-11-12', 1800, 'Medicamentos y salud'],
      ['f3', 'user-valeria', 'F-8823', 'Electrónica Central S.R.L.', '2026-11-20', 6200, 'Equipamiento y accesorios'],
    ];
    for (const f of valeriaFacturas) {
      await db.query(
        'INSERT INTO facturas (id, usuario_id, numero, proveedor, fecha, monto, concepto) VALUES (?, ?, ?, ?, ?, ?, ?)',
        f
      );
    }
  }

  await db.query(
    'INSERT IGNORE INTO normativa_global (id, config_json) VALUES (1, ?)',
    [JSON.stringify(DEFAULT_TAX_CONFIG)]
  );
}

async function getTaxDataByUserId(usuarioId) {
  const [rows] = await db.query('SELECT * FROM datos_tributarios WHERE usuario_id = ?', [usuarioId]);
  const [factRows] = await db.query('SELECT id, numero, proveedor, fecha, monto, concepto FROM facturas WHERE usuario_id = ? ORDER BY fecha DESC', [usuarioId]);

  const facturas = factRows.map((f) => ({
    id: f.id,
    numero: f.numero,
    proveedor: f.proveedor,
    fecha: String(f.fecha).slice(0, 10),
    monto: Number(f.monto),
    concepto: f.concepto,
  }));

  if (rows.length === 0) {
    return {
      sueldoBruto: 0,
      saldoAnterior: 0,
      ufvAnterior: 0,
      ufvActual: 0,
      totalFacturasManual: 0,
      usaFacturasDetalladas: false,
      facturas,
      periodo: new Date().toISOString().slice(0, 7),
      config: DEFAULT_TAX_CONFIG,
    };
  }

  const r = rows[0];
  const parsedCfg = parseJsonField(r.config_json, DEFAULT_TAX_CONFIG);
  return {
    sueldoBruto: Number(r.sueldo_bruto),
    saldoAnterior: Number(r.saldo_anterior),
    ufvAnterior: Number(r.ufv_anterior || 0),
    ufvActual: Number(r.ufv_actual || 0),
    totalFacturasManual: Number(r.total_facturas_manual),
    usaFacturasDetalladas: Boolean(r.usa_facturas_detalladas),
    facturas,
    periodo: r.periodo,
    config: { ...DEFAULT_TAX_CONFIG, ...parsedCfg, smn: parsedCfg?.smn ?? DEFAULT_TAX_CONFIG.smn },
  };
}

// --- HEALTH ---
app.get('/api/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
  const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
  const cleanPass = String(req.body?.password || '').trim();
  if (!cleanEmail) return res.status(400).json({ ok: false, error: 'Por favor ingresa tu correo electrónico.' });
  if (!cleanPass) return res.status(400).json({ ok: false, error: 'Por favor ingresa tu contraseña.' });

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE LOWER(email) = ?', [cleanEmail]);
    if (rows.length === 0) {
      return res.status(401).json({ ok: false, error: 'No existe una cuenta registrada con este correo electrónico.' });
    }
    const userRow = rows[0];
    const validPassword = await bcrypt.compare(cleanPass, userRow.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        ok: false,
        error: userRow.tipo_cuenta === 'Administrador'
          ? 'Contraseña de Administrador incorrecta. Verifica las mayúsculas y caracteres.'
          : 'Contraseña incorrecta.',
      });
    }

    const usuario = serializeUsuario(userRow);
    const token = jwt.sign({ id: usuario.id, email: usuario.email, tipoCuenta: usuario.tipoCuenta }, SECRET_KEY, { expiresIn: '7d' });
    return res.json({ ok: true, token, usuario });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { nombre, email, password, documento, empresa, cargo, tipoCuenta } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPass = String(password || '');

  if (!String(nombre || '').trim()) return res.status(400).json({ ok: false, error: 'El nombre completo es requerido.' });
  if (!cleanEmail || !cleanEmail.includes('@')) return res.status(400).json({ ok: false, error: 'Ingresa un correo electrónico válido.' });
  if (cleanPass.length < 4) return res.status(400).json({ ok: false, error: 'La contraseña debe tener al menos 4 caracteres.' });
  if (!String(documento || '').trim()) return res.status(400).json({ ok: false, error: 'El número de Documento (CI/NIT) es obligatorio.' });

  try {
    const [existing] = await db.query('SELECT id FROM usuarios WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ ok: false, error: 'Este correo electrónico ya está registrado. Inicia sesión normalmente.' });
    }

    const colores = ['#2563eb', '#059669', '#7c3aed', '#db2777', '#d97706', '#0891b2'];
    const id = 'user-' + Date.now();
    const avatarColor = colores[Math.floor(Math.random() * colores.length)];
    const passwordHash = await bcrypt.hash(cleanPass, 10);
    const tipoPermitido = ['Dependiente', 'Independiente', 'Auditor'].includes(tipoCuenta) ? tipoCuenta : 'Dependiente';
    const fechaReg = toMysqlDatetime();

    await db.query(
      'INSERT INTO usuarios (id, nombre, email, documento, empresa, cargo, tipo_cuenta, password_hash, avatar_color, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, nombre.trim(), cleanEmail, documento.trim(), (empresa || '').trim() || 'Empresa Particular', (cargo || '').trim() || 'Profesional / Empleado', tipoPermitido, passwordHash, avatarColor, fechaReg]
    );

    const periodoActual = new Date().toISOString().slice(0, 7);
    await db.query(
      'INSERT INTO datos_tributarios (usuario_id, sueldo_bruto, saldo_anterior, total_facturas_manual, usa_facturas_detalladas, periodo, config_json) VALUES (?, 0, 0, 0, 0, ?, ?)',
      [id, periodoActual, JSON.stringify(DEFAULT_TAX_CONFIG)]
    );

    const [createdRows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    const usuario = serializeUsuario(createdRows[0]);
    const token = jwt.sign({ id: usuario.id, email: usuario.email, tipoCuenta: usuario.tipoCuenta }, SECRET_KEY, { expiresIn: '7d' });
    return res.status(201).json({ ok: true, token, usuario });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/auth/me', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (rows.length === 0) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    return res.json({ ok: true, usuario: serializeUsuario(rows[0]) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// --- PERFIL DE USUARIO ---
app.put('/api/usuarios/:id', verificarToken, async (req, res) => {
  const targetId = req.params.id;
  if (req.usuario.id !== targetId && req.usuario.tipoCuenta !== 'Administrador') {
    return res.status(403).json({ ok: false, error: 'No autorizado' });
  }
  const { nombre, documento, empresa, cargo, tipoCuenta } = req.body || {};
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [targetId]);
    if (rows.length === 0) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    const current = rows[0];
    const nextTipo = current.tipo_cuenta === 'Administrador'
      ? 'Administrador'
      : (['Dependiente', 'Independiente', 'Auditor'].includes(tipoCuenta) ? tipoCuenta : current.tipo_cuenta);

    await db.query(
      'UPDATE usuarios SET nombre = ?, documento = ?, empresa = ?, cargo = ?, tipo_cuenta = ? WHERE id = ?',
      [
        nombre !== undefined ? String(nombre).trim() : current.nombre,
        documento !== undefined ? String(documento).trim() : current.documento,
        empresa !== undefined ? String(empresa).trim() : current.empresa,
        cargo !== undefined ? String(cargo).trim() : current.cargo,
        nextTipo,
        targetId,
      ]
    );
    const [updated] = await db.query('SELECT * FROM usuarios WHERE id = ?', [targetId]);
    return res.json({ ok: true, usuario: serializeUsuario(updated[0]) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// --- DATOS TRIBUTARIOS DEL USUARIO ---
app.get('/api/tributario/datos', verificarToken, async (req, res) => {
  try {
    const data = await getTaxDataByUserId(req.usuario.id);
    return res.json({ ok: true, data });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.put('/api/tributario/datos', verificarToken, async (req, res) => {
  const {
    sueldoBruto = 0,
    saldoAnterior = 0,
    ufvAnterior = 0,
    ufvActual = 0,
    totalFacturasManual = 0,
    usaFacturasDetalladas = false,
    facturas = [],
    periodo = new Date().toISOString().slice(0, 7),
    config = DEFAULT_TAX_CONFIG,
  } = req.body || {};

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO datos_tributarios (usuario_id, sueldo_bruto, saldo_anterior, ufv_anterior, ufv_actual, total_facturas_manual, usa_facturas_detalladas, periodo, config_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         sueldo_bruto = VALUES(sueldo_bruto),
         saldo_anterior = VALUES(saldo_anterior),
         ufv_anterior = VALUES(ufv_anterior),
         ufv_actual = VALUES(ufv_actual),
         total_facturas_manual = VALUES(total_facturas_manual),
         usa_facturas_detalladas = VALUES(usa_facturas_detalladas),
         periodo = VALUES(periodo),
         config_json = VALUES(config_json)`,
      [
        req.usuario.id,
        Math.max(0, Number(sueldoBruto) || 0),
        Math.max(0, Number(saldoAnterior) || 0),
        Math.max(0, Number(ufvAnterior) || 0),
        Math.max(0, Number(ufvActual) || 0),
        Math.max(0, Number(totalFacturasManual) || 0),
        usaFacturasDetalladas ? 1 : 0,
        String(periodo || '2026-11').slice(0, 7),
        JSON.stringify(config || DEFAULT_TAX_CONFIG),
      ]
    );

    if (Array.isArray(facturas)) {
      await conn.query('DELETE FROM facturas WHERE usuario_id = ?', [req.usuario.id]);
      for (const f of facturas) {
        const fid = String(f.id || `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
        await conn.query(
          'INSERT INTO facturas (id, usuario_id, numero, proveedor, fecha, monto, concepto) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            fid,
            req.usuario.id,
            String(f.numero || 'S/N').slice(0, 60),
            String(f.proveedor || '').slice(0, 150),
            String(f.fecha || new Date().toISOString().slice(0, 10)).slice(0, 10),
            Number(f.monto) || 0,
            String(f.concepto || '').slice(0, 255),
          ]
        );
      }
    }

    await conn.commit();
    return res.json({ ok: true });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ ok: false, error: error.message });
  } finally {
    conn.release();
  }
});

// --- IMPUESTOS (RC-IVA BOLIVIA - 2 SMN) ---
app.post('/api/tributario/calcular', (req, res) => {
  try {
    const input = req.body || {};
    const resultado = calcularImpuesto(input);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.json({ ok: true, resultado, configPorDefecto: DEFAULT_TAX_CONFIG });
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message });
  }
});

// --- HISTORIAL DE DECLARACIONES ---
app.get('/api/declaraciones', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM declaraciones WHERE usuario_id = ? ORDER BY fecha_guardado DESC',
      [req.usuario.id]
    );
    const historial = rows.map((r) => ({
      id: r.id,
      fechaGuardado: r.fecha_guardado,
      contribuyente: parseJsonField(r.contribuyente_json, {}),
      resultado: parseJsonField(r.resultado_json, {}),
      config: parseJsonField(r.config_json, DEFAULT_TAX_CONFIG),
      facturas: parseJsonField(r.facturas_json, []),
      sueldoBruto: Number(r.sueldo_bruto),
      saldoAnterior: Number(r.saldo_anterior),
      totalFacturasManual: Number(r.total_facturas_manual),
      usaFacturasDetalladas: Boolean(r.usa_facturas_detalladas),
    }));
    return res.json({ ok: true, historial });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/declaraciones', verificarToken, async (req, res) => {
  const d = req.body || {};
  if (!d.id || !d.contribuyente || !d.resultado) {
    return res.status(400).json({ ok: false, error: 'Datos de declaración incompletos' });
  }
  try {
    await db.query(
      `INSERT INTO declaraciones (
        id, usuario_id, fecha_guardado, periodo, sueldo_bruto, saldo_anterior,
        total_facturas_manual, usa_facturas_detalladas, impuesto_determinado,
        total_pagar, status_label, contribuyente_json, resultado_json, config_json, facturas_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(d.id),
        req.usuario.id,
        toMysqlDatetime(d.fechaGuardado),
        String(d.contribuyente.periodo || '2026-11').slice(0, 7),
        Number(d.sueldoBruto) || 0,
        Number(d.saldoAnterior) || 0,
        Number(d.totalFacturasManual) || 0,
        d.usaFacturasDetalladas ? 1 : 0,
        Number(d.resultado.impuestoDeterminado) || 0,
        Number(d.resultado.totalPagar) || 0,
        String(d.resultado.statusLabel || '').slice(0, 100),
        JSON.stringify(d.contribuyente),
        JSON.stringify(d.resultado),
        JSON.stringify(d.config || DEFAULT_TAX_CONFIG),
        JSON.stringify(Array.isArray(d.facturas) ? d.facturas : []),
      ]
    );
    return res.status(201).json({ ok: true, id: d.id });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/declaraciones/import', verificarToken, async (req, res) => {
  const items = Array.isArray(req.body?.declaraciones) ? req.body.declaraciones : [];
  try {
    let insertadas = 0;
    for (const d of items) {
      if (!d || !d.id || !d.contribuyente || !d.resultado) continue;
      const [result] = await db.query(
        `INSERT IGNORE INTO declaraciones (
          id, usuario_id, fecha_guardado, periodo, sueldo_bruto, saldo_anterior,
          total_facturas_manual, usa_facturas_detalladas, impuesto_determinado,
          total_pagar, status_label, contribuyente_json, resultado_json, config_json, facturas_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(d.id),
          req.usuario.id,
          toMysqlDatetime(d.fechaGuardado),
          String(d.contribuyente.periodo || '2026-11').slice(0, 7),
          Number(d.sueldoBruto) || 0,
          Number(d.saldoAnterior) || 0,
          Number(d.totalFacturasManual) || 0,
          d.usaFacturasDetalladas ? 1 : 0,
          Number(d.resultado.impuestoDeterminado) || 0,
          Number(d.resultado.totalPagar) || 0,
          String(d.resultado.statusLabel || '').slice(0, 100),
          JSON.stringify(d.contribuyente),
          JSON.stringify(d.resultado),
          JSON.stringify(d.config || DEFAULT_TAX_CONFIG),
          JSON.stringify(Array.isArray(d.facturas) ? d.facturas : []),
        ]
      );
      if (result.affectedRows > 0) insertadas++;
    }
    return res.json({ ok: true, insertadas });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.delete('/api/declaraciones/:id', verificarToken, async (req, res) => {
  try {
    await db.query('DELETE FROM declaraciones WHERE id = ? AND usuario_id = ?', [req.params.id, req.usuario.id]);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.delete('/api/declaraciones', verificarToken, async (req, res) => {
  try {
    await db.query('DELETE FROM declaraciones WHERE usuario_id = ?', [req.usuario.id]);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// --- ADMINISTRADOR ---
app.get('/api/admin/matriz', verificarToken, soloAdmin, async (_req, res) => {
  try {
    const [userRows] = await db.query('SELECT * FROM usuarios ORDER BY fecha_registro ASC');
    const matriz = [];
    for (const row of userRows) {
      const usuario = serializeUsuario(row);
      const taxData = await getTaxDataByUserId(usuario.id);
      const taxResult = calcularImpuesto({
        sueldoBruto: taxData.sueldoBruto,
        totalFacturas: taxData.usaFacturasDetalladas ? undefined : taxData.totalFacturasManual,
        facturas: taxData.usaFacturasDetalladas ? taxData.facturas : undefined,
        saldoAnterior: taxData.saldoAnterior,
        ufvAnterior: taxData.ufvAnterior,
        ufvActual: taxData.ufvActual,
        config: taxData.config || DEFAULT_TAX_CONFIG,
      });
      matriz.push({ usuario, taxData, taxResult });
    }
    return res.json({ ok: true, matriz });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.delete('/api/admin/usuarios/:id', verificarToken, soloAdmin, async (req, res) => {
  if (req.params.id === 'user-admin') {
    return res.status(400).json({ ok: false, error: 'No se puede eliminar al Administrador Principal' });
  }
  try {
    await db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/normativa', verificarToken, async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT config_json FROM normativa_global WHERE id = 1');
    const config = rows.length > 0 ? parseJsonField(rows[0].config_json, DEFAULT_TAX_CONFIG) : DEFAULT_TAX_CONFIG;
    return res.json({ ok: true, config });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.put('/api/normativa', verificarToken, soloAdmin, async (req, res) => {
  try {
    const config = req.body?.config || DEFAULT_TAX_CONFIG;
    await db.query(
      'INSERT INTO normativa_global (id, config_json) VALUES (1, ?) ON DUPLICATE KEY UPDATE config_json = VALUES(config_json)',
      [JSON.stringify(config)]
    );
    return res.json({ ok: true, config });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

initDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error inicializando base de datos:', err);
    process.exit(1);
  });
