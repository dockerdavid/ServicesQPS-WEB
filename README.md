
# qps-web

## Project Setup

Instalá las dependencias con:

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

## Archivos Estáticos

Los archivos estáticos de la aplicación se encuentran en la carpeta `public/`, estructurados de la siguiente forma:

### Cambiar el Favicon

Para cambiar el favicon de la web, debés subir un archivo llamado `favicon.ico` dentro de la carpeta:

```
/public/favicon/favicon.ico
```

Asegurate de que el archivo se llame exactamente `favicon.ico` para que el navegador lo detecte correctamente.

---

### Subir Imágenes

Las imágenes generales del sitio deben colocarse dentro de la carpeta:

```
/public/images/
```

Ejemplo:
- `logoqps.png` → imagen del logo principal de la aplicación.

---

### Subir SVGs

Los íconos o recursos SVG deben colocarse dentro de la carpeta:

```
/public/images/svgs/
```

Ejemplos:
- `empty.svg` → ícono para estados vacíos.
- `not-found.svg` → ícono para páginas o recursos no encontrados.

---

