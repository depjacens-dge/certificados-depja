/**
 * CONECTOR DE BASE DE DATOS INSFORGE (POSTGRESQL CLOUD) + EXPORTACIÓN EXCEL / CSV + LOCAL
 */

class DatabaseAPI {
  constructor() {
    this.storageKey = 'depja_certificados_local';
  }

  // Obtener headers de autorización para InsForge
  getInsforgeHeaders() {
    const config = window.CONFIG || {};
    const key = config.insforge?.anonKey || '';
    return {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`
    };
  }

  // Transformar objeto del formulario al esquema de la tabla de InsForge
  formatearParaInsforge(certData) {
    const config = window.CONFIG || {};
    const auth = window.authManager || {};
    const escuelaId = certData.escuelaId || (auth.currentUser?.escuela_id) || (auth.currentSchool?.id) || null;

    return {
      id_certificado: certData.idCertificado,
      escuela_id: escuelaId,
      nombre_apellido: certData.nombreApellido,
      dni: certData.dni,
      localidad: certData.localidad || '',
      escuela_origen: certData.escuelaOrigen || '',
      cue: certData.cue || '',
      ano_cursado: certData.anoCursado || '',
      ano: certData.ano || '',
      opcion_pedagogica: certData.opcionPedagogica || '',
      espacios_acreditados: certData.espaciosAcreditados || [],
      fecha_inscripcion: certData.fechaInscripcion || '',
      fecha_emision: certData.fechaEmision || '',
      hash_verificacion: certData.hashVerificacion || '',
      correo_responsable: certData.correoResponsable || config.correoResponsable || '',
      firma_url: certData.firmaImagenDataUrl || null
    };
  }

  // Transformar fila de InsForge al formato interno de la aplicación
  formatearDesdeInsforge(row) {
    return {
      idCertificado: row.id_certificado,
      escuelaId: row.escuela_id || null,
      nombreApellido: row.nombre_apellido,
      dni: row.dni,
      localidad: row.localidad || '',
      escuelaOrigen: row.escuela_origen || '',
      cue: row.cue || '',
      anoCursado: row.ano_cursado || '',
      ano: row.ano || '',
      opcionPedagogica: row.opcion_pedagogica || '',
      espaciosAcreditados: Array.isArray(row.espacios_acreditados) 
        ? row.espacios_acreditados 
        : (row.espacios_acreditados ? [row.espacios_acreditados] : []),
      fechaInscripcion: row.fecha_inscripcion || '',
      fechaEmision: row.fecha_emision || '',
      hashVerificacion: row.hash_verificacion || '',
      correoResponsable: row.correo_responsable || '',
      firmaImagenDataUrl: row.firma_url || null,
      createdAt: row.created_at
    };
  }

  // Guardar certificado en InsForge Cloud, Google Drive (si está activo) y LocalStorage
  async guardarCertificado(certificadoData) {
    const config = window.CONFIG || {};
    certificadoData.correoResponsable = config.correoResponsable || '';
    
    // 1. Siempre guardar copia en LocalStorage como respaldo rápido
    this.guardarEnLocalStorage(certificadoData);

    let guardadoEnInsforge = false;
    let mensajeInsforge = '';

    // 2. Guardar en InsForge Cloud (PostgreSQL)
    if (config.insforge && config.insforge.baseUrl && config.insforge.anonKey) {
      try {
        const payload = [this.formatearParaInsforge(certificadoData)];
        const url = `${config.insforge.baseUrl}/api/database/records/${config.insforge.tabla || 'certificados'}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: this.getInsforgeHeaders(),
          body: JSON.stringify(payload)
        });

