# 🎓 Aplicación Web de Certificados - Convenio Seguridad Privada (DEPJA)

Sistema web en la nube para la emisión, impresión en PDF A4, registro centralizado en **Google Drive (Google Sheets)** y **Verificación pública mediante Código QR** para los certificados de la **Dirección de Educación Permanente de Jóvenes y Adultos**.

---

## 🚀 Inicio Rápido (Modo Pruebas Local)

No se requiere instalar Node.js ni servidores. 
1. Abre el archivo **`index.html`** haciendo doble clic con tu navegador favorito (Chrome, Edge, Firefox, Brave).
2. Llena el formulario con los datos del alumno y escuela.
3. Verás la **Vista Previa en Tiempo Real** en la hoja A4 oficial.
4. Haz clic en **Imprimir / Descargar PDF** para obtener el documento oficial impreso o en PDF.

---

## ⚙️ Modificación de Parámetros (Correo, Servidor y Enlaces)

Todos los valores modificables están centralizados en un solo archivo: **`config.js`**.

```javascript
const CONFIG = {
  // 1. Cambia este correo por el del responsable final
  correoResponsable: 'admin.depja@educacion.gob.ar',

  // 2. Pega aquí la URL de Google Apps Script cuando conectes Google Drive
  googleAppsScriptUrl: 'https://script.google.com/macros/s/.../exec',

  // 3. Dominio de Vercel / GitHub Pages
  appBaseUrl: window.location.origin
};
```

---

## ☁️ Conexión Gratuita con Google Drive (Google Sheets)

Para que cada certificado emitido por cualquier escuela quede registrado automáticamente en una planilla centralizada en tu Google Drive:

1. Ve a tu **Google Drive** ([drive.google.com](https://drive.google.com)) y crea una planilla llamada `Registro_Certificados_DEPJA`.
2. En la planilla, ve al menú **Extensiones -> Apps Script**.
3. Copia y pega el contenido del archivo `google-apps-script/Code.gs` incluido en este proyecto.
4. En el botón azul **Desplegar** (arriba a la derecha), selecciona:
   - **Nuevo despliegue**
   - Tipo: **Aplicación Web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona** (Anyone)
5. Copia la URL generada (`https://script.google.com/macros/s/.../exec`).
6. Pégala en **`config.js`** dentro de `googleAppsScriptUrl`.

---

## 🌐 Alojamiento Gratuito en la Nube (Vercel / GitHub Pages)

### Opción A: Vercel (Recomendado - 1 minuto)
1. Inicia sesión en [Vercel.com](https://vercel.com).
2. Arrastra la carpeta completa del proyecto o conéctala desde GitHub.
3. Vercel te dará una URL gratuita en vivo como `https://certificados-depja.vercel.app`.
4. Coloca esa URL en `config.js` en `appBaseUrl` para que los códigos QR apunten a ese dominio.

### Opción B: GitHub Pages
1. Sube la carpeta a un repositorio público en GitHub.
2. Ve a **Settings -> Pages** y activa el despliegue desde la rama `main`.
3. Tu app estará pública en `https://tu-usuario.github.io/tu-repo/`.

---

## 📱 Verificación de Códigos QR

Cada certificado impreso incluye un **Código QR de Autenticidad**. Al ser escaneado con la cámara de cualquier teléfono celular, abrirá automáticamente la página **`validar.html`**, consultará en tiempo real la base de datos de Google Drive y confirmará si el certificado es legítimo y auténtico.
