/**
 * LÓGICA PRINCIPAL DE LA APLICACIÓN DE CERTIFICADOS DEPJA MENDOZA
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado inicial
  const state = {
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

  // Inicialización
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
      btnGuardarDrive.disabled = true;
      btnGuardarDrive.innerHTML = `⌛ Guardando...`;

      const res = await window.driveAPI.guardarCertificado(state);
      
      mostrarToast(res.mensaje);
      btnGuardarDrive.disabled = false;
      btnGuardarDrive.innerHTML = `
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        Guardar en Base de Datos (Google Drive)
      `;
    });

    btnVerHistorial.addEventListener('click', abrirModalHistorial);

    btnLimpiar.addEventListener('click', () => {
      state.nombreApellido = '';
      state.dni = '';
      state.localidad = '';
      state.escuelaOrigen = '';
      state.cue = '';
      state.anoCursado = '1º';
      state.opcionPedagogica = 'Presencial';
      state.espaciosAcreditados = [''];
      state.firmaImagenDataUrl = null;
      if (inputFirmaImg) inputFirmaImg.value = '';
      state.idCertificado = generarIdCertificado();
      initFormValues();
      renderPreview();
      mostrarToast('Formulario restablecido para un nuevo certificado.');
    });
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
        width: 126,
        height: 126,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      const qrImg = document.createElement('img');
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=126x126&data=${encodeURIComponent(urlValidacion)}`;
      qrImg.alt = "Código QR de Verificación";
      qrImg.style.width = "126px";
      qrImg.style.height = "126px";
      qrContainer.appendChild(qrImg);
    }
  }

  function abrirModalHistorial() {
    const modal = document.getElementById('modalHistorial');
    const tbody = document.getElementById('tbodyHistorial');
    const lista = window.driveAPI.obtenerLocales();

    tbody.innerHTML = '';
    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 1.5rem; color: #64748b;">No hay certificados guardados en el historial local.</td></tr>`;
    } else {
      lista.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${c.idCertificado}</strong></td>
          <td>${c.nombreApellido}</td>
          <td>${c.dni}</td>
          <td>${c.fechaEmision || ''}</td>
          <td>
            <button class="btn btn-outline btn-cargar-cert" data-id="${c.idCertificado}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">
              Cargar
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-cargar-cert').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          const item = lista.find(x => x.idCertificado === id);
          if (item) {
            Object.assign(state, item);
            initFormValues();
            renderPreview();
            cerrarModalHistorial();
            mostrarToast(`Certificado ${id} cargado exitosamente.`);
          }
        });
      });
    }

    modal.classList.add('active');
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
});
