/**
 * CONECTOR API CON GOOGLE DRIVE (GOOGLE SHEETS) Y ALMACENAMIENTO LOCAL
 */

class DriveAPI {
  constructor() {
    this.storageKey = 'depja_certificados_local';
  }

  // Guardar certificado (en Google Drive si hay URL, sino en localStorage)
  async guardarCertificado(certificadoData) {
    const config = window.CONFIG || {};
    certificadoData.correoResponsable = config.correoResponsable || '';
    
    // Almacenar en localStorage para respaldo siempre
    this.guardarEnLocalStorage(certificadoData);

    // Si está configurada la URL de Google Apps Script, enviar a Google Drive
    if (config.googleAppsScriptUrl && config.googleAppsScriptUrl.trim() !== '') {
      try {
        const response = await fetch(config.googleAppsScriptUrl, {
          method: 'POST',
          mode: 'no-cors', // Requerido para peticiones directas a Google Apps Script
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(certificadoData)
        });
        
        return {
          exito: true,
          destino: 'Google Drive & Local',
          mensaje: 'Certificado registrado exitosamente en Google Drive y respaldo local.'
        };
      } catch (error) {
        console.warn('Error al conectar con Google Drive:', error);
        return {
          exito: true,
          destino: 'Local (Modo Respaldo)',
          mensaje: 'Guardado localmente. (Ocurrió un aviso con la conexión a Google Drive).'
        };
      }
    } else {
      return {
        exito: true,
        destino: 'Local',
        mensaje: 'Guardado en la memoria local (Modo pruebas). Para sincronizar con Google Drive, configure `googleAppsScriptUrl` en `config.js`.'
      };
    }
  }

  // Buscar certificado por ID o por DNI
  async buscarCertificado(idO_Dni) {
    const config = window.CONFIG || {};

    // 1. Intentar buscar en Google Drive si hay URL
    if (config.googleAppsScriptUrl && config.googleAppsScriptUrl.trim() !== '') {
      try {
        const url = `${config.googleAppsScriptUrl}?id=${encodeURIComponent(idO_Dni)}&dni=${encodeURIComponent(idO_Dni)}`;
        const response = await fetch(url);
        const resData = await response.json();
        
        if (resData.status === 'success' && resData.found) {
          return { encontrado: true, fuente: 'Google Drive', data: resData.data };
        }
      } catch (err) {
        console.warn('Consulta en Google Drive no disponible, consultando local...', err);
      }
    }

    // 2. Buscar en localStorage
    const locales = this.obtenerLocales();
    const encontrado = locales.find(c => c.idCertificado === idO_Dni || c.dni === idO_Dni);
    
    if (encontrado) {
      return { encontrado: true, fuente: 'Almacenamiento Local', data: encontrado };
    }

    return { encontrado: false, mensaje: 'Certificado no encontrado en los registros.' };
  }

  // Auxiliares de LocalStorage
  obtenerLocales() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch(e) {
      return [];
    }
  }

  guardarEnLocalStorage(cert) {
    const lista = this.obtenerLocales();
    // Reemplazar si existe o agregar
    const idx = lista.findIndex(item => item.idCertificado === cert.idCertificado);
    if (idx >= 0) {
      lista[idx] = cert;
    } else {
      lista.unshift(cert);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(lista));
  }
}

window.driveAPI = new DriveAPI();
