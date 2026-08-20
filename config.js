/**
 * CONFIGURACIÓN CENTRALIZADA DE LA APLICACIÓN
 * 
 * Modifica estos valores para cambiar el correo del responsable, 
 * la URL del servidor en la nube (Vercel/GitHub), o el enlace de Google Sheets/Drive.
 */

// Detección automática del dominio base (funciona en Local y en GitHub Pages)
const getAutoBaseUrl = () => {
  const origin = window.location.origin;
  const path = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/validar\.html$/, '').replace(/\/$/, '');
  return `${origin}${path}`;
};

const CONFIG = {
  // ==========================================
  // 1. DATOS DEL RESPONSABLE Y CONTACTO
  // ==========================================
  // Cambia este correo por el de la persona a la que le prestarás el servicio
  correoResponsable: 'admin.depja@educacion.gob.ar', 
  nombreInstitucion: 'DIRECCIÓN DE EDUCACIÓN PERMANENTE DE JÓVENES Y ADULTOS',
  subtituloConvenio: 'CONVENIO SEGURIDAD PRIVADA - DIRECCIÓN DE EDUCACIÓN PERMANENTE DE JÓVENES Y ADULTOS',

  // ==========================================
  // 2. BASE DE DATOS EN LA NUBE (INSFORGE POSTGRESQL)
  // ==========================================
  insforge: {
    baseUrl: 'https://44t68c5e.us-east.insforge.app',
    anonKey: 'anon_8f4f89d0ee4d18215ac544fd1126bbfb3d74ce02399290ffb8cc6e519a3ceccb',
    tabla: 'certificados'
  },

  // ==========================================
  // 3. CONSULTA SEGURA DE PADRÓN EN GOOGLE DRIVE (APPS SCRIPT)
  // ==========================================
  padronDrive: {
    token: 'DEPJA_MENDOZA_PADRON_2026',
    urls: [
      'https://script.google.com/macros/s/AKfycbzYz4_XzvJhM5tQZPZgGEWQwSekKUkPTIj55SO7M9u4vKCo8W3mmfACxMgAQG2i8rmDmQ/exec',
      'https://script.google.com/macros/s/AKfycbxeH5bRtZJKkwww2PBpdIK8ykyh6Z6DJedbwXLVF-SwI8C8RxDHz8wYA8c9dWyx4IaYMA/exec'
    ]
  }, 

  // ==========================================
  // 4. DOMINIO WEB ALOJADO (GITHUB PAGES / VERCEL / SERVIDOR PROPIO)
  // ==========================================
  // Se detecta automáticamente en GitHub Pages (ej: https://2008-tdh.github.io/certificados-depja)
  appBaseUrl: getAutoBaseUrl(), 

  // ==========================================
  // 5. MODO DE FUNCIONAMIENTO
  // ==========================================
  modoPruebasLocal: false,

  // Versión del Sistema
  version: '1.1.0'
};

// Exportar para uso global en el navegador
window.CONFIG = CONFIG;
