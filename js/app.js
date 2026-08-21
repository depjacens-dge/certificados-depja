/**
 * LÓGICA PRINCIPAL DE LA APLICACIÓN DE CERTIFICADOS DEPJA MENDOZA
 */

document.addEventListener('DOMContentLoaded', async () => {
  const auth = window.authManager || {};
  if (auth.init) await auth.init();

  // Estado inicial
  const state = {
    escuelaId: null,
    nombreApellido: 'PÉREZ, Juan Carlos',
    localidad: 'Mendoza Capital',
    dni: '38.452.891',
    anoCursado: '2º',
    escuelaOrigen: 'C.E.N.S. Nº 3-415',
    ano: '2024',
    cue: '5000452-00',
    opcionPedagogica: 'Presencial',
    espaciosAcreditados: [
      'Lengua y Literatura I (Aprobado)',
      'Matemática I (Aprobado)',
      'Ciencias Sociales (Aprobado)'
    ],
    fechaInscripcion: obtenerFechaHoyInput(),
    fechaEmision: obtenerFechaHoyTexto(),
    idCertificado: generarIdCertificado(),
    firmaImagenDataUrl: null
  };

  // Elementos DOM
  const form = document.getElementById('certForm');
  const btnAddEspacio = document.getElementById('btnAddEspacio');
  const espaciosContainer = document.getElementById('espaciosInputsContainer');
  const btnImprimir = document.getElementById('btnImprimir');
  const btnGuardarDrive = document.getElementById('btnGuardarDrive');
  const btnVerHistorial = document.getElementById('btnVerHistorial');
  const btnLimpiar = document.getElementById('btnLimpiar');
  const inputFirmaImg = document.getElementById('inputFirmaImg');
  const selectEscuela = document.getElementById('selectEscuelaPredefinida');

  // Inicialización
  await sincronizarEstadoAutenticacion();
  initFormValues();
  renderPreview();
  setupEventListeners();

  function obtenerFechaHoyInput() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  function obtenerFechaHoyTexto() {
    const d = new Date();
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  function generarIdCertificado() {
    return 'CERT-DEPJA-' + Math.floor(100000 + Math.random() * 900000);
  }

  function initFormValues() {
    if (!form) return;
    document.getElementById('inputNombre').value = state.nombreApellido;
    document.getElementById('inputLocalidad').value = state.localidad;
    document.getElementById('inputDni').value = state.dni;
    document.getElementById('inputEscuela').value = state.escuelaOrigen;
    document.getElementById('inputCue').value = state.cue;
    document.getElementById('inputAno').value = state.ano;
    document.getElementById('inputFechaInscripcion').value = state.fechaInscripcion;
    document.getElementById('inputFechaEmision').value = state.fechaEmision;

    const radioAno = document.querySelector(`input[name="anoCursado"][value="${state.anoCursado}"]`);
    if (radioAno) radioAno.checked = true;

    const radioOpcion = document.querySelector(`input[name="opcionPedagogica"][value="${state.opcionPedagogica}"]`);
    if (radioOpcion) radioOpcion.checked = true;

    renderEspaciosInputs();
  }

  function renderEspaciosInputs() {
    espaciosContainer.innerHTML = '';
    state.espaciosAcreditados.forEach((espacio, index) => {
      const div = document.createElement('div');
      div.className = 'espacio-item';
      div.innerHTML = `
        <input type="text" class="form-control input-espacio" data-index="${index}" value="${espacio}" placeholder="Ej: Matemática I (Aprobado)">
        <button type="button" class="btn-icon btn-remove-espacio" data-index="${index}" title="Eliminar materia">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      `;
      espaciosContainer.appendChild(div);
    });
  }

  function setupEventListeners() {
    form.addEventListener('input', () => {
      syncStateFromForm();
      renderPreview();
    });

    form.addEventListener('change', () => {
      syncStateFromForm();
      renderPreview();
    });

    // Carga de Imagen de Firma Opcional
    if (inputFirmaImg) {
      inputFirmaImg.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            state.firmaImagenDataUrl = event.target.result;
            renderPreview();
          };
          reader.readAsDataURL(file);
        } else {
          state.firmaImagenDataUrl = null;
          renderPreview();
        }
      });
    }

    btnAddEspacio.addEventListener('click', () => {
      state.espaciosAcreditados.push('');
      renderEspaciosInputs();
      renderPreview();
    });

    espaciosContainer.addEventListener('click', (e) => {
      const btnRemove = e.target.closest('.btn-remove-espacio');
      if (btnRemove) {
        const idx = parseInt(btnRemove.getAttribute('data-index'));
        state.espaciosAcreditados.splice(idx, 1);
        renderEspaciosInputs();
        renderPreview();
      }
    });

    espaciosContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('input-espacio')) {
        const idx = parseInt(e.target.getAttribute('data-index'));
        state.espaciosAcreditados[idx] = e.target.value;
        renderPreview();
      }
    });

    btnImprimir.addEventListener('click', () => {
      window.print();
    });

    btnGuardarDrive.addEventListener('click', async () => {
      syncStateFromForm();
      if (!state.nombreApellido || !state.dni) {
        alert('Por favor ingrese al menos el Nombre y DNI del alumno antes de guardar.');
        return;
      }

      btnGuardarDrive.disabled = true;
      btnGuardarDrive.innerHTML = `⌛ Guardando...`;

      const res = await window.databaseAPI.guardarCertificado(state);
      
      mostrarToast(`✅ Certificado guardado exitosamente.`);
      btnGuardarDrive.disabled = false;
      btnGuardarDrive.innerHTML = `
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
        ✅ Guardado exitosamente
      `;

      // Volver a "💾 Guardar" después de 3.5 segundos
      setTimeout(() => {
        if (btnGuardarDrive) {
          btnGuardarDrive.innerHTML = `
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            💾 Guardar
          `;
        }
      }, 3500);

      // Mostrar el Código QR en pantalla grande automáticamente para escanear
      abrirModalQRDirecto();
    });

    // Función Global para abrir el modal del QR desde cualquier botón o evento
    window.abrirModalQRDirectoGlobal = function() {
      syncStateFromForm();
      abrirModalQRDirecto();
    };

    // Botón para mostrar el QR en pantalla grande a demanda
    const btnMostrarQRModal = document.getElementById('btnMostrarQRModal');
    if (btnMostrarQRModal) {
      btnMostrarQRModal.addEventListener('click', () => {
        window.abrirModalQRDirectoGlobal();
      });
    }

    function abrirModalQRDirecto() {
      const modal = document.getElementById('modalQRDirecto');
      const qrContainer = document.getElementById('modalQRLargeContainer');
      const txtNombre = document.getElementById('modalQREstudiante');
      const txtDni = document.getElementById('modalQRDni');
      const txtCod = document.getElementById('modalQRCodigo');
      const linkDirecto = document.getElementById('btnAbrirValidacionDirecta');

      if (!modal) return;

      const config = window.CONFIG || {};
      const baseUrl = config.appBaseUrl || window.location.origin;
      const urlValidacion = `${baseUrl}/validar.html?id=${encodeURIComponent(state.idCertificado)}`;

      if (txtNombre) txtNombre.textContent = state.nombreApellido || 'Estudiante';
      if (txtDni) txtDni.textContent = state.dni || 'Sin DNI';
      if (txtCod) txtCod.textContent = state.idCertificado;
      if (linkDirecto) linkDirecto.href = urlValidacion;

      if (qrContainer) {
        qrContainer.innerHTML = '';
        if (window.QRCode) {
          new QRCode(qrContainer, {
            text: urlValidacion,
            width: 200,
            height: 200,
            colorDark: "#000f9f",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });
        } else {
          const img = document.createElement('img');
          img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlValidacion)}`;
          img.style.width = '200px';
          img.style.height = '200px';
          qrContainer.appendChild(img);
        }
      }

      modal.classList.add('active');
    }

    const btnCloseModalQRDirecto = document.getElementById('btnCloseModalQRDirecto');
    const btnCerrarModalQRAceptar = document.getElementById('btnCerrarModalQRAceptar');
    if (btnCloseModalQRDirecto) {
      btnCloseModalQRDirecto.addEventListener('click', () => {
        document.getElementById('modalQRDirecto')?.classList.remove('active');
      });
    }
    if (btnCerrarModalQRAceptar) {
      btnCerrarModalQRAceptar.addEventListener('click', () => {
        document.getElementById('modalQRDirecto')?.classList.remove('active');
      });
    }

    // Enviar Certificado Digital por WhatsApp
    const btnEnviarWhatsapp = document.getElementById('btnEnviarWhatsapp');
    if (btnEnviarWhatsapp) {
      btnEnviarWhatsapp.addEventListener('click', async () => {
        syncStateFromForm();
        if (!state.nombreApellido || !state.dni) {
          alert('Por favor complete los datos del alumno antes de enviar.');
          return;
        }

        await window.databaseAPI.guardarCertificado(state);

        const celInput = document.getElementById('inputCelularAlumno')?.value || '';
        let celLimpio = celInput.replace(/[^0-9]/g, '');

        if (!celLimpio) {
          const celPrompt = prompt('Ingrese el número de celular del alumno para enviar por WhatsApp:\n(Ej: 261 555 1234)', '');
          if (!celPrompt) return;
          celLimpio = celPrompt.replace(/[^0-9]/g, '');
        }

        if (celLimpio.length === 10) {
          celLimpio = '549' + celLimpio;
        } else if (celLimpio.length === 8) {
          celLimpio = '549261' + celLimpio;
        }

        const config = window.CONFIG || {};
        const baseUrl = config.appBaseUrl || window.location.origin;
        const urlValidacion = `${baseUrl}/validar.html?id=${encodeURIComponent(state.idCertificado)}`;

        const mensajeTexto = `Hola *${state.nombreApellido}*, la Dirección General de Escuelas (DEPJA Mendoza) y tu escuela *${state.escuelaOrigen || 'C.E.N.S.'}* te envían tu *Certificado Oficial de Estudios Incompletos Secundarios* (Convenio Seguridad Privada).\n\n📜 *Código Único Oficial:* ${state.idCertificado}\n🆔 *DNI:* ${state.dni}\n🏫 *Escuela:* ${state.escuelaOrigen}\n\n🔗 *Puedes ver y validar tu certificado oficial aquí:*\n${urlValidacion}\n\n_Documento oficial digital emitido por DGE Mendoza._`;

        const waUrl = `https://wa.me/${celLimpio}?text=${encodeURIComponent(mensajeTexto)}`;
        window.open(waUrl, '_blank');
        mostrarToast(`Abriendo WhatsApp con el certificado de ${state.nombreApellido}...`);
      });
    }

    // Enviar Certificado Digital por Correo
    const btnEnviarEmail = document.getElementById('btnEnviarEmail');
    if (btnEnviarEmail) {
      btnEnviarEmail.addEventListener('click', async () => {
        syncStateFromForm();
        if (!state.nombreApellido || !state.dni) {
          alert('Por favor complete los datos del alumno antes de enviar.');
          return;
        }

        await window.databaseAPI.guardarCertificado(state);

        const emailInput = document.getElementById('inputEmailAlumno')?.value || '';
        let emailDestino = emailInput.trim();

        if (!emailDestino) {
          const emailPrompt = prompt('Ingrese el correo electrónico del alumno para enviar:', '');
          if (!emailPrompt) return;
          emailDestino = emailPrompt.trim();
        }

        const config = window.CONFIG || {};
        const baseUrl = config.appBaseUrl || window.location.origin;
        const urlValidacion = `${baseUrl}/validar.html?id=${encodeURIComponent(state.idCertificado)}`;

        const asunto = `Certificado Oficial de Estudios Incompletos - ${state.nombreApellido} (DEPJA Mendoza)`;
        const cuerpo = `Estimado/a ${state.nombreApellido},\n\nLe enviamos su Certificado Oficial de Estudios Incompletos Secundarios (Convenio Seguridad Privada - DGE Mendoza).\n\nCódigo de Verificación: ${state.idCertificado}\nDNI: ${state.dni}\nEscuela: ${state.escuelaOrigen}\n\nPuede consultar y verificar la autenticidad de su documento en el Portal Oficial de Validación:\n${urlValidacion}\n\nAtentamente,\nDirección de Educación Permanente de Jóvenes y Adultos (DEPJA)\nGobierno de Mendoza`;

        const mailtoUrl = `mailto:${encodeURIComponent(emailDestino)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
        window.location.href = mailtoUrl;
        mostrarToast(`Abriendo cliente de correo para ${emailDestino}...`);
      });
    }

    btnVerHistorial.addEventListener('click', abrirModalHistorial);

    btnLimpiar.addEventListener('click', () => {
      state.nombreApellido = '';
      state.dni = '';
      state.anoCursado = '1º';
      state.opcionPedagogica = 'Presencial';
      state.espaciosAcreditados = [''];
      state.firmaImagenDataUrl = null;
      if (inputFirmaImg) inputFirmaImg.value = '';
      state.idCertificado = generarIdCertificado();

      const escAsignada = auth.obtenerEscuelaAsignada ? auth.obtenerEscuelaAsignada() : null;
      if (escAsignada) {
        state.escuelaId = escAsignada.id;
        state.escuelaOrigen = escAsignada.nombre;
        state.cue = escAsignada.cue || '';
        state.localidad = escAsignada.localidad || 'Mendoza';
      } else {
        state.localidad = '';
        state.escuelaOrigen = '';
        state.cue = '';
      }

      initFormValues();
      renderPreview();
      document.getElementById('inputNombre').focus();
      mostrarToast('Formulario limpio listo para cargar un Alumno Nuevo.');
    });

    // Evento del selector de escuelas registradas
    if (selectEscuela) {
      selectEscuela.addEventListener('change', (e) => {
        const id = e.target.value;
        const escuela = (auth.escuelasCache || []).find(x => x.id === id);
        if (escuela) {
          state.escuelaId = escuela.id;
          state.escuelaOrigen = escuela.nombre;
          state.cue = escuela.cue || '';
          state.localidad = escuela.localidad || '';
          
          document.getElementById('inputEscuela').value = state.escuelaOrigen;
          document.getElementById('inputCue').value = state.cue;
          document.getElementById('inputLocalidad').value = state.localidad;

          renderPreview();
          mostrarToast(`Escuela ${escuela.numero} seleccionada.`);
        }
      });
    }

    const btnLogout = document.getElementById('btnLogoutIndex');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        auth.cerrarSesion();
      });
    }

    // ==========================================
    // BÚSQUEDA Y ASIGNACIÓN DESDE PADRÓN GENERAL
    // ==========================================
    const inputBuscarDniPadron = document.getElementById('inputBuscarDniPadron');
    const btnBuscarPadronDni = document.getElementById('btnBuscarPadronDni');
    const modalPadron = document.getElementById('modalAsignarPadron');
    const btnCloseModalPadron = document.getElementById('btnCloseModalPadron');
    const btnCancelarPadron = document.getElementById('btnCancelarAsignacionPadron');
    const btnConfirmarPadron = document.getElementById('btnConfirmarAsignacionPadron');

    let alumnoEncontradoPadron = null;

    async function buscarEnPadronPorDni() {
      const dniVal = (inputBuscarDniPadron?.value || '').trim();
      if (!dniVal) {
        alert('Por favor ingrese un número de DNI para buscar.');
        return;
      }

      btnBuscarPadronDni.disabled = true;
      btnBuscarPadronDni.textContent = '⌛ Buscando...';

      try {
        const resultado = await window.databaseAPI.buscarCertificado(dniVal);
        if (resultado && resultado.encontrado && resultado.data) {
          alumnoEncontradoPadron = resultado.data;
          
          document.getElementById('padronNombre').textContent = alumnoEncontradoPadron.nombreApellido;
          document.getElementById('padronDni').textContent = alumnoEncontradoPadron.dni;
          document.getElementById('padronEstado').textContent = alumnoEncontradoPadron.escuelaOrigen || '🟡 Sin Asignar (Padrón General)';
          
          const materias = Array.isArray(alumnoEncontradoPadron.espaciosAcreditados) 
            ? alumnoEncontradoPadron.espaciosAcreditados.join(' • ')
            : (alumnoEncontradoPadron.espaciosAcreditados || 'Materias del plan');
          document.getElementById('padronMaterias').textContent = materias;

          const escAsignada = auth.obtenerEscuelaAsignada ? auth.obtenerEscuelaAsignada() : null;
          const destinoTexto = escAsignada ? escAsignada.nombre : (state.escuelaOrigen || 'su institución');
          document.getElementById('padronNombreEscuelaDestino').textContent = destinoTexto;

          modalPadron.classList.add('active');
        } else {
          const deseaCrear = confirm(`El DNI "${dniVal}" no fue encontrado en el padrón general precargado.\n\n¿Desea dar de alta y cargar este alumno como un NUEVO ESTUDIANTE para su escuela?`);
          if (deseaCrear) {
            state.nombreApellido = '';
            state.dni = dniVal;
            state.idCertificado = generarIdCertificado();
            state.espaciosAcreditados = [''];
            
            const escAsignada = auth.obtenerEscuelaAsignada ? auth.obtenerEscuelaAsignada() : null;
            if (escAsignada) {
              state.escuelaId = escAsignada.id;
              state.escuelaOrigen = escAsignada.nombre;
              state.cue = escAsignada.cue || '';
              state.localidad = escAsignada.localidad || 'Mendoza';
            }

            initFormValues();
            renderPreview();
            document.getElementById('inputNombre').focus();
            mostrarToast(`Formulario preparado para registrar al nuevo alumno.`);
          }
        }
      } catch (err) {
        console.error('Error buscando en padrón:', err);
        alert('Error al consultar el padrón en la base de datos.');
      } finally {
        btnBuscarPadronDni.disabled = false;
        btnBuscarPadronDni.textContent = 'Buscar';
      }
    }

    if (btnBuscarPadronDni) {
      btnBuscarPadronDni.addEventListener('click', buscarEnPadronPorDni);
    }

    if (inputBuscarDniPadron) {
      inputBuscarDniPadron.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          buscarEnPadronPorDni();
        }
      });
    }

    if (btnCloseModalPadron) {
      btnCloseModalPadron.addEventListener('click', () => modalPadron.classList.remove('active'));
    }

    if (btnCancelarPadron) {
      btnCancelarPadron.addEventListener('click', () => modalPadron.classList.remove('active'));
    }

    if (btnConfirmarPadron) {
      btnConfirmarPadron.addEventListener('click', () => {
        if (!alumnoEncontradoPadron) return;

        // Cargar datos en el estado y formulario
        state.nombreApellido = alumnoEncontradoPadron.nombreApellido;
        state.dni = alumnoEncontradoPadron.dni;
        state.idCertificado = alumnoEncontradoPadron.idCertificado || generarIdCertificado();
        
        if (alumnoEncontradoPadron.espaciosAcreditados && alumnoEncontradoPadron.espaciosAcreditados.length > 0) {
          state.espaciosAcreditados = Array.isArray(alumnoEncontradoPadron.espaciosAcreditados)
            ? [...alumnoEncontradoPadron.espaciosAcreditados]
            : [alumnoEncontradoPadron.espaciosAcreditados];
        }

        // Fijar datos de la escuela del usuario actual si está logueado como CENS
        const escAsignada = auth.obtenerEscuelaAsignada ? auth.obtenerEscuelaAsignada() : null;
        if (escAsignada) {
          state.escuelaId = escAsignada.id;
          state.escuelaOrigen = escAsignada.nombre;
          state.cue = escAsignada.cue || '';
          state.localidad = escAsignada.localidad || 'Mendoza';
        }

        initFormValues();
        renderPreview();

        modalPadron.classList.remove('active');
        mostrarToast(`✅ Alumno ${state.nombreApellido} asignado a ${state.escuelaOrigen}.`);
      });
    }
  }

  async function sincronizarEstadoAutenticacion() {
    const txtRol = document.getElementById('txtUsuarioRol');
    const dotRol = document.getElementById('dotRol');
    const btnAdmin = document.getElementById('btnIrAdminPanel');
    const containerSelectEscuela = document.getElementById('containerSelectEscuela');
    const inputEscuela = document.getElementById('inputEscuela');
    const inputCue = document.getElementById('inputCue');
    const inputLocalidad = document.getElementById('inputLocalidad');

    // Rellenar select de escuelas
    const escuelas = await auth.cargarEscuelas();
    if (selectEscuela) {
      selectEscuela.innerHTML = '<option value="">-- Seleccionar Escuela / CENS --</option>';
      escuelas.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = `${e.numero} - ${e.nombre} (${e.localidad || ''})`;
        selectEscuela.appendChild(opt);
      });
    }

    if (!auth.currentUser) {
      // Redirigir al portal de acceso si no hay sesión activa
      window.location.href = 'login.html';
      return;
    }

    if (auth.esAdmin()) {
      if (txtRol) txtRol.textContent = `👑 Admin: ${auth.currentUser.nombre_completo}`;
      if (dotRol) dotRol.style.backgroundColor = '#3b82f6';
      if (btnAdmin) btnAdmin.style.display = 'inline-flex';
      if (containerSelectEscuela) containerSelectEscuela.style.display = 'block';

      if (inputEscuela) inputEscuela.readOnly = false;
      if (inputCue) inputCue.readOnly = false;
      if (inputLocalidad) inputLocalidad.readOnly = false;

    } else if (auth.esEscuela()) {
      const esc = auth.obtenerEscuelaAsignada();
      const escNombre = esc ? esc.nombre : auth.currentUser.nombre_completo;
      
      if (txtRol) txtRol.textContent = `🏫 ${esc ? esc.numero : 'CENS'}: ${escNombre}`;
      if (dotRol) dotRol.style.backgroundColor = '#10b981';
      if (btnAdmin) btnAdmin.style.display = 'none';
      if (containerSelectEscuela) containerSelectEscuela.style.display = 'none';

      // Fijar datos de la escuela asignada
      if (esc) {
        state.escuelaId = esc.id;
        state.escuelaOrigen = esc.nombre;
        state.cue = esc.cue || '';
        state.localidad = esc.localidad || '';

        if (inputEscuela) {
          inputEscuela.value = esc.nombre;
          inputEscuela.readOnly = true;
          inputEscuela.style.backgroundColor = '#f8fafc';
        }
        if (inputCue) {
          inputCue.value = esc.cue || '';
          inputCue.readOnly = true;
          inputCue.style.backgroundColor = '#f8fafc';
        }
        if (inputLocalidad) {
          inputLocalidad.value = esc.localidad || '';
          inputLocalidad.readOnly = true;
          inputLocalidad.style.backgroundColor = '#f8fafc';
        }
      }
    }
  }

  function syncStateFromForm() {
    state.nombreApellido = document.getElementById('inputNombre').value;
    state.localidad = document.getElementById('inputLocalidad').value;
    state.dni = document.getElementById('inputDni').value;
    state.escuelaOrigen = document.getElementById('inputEscuela').value;
    state.cue = document.getElementById('inputCue').value;
    state.ano = document.getElementById('inputAno').value;

    const fechaIns = document.getElementById('inputFechaInscripcion').value;
    if (fechaIns) {
      const parts = fechaIns.split('-');
      state.fechaInscripcion = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : fechaIns;
    }

    state.fechaEmision = document.getElementById('inputFechaEmision').value;

    const checkedAno = document.querySelector('input[name="anoCursado"]:checked');
    if (checkedAno) state.anoCursado = checkedAno.value;

    const checkedOpcion = document.querySelector('input[name="opcionPedagogica"]:checked');
    if (checkedOpcion) state.opcionPedagogica = checkedOpcion.value;
  }

  function renderPreview() {
    document.getElementById('viewNombre').textContent = state.nombreApellido || '';
    document.getElementById('viewLocalidad').textContent = state.localidad || '';
    document.getElementById('viewDni').textContent = state.dni || '';
    document.getElementById('viewEscuela').textContent = state.escuelaOrigen || '';
    document.getElementById('viewCue').textContent = state.cue || '';
    document.getElementById('viewAno').textContent = state.ano || '';
    document.getElementById('viewAnoCursadoTexto').textContent = state.anoCursado ? `${state.anoCursado} Año` : '';
    document.getElementById('viewFechaInscripcion').textContent = state.fechaInscripcion || '00/00/0000';
    document.getElementById('viewFechaEmision').textContent = state.fechaEmision || '……./……../……….';

    // Render Checkboxes
    document.getElementById('box1er').textContent = state.anoCursado === '1º' ? '✓' : '';
    document.getElementById('box2do').textContent = state.anoCursado === '2º' ? '✓' : '';
    document.getElementById('box3er').textContent = state.anoCursado === '3º' ? '✓' : '';

    document.getElementById('boxPresencial').textContent = state.opcionPedagogica === 'Presencial' ? '✓' : '';
    document.getElementById('boxSemipresencial').textContent = state.opcionPedagogica === 'Semipresencial' ? '✓' : '';
    document.getElementById('boxDistancia').textContent = state.opcionPedagogica === 'A Distancia' ? '✓' : '';
    const boxTemEl = document.getElementById('boxTem');
    if (boxTemEl) {
      boxTemEl.textContent = (state.opcionPedagogica && state.opcionPedagogica.toUpperCase() === 'TEM') ? '✓' : '';
    }
    const boxCepasEl = document.getElementById('boxCepas');
    if (boxCepasEl) {
      boxCepasEl.textContent = (state.opcionPedagogica && state.opcionPedagogica.toUpperCase() === 'CEPAS') ? '✓' : '';
    }

    // Render Espacios Acreditados
    const containerEspacios = document.getElementById('viewEspaciosLines');
    containerEspacios.innerHTML = '';
    
    const espaciosFiltrados = state.espaciosAcreditados.filter(e => e.trim() !== '');
    if (espaciosFiltrados.length === 0) {
      containerEspacios.innerHTML = `
        <div class="cert-single-line"></div>
        <div class="cert-single-line"></div>
      `;
    } else {
      espaciosFiltrados.forEach(espacio => {
        const div = document.createElement('div');
        div.className = 'cert-single-line';
        div.textContent = espacio;
        containerEspacios.appendChild(div);
      });
    }

    // Render Firma/Sello
    const sigBox = document.getElementById('viewSignatureBox');
    if (state.firmaImagenDataUrl) {
      sigBox.innerHTML = `<img src="${state.firmaImagenDataUrl}" alt="Firma Autoridad">`;
    } else {
      sigBox.innerHTML = `<div style="width: 220px; border-bottom: 1.5px solid #000000;"></div>`;
    }

    // Render QR Code
    renderQRCode();
  }

  function renderQRCode() {
    const config = window.CONFIG || {};
    const baseUrl = config.appBaseUrl || window.location.origin;
    const urlValidacion = `${baseUrl}/validar.html?id=${encodeURIComponent(state.idCertificado)}`;

    const qrContainer = document.getElementById('qrCanvasContainer');
    qrContainer.innerHTML = '';

    if (window.QRCode) {
      new QRCode(qrContainer, {
        text: urlValidacion,
        width: 155,
        height: 155,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      const qrImg = document.createElement('img');
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=155x155&data=${encodeURIComponent(urlValidacion)}`;
      qrImg.alt = "Código QR de Verificación";
      qrImg.style.width = "155px";
      qrImg.style.height = "155px";
      qrContainer.appendChild(qrImg);
    }
  }

  async function abrirModalHistorial() {
    const modal = document.getElementById('modalHistorial');
    const tbody = document.getElementById('tbodyHistorial');
    
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 1.5rem; color: #64748b;">⌛ Cargando registros desde InsForge Cloud...</td></tr>`;
    modal.classList.add('active');

    const lista = await window.databaseAPI.obtenerHistorialCompleto();

    tbody.innerHTML = '';
    if (!lista || lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 1.5rem; color: #64748b;">No hay certificados registrados todavía.</td></tr>`;
    } else {
      lista.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${c.idCertificado}</strong></td>
          <td>${c.nombreApellido}</td>
          <td>${c.dni}</td>
          <td>${c.fechaEmision || ''}</td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-outline btn-pdf-cert" data-id="${c.idCertificado}" style="padding: 0.3rem 0.6rem; font-size: 0.78rem; color: #000f9f; border-color: #bfdbfe; font-weight: 700;" title="Descargar / Imprimir Certificado en PDF">
                📄 PDF
              </button>
              <button class="btn btn-outline btn-cargar-cert" data-id="${c.idCertificado}" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" title="Cargar y Editar">
                ✏️ Editar
              </button>
              <a href="validar.html?id=${encodeURIComponent(c.idCertificado)}" target="_blank" class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.78rem; text-decoration: none; color: #0284c7; border-color: #bae6fd;" title="Ver QR">
                🔍 QR
              </a>
              <button class="btn btn-outline btn-eliminar-cert" data-id="${c.idCertificado}" data-nombre="${c.nombreApellido}" style="padding: 0.3rem 0.6rem; font-size: 0.78rem; color: #ef4444; border-color: #fecaca;" title="Eliminar de la Base de Datos">
                🗑️
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-pdf-cert').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const item = lista.find(x => x.idCertificado === id);
          if (item) {
            Object.assign(state, item);
            initFormValues();
            renderPreview();
            cerrarModalHistorial();
            setTimeout(() => {
              window.print();
            }, 250);
          }
        });
      });

      tbody.querySelectorAll('.btn-cargar-cert').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const item = lista.find(x => x.idCertificado === id);
          if (item) {
            Object.assign(state, item);
            initFormValues();
            renderPreview();
            cerrarModalHistorial();
            mostrarToast(`Certificado ${id} cargado para edición.`);
          }
        });
      });

      tbody.querySelectorAll('.btn-eliminar-cert').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          const nombre = e.target.getAttribute('data-nombre');
          const confirmacion = confirm(`¿Está seguro de que desea ELIMINAR permanentemente el certificado "${id}" del alumno "${nombre}" de la base de datos?\n\nEsta acción no se puede deshacer.`);
          if (confirmacion) {
            btn.disabled = true;
            btn.textContent = '⌛';
            const res = await window.databaseAPI.eliminarCertificadoEnInsforge(id);
            if (res.exito) {
              mostrarToast(`Certificado ${id} eliminado de la base de datos.`);
              await abrirModalHistorial();
            } else {
              alert('Error al eliminar: ' + res.mensaje);
              btn.disabled = false;
              btn.textContent = '🗑️';
            }
          }
        });
      });
    }
  }

  // Botón de exportación a Excel / CSV en el modal
  const btnExportarExcel = document.getElementById('btnExportarExcel');
  if (btnExportarExcel) {
    btnExportarExcel.addEventListener('click', async () => {
      await window.databaseAPI.exportarAExcelCSV();
    });
  }

  function cerrarModalHistorial() {
    document.getElementById('modalHistorial').classList.remove('active');
  }

  document.getElementById('btnCloseModal')?.addEventListener('click', cerrarModalHistorial);

  function mostrarToast(mensaje) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.querySelector('.toast-message').textContent = mensaje;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  // Exponer función global para que el importador de Excel pueda cargar alumnos en el formulario
  window.cargarAlumnoEnFormulario = (alumno) => {
    state.nombreApellido = alumno.nombreApellido || '';
    state.dni = alumno.dni || '';
    state.localidad = alumno.localidad || '';
    state.escuelaOrigen = alumno.escuelaOrigen || '';
    state.cue = alumno.cue || '';
    state.anoCursado = alumno.anoCursado || '2º';
    state.ano = alumno.ano || new Date().getFullYear().toString();
    state.opcionPedagogica = alumno.opcionPedagogica || 'Presencial';
    state.espaciosAcreditados = Array.isArray(alumno.espaciosAcreditados) ? [...alumno.espaciosAcreditados] : [alumno.espaciosAcreditados];
    state.fechaInscripcion = alumno.fechaInscripcion || obtenerFechaHoyTexto();
    state.fechaEmision = alumno.fechaEmision || obtenerFechaHoyTexto();
    state.idCertificado = alumno.idCertificado || generarIdCertificado();

    initFormValues();
    renderPreview();
    mostrarToast(`👤 Datos de ${state.nombreApellido} cargados en el certificado.`);
  };
});
