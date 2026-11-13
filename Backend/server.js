const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'clave_secreta_sin_bolivia_2024';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function verificarToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'Debes iniciar sesión' });
  jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Sesión inválida' });
    req.usuario = decoded; 
    next();
  });
}

app.post('/api/register', async (req, res) => {
  const { nombre, email, password, tipo_cuenta } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO usuarios (nombre, email, password, tipo_cuenta) VALUES (?, ?, ?, ?)', [nombre, email, hash, tipo_cuenta]);
    res.status(201).json({ mensaje: 'Usuario registrado' });
  } catch (error) { res.status(400).json({ error: 'El correo ya está registrado' }); }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const [users] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  if (users.length === 0) return res.status(400).json({ error: 'Usuario no encontrado' });
  const user = users[0];
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ error: 'Contraseña incorrecta' });
  const token = jwt.sign({ id: user.id, nombre: user.nombre, tipo: user.tipo_cuenta }, SECRET_KEY);
  res.json({ token, usuario: { nombre: user.nombre, tipo: user.tipo_cuenta } });
});

app.get('/api/gastos', verificarToken, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM gastos WHERE usuario_id = ? ORDER BY fecha DESC', [req.usuario.id]);
  res.json(rows);
});

app.post('/api/gastos', verificarToken, async (req, res) => {
  const { descripcion, monto, categoria, fecha } = req.body;
  await db.query('INSERT INTO gastos (usuario_id, descripcion, monto, categoria, fecha) VALUES (?, ?, ?, ?, ?)', [req.usuario.id, descripcion, monto, categoria, fecha]);
  res.status(201).json({ mensaje: 'Gasto guardado' });
});

app.get('/api/gastos/grafica', verificarToken, async (req, res) => {
  const [rows] = await db.query('SELECT categoria, SUM(monto) as total FROM gastos WHERE usuario_id = ? GROUP BY categoria', [req.usuario.id]);
  res.json(rows);
});

// --- IMPUESTOS ---
// Ruta NUEVA para traer todo el historial de impuestos
app.get('/api/declaraciones', verificarToken, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM declaraciones WHERE usuario_id = ? ORDER BY fecha DESC', [req.usuario.id]);
  res.json(rows);
});

app.post('/api/declaraciones', verificarToken, async (req, res) => {
  const { periodo, tipo_impuesto, monto_base, tasa, impuesto, total } = req.body;
  try {
    await db.query('INSERT INTO declaraciones (usuario_id, periodo, tipo_impuesto, monto_base, tasa, impuesto, total, estado) VALUES (?, ?, ?, ?, ?, ?, ?, "Pendiente")',
      [req.usuario.id, periodo, tipo_impuesto, monto_base, tasa, impuesto, total]);
    res.status(201).json({ mensaje: 'Declaración guardada' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(PORT, '0.0.0.0', () => { console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`); });
