# Catálogo M&D Beauty + Panel de administración

Este proyecto tiene dos partes:

1. **Catálogo público** (`/`) — lo que ven tus clientes, igual al diseño original.
2. **Panel de administración** (`/admin`) — desde ahí editas todo sin tocar código:
   nombre, precio, categoría, descripción, foto, y si está **disponible** o **agotado**.

Cuando marcas un producto como "Agotado" en el panel, en el catálogo público
aparece automáticamente la foto oscurecida con una etiqueta **"AGOTADO"** encima,
y el botón de pedir por WhatsApp se desactiva.

## 1. Instalar (una sola vez)

Necesitas tener [Node.js](https://nodejs.org) instalado (versión 18 o más reciente).

```bash
cd catalogo-app
npm install
```

## 2. Configurar tu contraseña de administrador

Copia el archivo `.env.example` y renómbralo a `.env`:

```bash
cp .env.example .env
```

Abre `.env` con cualquier editor de texto y cambia esta línea por la contraseña
que tú quieras usar para entrar al panel:

```
ADMIN_PASSWORD=cambiaEstaClave123
```

También puedes cambiar `SESSION_SECRET` por cualquier texto largo (no lo compartas).

## 3. Iniciar el catálogo

```bash
npm start
```

Vas a ver un mensaje así:

```
Catálogo M&D Beauty corriendo en http://localhost:3000
Panel admin en http://localhost:3000/admin
```

- Catálogo público: **http://localhost:3000**
- Panel de administración: **http://localhost:3000/admin**

Mientras esta ventana esté abierta, el catálogo está funcionando. Para apagarlo,
cierra la ventana o presiona `Ctrl + C`.

## 4. Usar el panel de administración

1. Entra a `http://localhost:3000/admin`
2. Escribe la contraseña que pusiste en el paso 2
3. Desde ahí puedes:
   - **Editar** nombre, categoría, precio y descripción de cualquier producto
   - **Subir una nueva foto** haciendo clic sobre la miniatura de cada producto
   - **Marcar Disponible / Agotado** con el interruptor — al marcarlo como Agotado,
     el catálogo público muestra el sello "AGOTADO" encima de la foto
   - **Agregar productos nuevos** desde el formulario de arriba
   - **Eliminar productos** que ya no vendas

Todos los cambios se guardan automáticamente en `data/productos.json` y se ven
al instante recargando el catálogo público.

## 5. Publicarlo en internet (para que tus clientes lo vean)

Ahora mismo el catálogo solo corre en tu computador (`localhost`). Para que
cualquier persona pueda verlo desde su celular, necesitas subir este proyecto
a un servicio de hosting que soporte Node.js, por ejemplo:

- [Render](https://render.com) (tiene plan gratuito, es el más sencillo)
- [Railway](https://railway.app)
- Un VPS propio si ya tienes uno para tu CRM

En cualquiera de esos, subes esta carpeta (o la conectas a un repositorio de
GitHub), configuras las variables de entorno `ADMIN_PASSWORD` y `SESSION_SECRET`
en su panel, y el servicio ejecuta `npm install` y `npm start` automáticamente.
Si quieres, te ayudo con ese paso cuando estés listo para publicarlo.

## Estructura del proyecto

```
catalogo-app/
  server.js              -> el servidor (rutas de la API, login, subida de fotos)
  data/productos.json     -> aquí viven todos tus productos (no lo edites a mano)
  public/
    index.html             -> catálogo público
    productos/              -> fotos de los productos
    admin/index.html         -> panel de administración
  .env                    -> tu contraseña (creado por ti en el paso 2, no se sube a git)
```

## Notas

- Las fotos se guardan dentro de `public/productos/`. El panel las sube por ti,
  no necesitas copiar archivos a mano.
- El límite de tamaño por foto es 8MB.
- Si algún día quieres agregar más administradores con contraseñas distintas,
  o un historial de quién cambió qué, lo podemos ampliar más adelante.
