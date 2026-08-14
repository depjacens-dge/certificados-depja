/**
 * CONFIGURACIÓN CENTRALIZADA DE LA APLICACIÓN
 * 
 * Modifica estos valores para cambiar el correo del responsable, 
 * la URL del servidor en la nube (Vercel/GitHub), o el enlace de Google Sheets/Drive.
 */

const CONFIG = {
  // ==========================================
  // 1. DATOS DEL RESPONSABLE Y CONTACTO
  // ==========================================
  // Cambia este correo por el de la persona a la que le prestarás el servicio
  correoResponsable: 'vitor.ejemplo@educacion.gob.ar', 
  nombreInstitucion: 'DIRECCIÓN DE EDUCACIÓN PERMANENTE DE JÓVENES Y ADULTOS',
  subtituloConvenio: 'CONVENIO SEGURIDAD PRIVADA - DIRECCIÓN DE EDUCACIÓN PERMANENTE DE JÓVENES Y ADULTOS',

  // ==========================================
  // 2. ENLACE Y SERVIDOR DE BASE DE DATOS (GOOGLE DRIVE / SHEETS)
  // ==========================================
  // Pega aquí la URL de la WebApp desplegada en Google Apps Script
  // Ejemplo: 'https://script.google.com/macros/s/AKfycbx.../exec'
  googleAppsScriptUrl: '', 

  // ==========================================
  // 3. DOMINIO WEB ALOJADO (VERCEL / GITHUB PAGES / SERVIDOR PROPIO)
  // ==========================================
  // Cuando subas la app a Vercel o GitHub Pages, coloca aquí la URL pública
  // Ejemplo: 'https://certificados-depja.vercel.app'
  appBaseUrl: window.location.origin, 

  // ==========================================
  // 4. MODO DE FUNCIONAMIENTO
  // ==========================================
  // true = Permite probar la app localmente guardando en localStorage si no hay conexión con Google Drive.
  modoPruebasLocal: true,

  // Versión del Sistema
  version: '1.0.0'
};

// Exportar para uso global en el navegador
window.CONFIG = CONFIG;
