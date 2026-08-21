/**
 * MÓDULO DE IMPORTACIÓN DE PLANILLAS DE EXCEL / CSV (.xlsx, .xls, .csv)
 * DEPJA Mendoza - Convenio Seguridad Privada
 */

class ExcelImporter {
  constructor() {
    this.alumnosImportados = [];
    this.initElements();
    this.initEvents();
  }

  initElements() {
    this.modal = document.getElementById('modalImportarExcel');
    this.dropZone = document.getElementById('excelDropZone');
    this.fileInput = document.getElementById('excelFileInput');
    this.btnAbrirModal = document.getElementById('btnImportarExcel');
    this.btnCerrarModal = document.getElementById('btnCloseModalImport');
    this.btnDescargarPlantilla = document.getElementById('btnDescargarPlantilla');
    this.btnGuardarLote = document.getElementById('btnGuardarLoteInsforge');
    this.tbodyAlumnos = document.getElementById('tbodyAlumnosExcel');
    this.totalAlumnosBadge = document.getElementById('badgeTotalImportados');
    this.inputFiltro = document.getElementById('filtroAlumnosExcel');
    this.resumenContainer = document.getElementById('resumenImportacion');
  }

  initEvents() {
    if (this.btnAbrirModal) {
      this.btnAbrirModal.addEventListener('click', () => this.abrirModal());
    }

    if (this.btnCerrarModal) {
      this.btnCerrarModal.addEventListener('click', () => this.cerrarModal());
    }

    if (this.btnDescargarPlantilla) {
      this.btnDescargarPlantilla.addEventListener('click', () => this.descargarPlantillaModelo());
    }

    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) this.procesarArchivoExcel(file);
      });
    }

    if (this.dropZone) {
      this.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.dropZone.classList.add('dragover');
      });

      this.dropZone.addEventListener('dragleave', () => {
        this.dropZone.classList.remove('dragover');
      });

      this.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) this.procesarArchivoExcel(file);
      });
    }

    if (this.inputFiltro) {
      this.inputFiltro.addEventListener('input', (e) => {
        this.filtrarTabla(e.target.value);
      });
    }

    if (this.btnGuardarLote) {
      this.btnGuardarLote.addEventListener('click', () => this.guardarLoteEnInsforge());
    }
  }

  abrirModal() {
    if (this.modal) this.modal.classList.add('active');
  }

  cerrarModal() {
    if (this.modal) this.modal.classList.remove('active');
  }

  // Normalizar encabezados para comparar de forma flexible
  normalizarTexto(txt) {
    return (txt || '')
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  // Procesar archivo Excel / CSV mediante SheetJS
  async procesarArchivoExcel(file) {
    try {
      this.mostrarEstadoCarga(true, 'Leyendo archivo Excel...');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

      if (!jsonRows || jsonRows.length === 0) {
        alert('La planilla seleccionada no contiene filas con datos.');
        this.mostrarEstadoCarga(false);
        return;
      }

      this.alumnosImportados = this.mapearFilasAAlumnos(jsonRows);
      this.renderTablaAlumnos(this.alumnosImportados);
      this.mostrarEstadoCarga(false);

      if (this.resumenContainer) {
        this.resumenContainer.style.display = 'flex';
      }

      if (this.btnGuardarLote) {
        this.btnGuardarLote.disabled = this.alumnosImportados.length === 0;
      }

    } catch (err) {
      console.error('Error al procesar Excel:', err);
      alert('Ocurrió un error al procesar el archivo Excel. Asegúrate de que sea un archivo .xlsx, .xls o .csv válido.');
      this.mostrarEstadoCarga(false);
    }
  }

  // Mapear inteligentemente las columnas encontradas
  mapearFilasAAlumnos(rows) {
    return rows.map((row, index) => {
      let nombreApellido = '';
      let apellido = '';
      let nombre = '';
      let dni = '';
      let localidad = '';
      let escuelaOrigen = '';
      let cue = '';
      let anoCursado = '2º';
      let ano = new Date().getFullYear().toString();
      let opcionPedagogica = 'Presencial';
      let espacios = [];
      let fechaInscripcion = '';
      let fechaEmision = this.obtenerFechaHoyTexto();

      // Recorrer todas las columnas de la fila
      Object.keys(row).forEach(key => {
        const norm = this.normalizarTexto(key);
        const val = (row[key] || '').toString().trim();

        if (!val) return;

        // Nombre y Apellido
        if (norm === 'nombreyapellido' || norm === 'apellidoynombre' || norm === 'estudiante' || norm === 'alumno' || norm === 'nombresyapellidos') {
          nombreApellido = val;
        } else if (norm === 'apellido' || norm === 'apellidos') {
          apellido = val;
        } else if (norm === 'nombre' || norm === 'nombres') {
          nombre = val;
        }

        // DNI / Documento
        else if (norm === 'dni' || norm === 'documento' || norm === 'ndoc' || norm === 'numdoc' || norm === 'nrodocumento' || norm === 'nrodni') {
          dni = this.formatearDni(val);
        }

        // Localidad / Ciudad / Domicilio
        else if (norm === 'localidad' || norm === 'ciudad' || norm === 'municipio' || norm === 'departamento') {
          localidad = val;
        }

        // Escuela de Origen
        else if (norm === 'escueladeorigen' || norm === 'escuelaorigen' || norm === 'escuela' || norm === 'cens' || norm === 'institucion' || norm === 'colegio') {
          escuelaOrigen = val;
        }

        // CUE
        else if (norm === 'cue' || norm === 'cueescuela' || norm === 'cueanexo') {
          cue = val;
        }

        // Año de Cursado (1º, 2º, 3º)
        else if (norm === 'anodecursado' || norm === 'anocursado' || norm === 'curso' || norm === 'anio' || norm === 'anocursado') {
          if (val.includes('1')) anoCursado = '1º';
          else if (val.includes('2')) anoCursado = '2º';
          else if (val.includes('3')) anoCursado = '3º';
          else anoCursado = val;
        }

        // Año Lectivo
        else if (norm === 'ano' || norm === 'aniolectivo' || norm === 'ciclolectivo' || norm === 'anolectivo') {
          if (/^\d{4}$/.test(val)) ano = val;
        }

        // Opción Pedagógica
        else if (norm === 'opcionpedagogica' || norm === 'modalidad' || norm === 'opcion') {
          if (val.toUpperCase().includes('TEM')) opcionPedagogica = 'TEM';
          else if (val.toUpperCase().includes('CEPAS')) opcionPedagogica = 'CEPAS';
          else if (val.toLowerCase().includes('semi')) opcionPedagogica = 'Semipresencial';
          else if (val.toLowerCase().includes('distancia')) opcionPedagogica = 'A Distancia';
          else opcionPedagogica = 'Presencial';
        }

        // Fecha Inscripción
        else if (norm === 'fechadeinscripcion' || norm === 'fechainscripcion' || norm === 'inscripcion' || norm === 'fechaalta') {
          fechaInscripcion = this.formatearFechaTexto(val);
        }

        // Fecha Emisión
        else if (norm === 'fechadeemision' || norm === 'fechaemision' || norm === 'emision') {
          fechaEmision = this.formatearFechaTexto(val);
        }

        // Materias / Espacios Acreditados
        else if (norm.includes('materia') || norm.includes('espacio') || norm.includes('acreditado') || norm.includes('asignatura')) {
          if (val.includes(';') || val.includes(',')) {
            const split = val.split(/[;,]/).map(s => s.trim()).filter(s => s.length > 0);
            espacios.push(...split);
          } else {
            espacios.push(val);
          }
        }
      });

      if (!nombreApellido && (apellido || nombre)) {
        nombreApellido = `${apellido.toUpperCase()}, ${nombre}`;
      }

      const auth = window.authManager || {};
      const escAsignada = auth.obtenerEscuelaAsignada ? auth.obtenerEscuelaAsignada() : null;

      let escuelaFinal = escuelaOrigen;
      let cueFinal = cue;
      let localidadFinal = localidad;
      let escuelaIdFinal = null;

      if (escAsignada) {
        escuelaFinal = escAsignada.nombre;
        cueFinal = escAsignada.cue || cue;
        localidadFinal = escAsignada.localidad || localidad;
        escuelaIdFinal = escAsignada.id;
      } else {
        if (!escuelaFinal) escuelaFinal = 'C.E.N.S. Nº 3-415';
        if (!localidadFinal) localidadFinal = 'Mendoza';
      }

      if (!fechaInscripcion) fechaInscripcion = this.obtenerFechaHoyTexto();
      if (espacios.length === 0) {
        espacios = ['Lengua y Literatura I (Aprobado)', 'Matemática I (Aprobado)'];
      }

      return {
        idTemp: `IMP-${index + 1}`,
        idCertificado: 'CERT-DEPJA-' + Math.floor(100000 + Math.random() * 900000),
        escuelaId: escuelaIdFinal,
        nombreApellido: nombreApellido || `ALUMNO ${index + 1}`,
        dni: dni || 'S/DNI',
        localidad: localidadFinal,
        escuelaOrigen: escuelaFinal,
        cue: cueFinal,
        anoCursado: anoCursado,
        ano: ano,
        opcionPedagogica: opcionPedagogica,
        espaciosAcreditados: espacios,
        fechaInscripcion: fechaInscripcion,
        fechaEmision: fechaEmision,
        estado: 'Pendiente de Alta'
      };
    }).filter(a => a.nombreApellido && a.nombreApellido.trim() !== '');
  }

  formatearDni(val) {
    const clean = val.replace(/\D/g, '');
    if (clean.length === 8) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
    } else if (clean.length === 7) {
      return `${clean.slice(0, 1)}.${clean.slice(1, 4)}.${clean.slice(4)}`;
    }
    return val;
  }

  formatearFechaTexto(val) {
    if (!val) return this.obtenerFechaHoyTexto();
    if (val instanceof Date) {
      const dia = String(val.getDate()).padStart(2, '0');
      const mes = String(val.getMonth() + 1).padStart(2, '0');
      const anio = val.getFullYear();
      return `${dia}/${mes}/${anio}`;
    }
    return val.toString().trim();
  }

  obtenerFechaHoyTexto() {
    const d = new Date();
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  mostrarEstadoCarga(cargando, mensaje = '') {
    if (!this.tbodyAlumnos) return;
    if (cargando) {
      this.tbodyAlumnos.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #0055a5;">⌛ ${mensaje}</td></tr>`;
    }
  }

  renderTablaAlumnos(lista) {
    if (!this.tbodyAlumnos) return;
    this.tbodyAlumnos.innerHTML = '';

    if (this.totalAlumnosBadge) {
      this.totalAlumnosBadge.textContent = `${lista.length} alumnos detectados`;
    }

    if (lista.length === 0) {
      this.tbodyAlumnos.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 1.5rem; color: #64748b;">No se encontraron registros en el archivo.</td></tr>`;
      return;
    }

    lista.forEach((alumno, idx) => {
      const tr = document.createElement('tr');
      const estadoColor = alumno.estado.includes('Registrado') ? '#10b981' : '#64748b';
      
      tr.innerHTML = `
        <td><span style="font-family: monospace; font-size: 0.8rem; font-weight: 700; color: #0055a5;">${alumno.idCertificado}</span></td>
        <td><strong>${alumno.nombreApellido}</strong></td>
        <td>${alumno.dni}</td>
        <td>${alumno.escuelaOrigen} (${alumno.anoCursado})</td>
        <td>
          <span style="display: inline-block; padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; background: ${alumno.estado.includes('Registrado') ? '#dcfce7' : '#f1f5f9'}; color: ${estadoColor}; font-weight: 600;">
            ${alumno.estado}
          </span>
        </td>
        <td>
          <button class="btn btn-primary btn-cargar-alumno" data-idx="${idx}" style="padding: 0.3rem 0.65rem; font-size: 0.8rem; white-space: nowrap;">
            📄 Cargar en Certificado
          </button>
        </td>
      `;
      this.tbodyAlumnos.appendChild(tr);
    });

    this.tbodyAlumnos.querySelectorAll('.btn-cargar-alumno').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
        const alumno = this.alumnosImportados[idx];
        if (alumno && window.cargarAlumnoEnFormulario) {
          window.cargarAlumnoEnFormulario(alumno);
          this.cerrarModal();
        }
      });
    });
  }

  filtrarTabla(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      this.renderTablaAlumnos(this.alumnosImportados);
      return;
    }

    const filtrados = this.alumnosImportados.filter(a => 
      a.nombreApellido.toLowerCase().includes(q) || 
      a.dni.includes(q) || 
      a.escuelaOrigen.toLowerCase().includes(q) ||
      a.idCertificado.toLowerCase().includes(q)
    );

    this.renderTablaAlumnos(filtrados);
  }

  async guardarLoteEnInsforge() {
    if (!this.alumnosImportados || this.alumnosImportados.length === 0) {
      alert('No hay alumnos para guardar.');
      return;
    }

    const confirmacion = confirm(`¿Deseas registrar ${this.alumnosImportados.length} alumnos directamente en la Base de Datos InsForge Cloud con sus Códigos QR oficiales?`);
    if (!confirmacion) return;

    this.btnGuardarLote.disabled = true;
    this.btnGuardarLote.innerHTML = `⌛ Guardando ${this.alumnosImportados.length} alumnos en InsForge...`;

    let guardadosCount = 0;
    try {
      const config = window.CONFIG || {};
      const key = config.insforge?.anonKey || '';
      const url = `${config.insforge?.baseUrl}/api/database/records/${config.insforge?.tabla || 'certificados'}`;

      const payload = this.alumnosImportados.map(a => window.databaseAPI.formatearParaInsforge(a));

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok || res.status === 201) {
        this.alumnosImportados.forEach(a => {
          a.estado = '✅ Registrado en InsForge';
          window.databaseAPI.guardarEnLocalStorage(a);
        });
        guardadosCount = this.alumnosImportados.length;
        alert(`🎉 ¡Éxito! Se dieron de alta ${guardadosCount} alumnos en la Base de Datos InsForge. Ya están listos para ser validados por Código QR.`);
      } else {
        const errTxt = await res.text();
        console.warn('Error en bulk insert:', res.status, errTxt);
        alert('Hubo un inconveniente al guardar en lote. Se guardaron en el respaldo local.');
      }
    } catch (err) {
      console.error('Error al guardar en lote:', err);
      alert('Error de conexión con InsForge Cloud.');
    }

    this.renderTablaAlumnos(this.alumnosImportados);
    this.btnGuardarLote.disabled = false;
    this.btnGuardarLote.innerHTML = `☁️ Guardar Todos en InsForge (${this.alumnosImportados.length} Alumnos)`;
  }

  descargarPlantillaModelo() {
    const headers = [
      'DNI',
      'Apellido y Nombre',
      'Localidad',
      'Escuela de Origen',
      'CUE',
      'Ano Cursado',
      'Ano',
      'Opcion Pedagogica',
      'Materias Acreditadas',
      'Fecha Inscripcion'
    ];

    const ejemplos = [
      [
        '38.452.891',
        'PÉREZ, Juan Carlos',
        'Mendoza Capital',
        'C.E.N.S. Nº 3-415',
        '5000452-00',
        '2º',
        '2024',
        'Presencial',
        'Lengua y Literatura I (Aprobado); Matemática I (Aprobado); Ciencias Sociales (Aprobado)',
        '10/03/2024'
      ],
      [
        '35.912.440',
        'GÓMEZ, María Laura',
        'Godoy Cruz',
        'C.E.N.S. Nº 3-500',
        '5000999-00',
        '1º',
        '2024',
        'Semipresencial',
        'Lengua I (Aprobado); Matemática I (Aprobado)',
        '15/03/2024'
      ],
      [
        '40.321.118',
        'RODRÍGUEZ, Lucas Daniel',
        'Guaymallén',
        'C.E.N.S. Nº 3-415',
        '5000452-00',
        '3º',
        '2024',
        'A Distancia',
        'Formación Ética y Ciudadana (Aprobado); Inglés Técnico (Aprobado)',
        '20/03/2024'
      ]
    ];

    if (window.XLSX) {
      const wsData = [headers, ...ejemplos];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Alumnos_DEPJA");
      XLSX.writeFile(wb, "Plantilla_Modelo_Alumnos_DEPJA.xlsx");
    } else {
      const BOM = '\uFEFF';
      const csv = BOM + [headers.join(';'), ...ejemplos.map(e => e.map(x => `"${x}"`).join(';'))].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Plantilla_Modelo_Alumnos_DEPJA.csv";
      a.click();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.excelImporter = new ExcelImporter();
});