        if (response.ok || response.status === 201) {
          guardadoEnInsforge = true;
          mensajeInsforge = 'Guardado exitosamente en Base de Datos InsForge Cloud.';
        } else {
          const errText = await response.text();
          console.warn('Respuesta InsForge:', response.status, errText);
        }
      } catch (err) {
        console.warn('Error al conectar con InsForge:', err);
      }
    }

    // 3. Si además está configurado Google Apps Script, enviar respaldo a Google Drive
    if (config.googleAppsScriptUrl && config.googleAppsScriptUrl.trim() !== '') {
      try {
        await fetch(config.googleAppsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(certificadoData)
        });
      } catch (err) {
        console.warn('Aviso de conexión Google Drive:', err);
      }
    }

  // Actualizar un certificado existente en InsForge Cloud (ej: al asignar a una escuela)
  async actualizarCertificadoEnInsforge(idCertificado, camposActualizados) {
    const config = window.CONFIG || {};
    if (config.insforge && config.insforge.baseUrl && config.insforge.anonKey) {
      try {
        const tabla = config.insforge.tabla || 'certificados';
        const url = `${config.insforge.baseUrl}/api/database/records/${tabla}?id_certificado=eq.${encodeURIComponent(idCertificado)}`;
        
        const res = await fetch(url, {
          method: 'PATCH',
          headers: this.getInsforgeHeaders(),
          body: JSON.stringify(camposActualizados)
        });

        if (res.ok) {
          return { exito: true, mensaje: 'Certificado actualizado exitosamente en InsForge Cloud.' };
        }
      } catch (err) {
        console.warn('Error al actualizar en InsForge:', err);
      }
    }
    return { exito: false, mensaje: 'No se pudo actualizar en la base de datos.' };
  }

  // Buscar certificado por ID de Certificado o por DNI (Búsqueda instantánea en InsForge)
  async buscarCertificado(idO_Dni) {
    const config = window.CONFIG || {};
    const busqueda = (idO_Dni || '').trim();

    if (!busqueda) {
      return { encontrado: false, mensaje: 'Debe ingresar un código o DNI para buscar.' };
    }

    // 1. Intentar buscar en InsForge Cloud
    if (config.insforge && config.insforge.baseUrl && config.insforge.anonKey) {
      try {
        const tabla = config.insforge.tabla || 'certificados';
        
        // Búsqueda por ID exacto
        let url = `${config.insforge.baseUrl}/api/database/records/${tabla}?id_certificado=eq.${encodeURIComponent(busqueda)}`;
        let res = await fetch(url, { headers: this.getInsforgeHeaders() });
        
        if (res.ok) {
          let rows = await res.json();
          if (rows && rows.length > 0) {
            return { encontrado: true, fuente: 'InsForge Cloud Database (Oficial)', data: this.formatearDesdeInsforge(rows[0]) };
          }
        }

        // Si no encontró por ID, buscar por DNI directo
        url = `${config.insforge.baseUrl}/api/database/records/${tabla}?dni=eq.${encodeURIComponent(busqueda)}`;
        res = await fetch(url, { headers: this.getInsforgeHeaders() });
        
        if (res.ok) {
          let rows = await res.json();
          if (rows && rows.length > 0) {
            return { encontrado: true, fuente: 'InsForge Cloud Database (Oficial)', data: this.formatearDesdeInsforge(rows[0]) };
          }
        }

        // Probar también buscando sin puntos (ej: 38452891)
        const cleanDni = busqueda.replace(/\D/g, '');
        if (cleanDni && cleanDni !== busqueda) {
          url = `${config.insforge.baseUrl}/api/database/records/${tabla}?dni=eq.${encodeURIComponent(cleanDni)}`;
          res = await fetch(url, { headers: this.getInsforgeHeaders() });
          if (res.ok) {
            let rows = await res.json();
            if (rows && rows.length > 0) {
              return { encontrado: true, fuente: 'InsForge Cloud Database (Oficial)', data: this.formatearDesdeInsforge(rows[0]) };
            }
          }
        }
      } catch (err) {
        console.warn('Error consultando InsForge Cloud, intentando fuentes alternativas...', err);
      }
    }

    // 2. Consultar Padrón Privado en Google Drive (Apps Script Multi-Planilla)
    const padronDrive = config.padronDrive || {};
    const driveUrls = padronDrive.urls || [];
    const token = padronDrive.token || 'DEPJA_MENDOZA_PADRON_2026';
    const dniLimpio = busqueda.replace(/\D/g, '');

    if (dniLimpio && driveUrls.length > 0) {
      for (let i = 0; i < driveUrls.length; i++) {
        const baseUrl = driveUrls[i];
        if (!baseUrl) continue;
        try {
          const fetchUrl = `${baseUrl}?token=${encodeURIComponent(token)}&dni=${encodeURIComponent(dniLimpio)}`;
          const response = await fetch(fetchUrl);
          const resData = await response.json();

          if (resData && resData.encontrado) {
            // Adaptar campos al formato de la aplicación
            const alumnoData = {
              idCertificado: `CERT-DEPJA-${Math.floor(100000 + Math.random() * 900000)}`,
              nombreApellido: resData.nombreApellido || '',
              dni: resData.dni || busqueda,
              escuelaOrigen: resData.escuelaOrigen || 'Pendiente de Asignación',
              cue: resData.cue || '',
              localidad: resData.localidad || 'Mendoza',
              anoCursado: resData.anoCursado || '2º',
              ano: resData.ano || new Date().getFullYear().toString(),
              opcionPedagogica: resData.opcionPedagogica || 'Presencial',
              espaciosAcreditados: resData.espaciosAcreditados || 'Lengua y Literatura I (Aprobado); Matemática I (Aprobado)',
              fechaInscripcion: resData.fechaInscripcion || new Date().toLocaleDateString('es-AR'),
              fechaEmision: new Date().toLocaleDateString('es-AR'),
              esPadronDrive: true,
              origenPlanilla: `Google Drive (Planilla ${i + 1})`
            };

            return {
              encontrado: true,
              fuente: `Google Drive - Padrón General (Planilla ${i + 1})`,
              data: alumnoData
            };
          }
        } catch (err) {
          console.warn(`Error consultando Apps Script Planilla ${i + 1}:`, err);
        }
      }
    }

    // 3. Buscar en LocalStorage
    const locales = this.obtenerLocales();
    const encontrado = locales.find(c => 
      (c.idCertificado && c.idCertificado.toLowerCase() === busqueda.toLowerCase()) || 
      (c.dni && c.dni.replace(/\D/g, '') === busqueda.replace(/\D/g, ''))
    );
    
    if (encontrado) {
      return { encontrado: true, fuente: 'Almacenamiento Local (Caché)', data: encontrado };
    }

    return { encontrado: false, mensaje: 'Estudiante no encontrado en el Padrón General ni en certificados emitidos.' };
  }

  // Obtener lista completa de certificados (desde InsForge o Local) con soporte de filtros por Escuela
  async obtenerHistorialCompleto(filtroEscuelaId = null) {
    const config = window.CONFIG || {};
    const auth = window.authManager || {};
    
    // Si el usuario es de una escuela específica, restringir a su escuela_id
    let escuelaFiltro = filtroEscuelaId;
    if (auth.esEscuela && auth.esEscuela()) {
      escuelaFiltro = auth.currentUser?.escuela_id || auth.currentSchool?.id || null;
    }
    
    if (config.insforge && config.insforge.baseUrl && config.insforge.anonKey) {
      try {
        const tabla = config.insforge.tabla || 'certificados';
        let url = `${config.insforge.baseUrl}/api/database/records/${tabla}?order=created_at.desc&limit=200`;
        
        if (escuelaFiltro) {
          url += `&escuela_id=eq.${encodeURIComponent(escuelaFiltro)}`;
        }

        const res = await fetch(url, { headers: this.getInsforgeHeaders() });
        
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map(r => this.formatearDesdeInsforge(r));
          }
        }
      } catch (err) {
        console.warn('No se pudo cargar historial desde InsForge, usando local:', err);
      }
    }

    const locales = this.obtenerLocales();
    if (escuelaFiltro) {
      return locales.filter(c => c.escuelaId === escuelaFiltro || c.escuelaOrigen?.includes(escuelaFiltro));
    }
    return locales;
  }

  // Exportar registros a formato CSV compatible con Microsoft Excel y Google Sheets
  async exportarAExcelCSV() {
    const lista = await this.obtenerHistorialCompleto();
    if (!lista || lista.length === 0) {
      alert('No hay certificados registrados para exportar.');
      return;
    }

    const headers = [
      'ID Certificado',
      'Fecha Emision',
      'DNI',
      'Nombre y Apellido',
      'Escuela de Origen',
      'CUE',
      'Localidad',
      'Ano Cursado',
      'Ano Lectivo',
      'Opcion Pedagogica',
      'Materias Acreditadas',
      'Fecha Inscripcion',
      'Email Responsable'
    ];

    const filas = lista.map(c => [
      `"${c.idCertificado || ''}"`,
      `"${c.fechaEmision || ''}"`,
      `"${c.dni || ''}"`,
      `"${(c.nombreApellido || '').replace(/"/g, '""')}"`,
      `"${(c.escuelaOrigen || '').replace(/"/g, '""')}"`,
      `"${c.cue || ''}"`,
      `"${(c.localidad || '').replace(/"/g, '""')}"`,
      `"${c.anoCursado || ''}"`,
      `"${c.ano || ''}"`,
      `"${c.opcionPedagogica || ''}"`,
      `"${(c.espaciosAcreditados || []).join('; ').replace(/"/g, '""')}"`,
      `"${c.fechaInscripcion || ''}"`,
      `"${c.correoResponsable || ''}"`
    ]);

    // BOM UTF-8 para que Excel abra los acentos y caracteres especiales perfectamente
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(';'), ...filas.map(f => f.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fechaHoy = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Certificados_DEPJA_Mendoza_${fechaHoy}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    const idx = lista.findIndex(item => item.idCertificado === cert.idCertificado);
    if (idx >= 0) {
      lista[idx] = cert;
    } else {
      lista.unshift(cert);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(lista));
  }
}

// Compatibilidad con window.driveAPI y nuevo DatabaseAPI
window.databaseAPI = new DatabaseAPI();
window.driveAPI = window.databaseAPI;

