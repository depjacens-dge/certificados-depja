# 🎓 Aplicación Web de Certificados (DEPJA Mendoza - Convenio Seguridad Privada)

Sistema web en la nube para la emisión, impresión A4 oficial, registro centralizado en **Google Drive (Google Sheets)** y **Verificación por Código QR** para la **Dirección de Educación Permanente de Jóvenes y Adultos**.

---

## 🗄️ Base de Datos en la Nube (InsForge PostgreSQL)

El sistema está conectado directamente con **InsForge** (`https://44t68c5e.us-east.insforge.app`), proporcionando:

* **Portal de Acceso Institucional ([`login.html`](login.html))**: Ventana de ingreso oficial con selector de Escuelas/CENS y acceso exclusivo para el Administrador General.
* **Panel de Administración Central ([`admin.html`](admin.html))**: Módulo para dar de alta, editar y gestionar todas las escuelas de Mendoza y sus cuentas de acceso.
* **Subida y Procesamiento de Planillas Excel (.xlsx, .xls, .csv)**: Módulo interactivo con arrastrar y soltar para dar de alta nóminas completas de alumnos en lote o cargarlos individualmente al formulario.
* **Almacenamiento permanente y seguro** de todos los certificados emitidos en la nube (**InsForge PostgreSQL**).
* **Validación instantánea por Código QR** en [`validar.html`](validar.html) (< 100 ms).
* **Exportación directa a Excel / CSV** desde el botón de Historial para los administrativos.
* **Respaldo local automático (LocalStorage)** para operar incluso con cortes de conexión.

---

## 📌 Guía de Despliegue en GitHub Pages

El proyecto ya está inicializado con **Git** y listo para subirse a GitHub:

1. Ingresa a tu cuenta de GitHub ([github.com/new](https://github.com/new)) y crea tu repositorio (ejemplo: `certificados-depja`).
2. En la terminal ejecuta:

```bash
git remote add origin https://github.com/TU_USUARIO/certificados-depja.git
git branch -M main
git push -u origin main
```

3. En GitHub, ve a **Settings -> Pages** y selecciona la rama **`main`**.
4. ¡Listo! Tendrás la aplicación funcionando online con base de datos en la nube.

---

### Configuración (`config.js`)

Todos los parámetros de conexión están centralizados en **[`config.js`](config.js)**:

```javascript
const CONFIG = {
  // Datos del Responsable
  correoResponsable: 'admin.depja@educacion.gob.ar', 

  // Base de Datos InsForge
  insforge: {
    baseUrl: 'https://44t68c5e.us-east.insforge.app',
    anonKey: 'anon_8f4f89d0ee4d18215ac544fd1126bbfb3d74ce02399290ffb8cc6e519a3ceccb',
    tabla: 'certificados'
  }
};
```

---

## 🔄 ¿Cómo cambiar la cuenta o entregar el servicio al cliente más adelante?

Cuando entregues este servicio al cliente final:
1. Pídele su correo e insértalo en `correoResponsable` dentro de `config.js`.
2. Repite el **Paso 2** en la cuenta de Google Drive del cliente y actualiza `googleAppsScriptUrl` en `config.js`.
3. Haz un `git commit` y `git push` a GitHub y el cambio se actualizará en vivo al instante.
