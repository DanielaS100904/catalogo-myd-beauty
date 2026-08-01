require('dotenv').config();
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cambiaEstaClave123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'cambia-esto-tambien';

const DATA_FILE = path.join(__dirname, 'data', 'productos.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'productos');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ---------- Helpers de datos ----------
function leerProductos() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function guardarProductos(productos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(productos, null, 2), 'utf-8');
}

function nuevoId() {
  return 'p' + crypto.randomBytes(4).toString('hex');
}

// ---------- Middleware ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 horas
}));

function requireAuth(req, res, next) {
  if (req.session && req.session.autenticado) return next();
  return res.status(401).json({ error: 'No autorizado' });
}

// Guarda imágenes con nombre único dentro de public/productos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, req.params.id + '-' + Date.now() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpe?g|png|webp|gif)$/i.test(file.mimetype)) {
      return cb(new Error('Formato de imagen no permitido'));
    }
    cb(null, true);
  }
});

// ---------- Rutas de autenticación ----------
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (password && password === ADMIN_PASSWORD) {
    req.session.autenticado = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Contraseña incorrecta' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/sesion', (req, res) => {
  res.json({ autenticado: !!(req.session && req.session.autenticado) });
});

// ---------- Rutas públicas ----------
app.get('/api/productos', (req, res) => {
  res.json(leerProductos());
});

// ---------- Rutas protegidas (admin) ----------
app.post('/api/productos', requireAuth, (req, res) => {
  const productos = leerProductos();
  const { nombre, precio, categoria, descripcion, destacado, disponible } = req.body || {};
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  const nuevo = {
    id: nuevoId(),
    nombre,
    precio: Number(precio) || 0,
    categoria: categoria || 'Sin categoría',
    descripcion: descripcion || '',
    imagen: '',
    destacado: !!destacado,
    disponible: disponible === undefined ? true : !!disponible
  };
  productos.push(nuevo);
  guardarProductos(productos);
  res.json(nuevo);
});

app.put('/api/productos/:id', requireAuth, (req, res) => {
  const productos = leerProductos();
  const idx = productos.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });

  const camposPermitidos = ['nombre', 'precio', 'categoria', 'descripcion', 'destacado', 'disponible'];
  camposPermitidos.forEach(campo => {
    if (req.body[campo] !== undefined) {
      if (campo === 'precio') productos[idx].precio = Number(req.body.precio) || 0;
      else if (campo === 'destacado' || campo === 'disponible') productos[idx][campo] = !!req.body[campo];
      else productos[idx][campo] = req.body[campo];
    }
  });

  guardarProductos(productos);
  res.json(productos[idx]);
});

app.delete('/api/productos/:id', requireAuth, (req, res) => {
  let productos = leerProductos();
  const producto = productos.find(p => p.id === req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  // Borra la imagen asociada si fue subida localmente
  if (producto.imagen && producto.imagen.startsWith('productos/')) {
    const rutaImagen = path.join(__dirname, 'public', producto.imagen);
    fs.unlink(rutaImagen, () => {});
  }

  productos = productos.filter(p => p.id !== req.params.id);
  guardarProductos(productos);
  res.json({ ok: true });
});

app.post('/api/productos/:id/imagen', requireAuth, upload.single('imagen'), (req, res) => {
  const productos = leerProductos();
  const idx = productos.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen' });

  // Borra la imagen anterior si era un archivo local subido antes
  const anterior = productos[idx].imagen;
  if (anterior && anterior.startsWith('productos/')) {
    const rutaAnterior = path.join(__dirname, 'public', anterior);
    fs.unlink(rutaAnterior, () => {}); // si falla, no pasa nada
  }

  productos[idx].imagen = 'productos/' + req.file.filename;
  guardarProductos(productos);
  res.json(productos[idx]);
});

app.listen(PORT, () => {
  console.log(`Catálogo M&D Beauty corriendo en http://localhost:${PORT}`);
  console.log(`Panel admin en http://localhost:${PORT}/admin`);
});
