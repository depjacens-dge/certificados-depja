# 🎓 Aplicación Web de Certificados (DEPJA Mendoza - Convenio Seguridad Privada)

Sistema web en la nube para la emisión, impresión A4 oficial, registro centralizado en **Google Drive (Google Sheets)** y **Verificación por Código QR** para la **Dirección de Educación Permanente de Jóvenes y Adultos**.

---

## 📌 Guía de Despliegue en GitHub Pages y Google Drive

El proyecto ya está inicializado con **Git** y listo para subirse a GitHub.

---

### Paso 1: Subir a tu GitHub Pages (Alojamiento Gratuito)

1. Ingresa a tu cuenta de GitHub ([github.com/new](https://github.com/new)) y crea un nuevo repositorio público (ejemplo: `certificados-depja`).
2. Abre la terminal en la carpeta del proyecto y ejecuta:

```bash
git remote add origin https://github.com/TU_USUARIO/certificados-depja.git
git branch -M main
git push -u origin main
```

3. En GitHub, ve a **Settings -> Pages**.
4. En **Source**, selecciona `Deploy from a branch` y elige la rama **`main`** / `/ (root)`.
5. En 1 minuto tendrás tu enlace público de GitHub Pages (ejemplo: `https://TU_USUARIO.github.io/certificados-depja/`).

---

### Paso 2: Conectar con Google Drive (Google Sheets)

Para que todos los certificados emitidos se guarden automáticamente en tu Google Drive:

1. Abre tu **Google Drive** ([drive.google.com](https://drive.google.com)).
2. Crea una nueva Planilla de Google Sheets llamada `Registro_Certificados_DEPJA`.
3. En el menú superior, ve a **Extensiones -> Apps Script**.
4. Borra el código existente y pega todo el contenido del archivo [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
5. Haz clic en el botón azul **Desplegar -> Nuevo despliegue**.
6. Selecciona:
   - **Tipo**: Aplicación Web
   - **Ejecutar como**: Yo
   - **Quién tiene acceso**: Cualquier persona (*Anyone*)
7. Haz clic en **Desplegar** y copia la URL generada (`https://script.google.com/macros/s/.../exec`).

---

### Paso 3: Configurar o Cambiar Datos (`config.js`)

Abre el archivo **[`config.js`](config.js)**. Es el único lugar que debes editar:

```javascript
const CONFIG = {
  // 1. Correo del Responsable (Cambiar por el tuyo o el del cliente en el futuro)
  correoResponsable: 'tu-correo@ejemplo.com', 

  // 2. URL de Google Apps Script (Obtenida en el Paso 2)
  googleAppsScriptUrl: 'https://script.google.com/macros/s/AKfycb.../exec', 

  // 3. Dominio de GitHub Pages
  appBaseUrl: window.location.origin
};
```

---

## 🔄 ¿Cómo cambiar la cuenta o entregar el servicio al cliente más adelante?

Cuando entregues este servicio al cliente final:
1. Pídele su correo e insértalo en `correoResponsable` dentro de `config.js`.
2. Repite el **Paso 2** en la cuenta de Google Drive del cliente y actualiza `googleAppsScriptUrl` en `config.js`.
3. Haz un `git commit` y `git push` a GitHub y el cambio se actualizará en vivo al instante.
