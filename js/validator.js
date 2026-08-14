/**
 * MÓDULO DE VERIFICACIÓN DE CÓDIGO QR Y AUTENTICIDAD
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const certId = urlParams.get('id');
  const dniQuery = urlParams.get('dni');

  const query = certId || dniQuery;

  const resultContainer = document.getElementById('verificationResult');
  const searchInput = document.getElementById('searchQueryInput');

  if (query) {
    if (searchInput) searchInput.value = query;
    await ejecutarVerificacion(query);
  }

  const formSearch = document.getElementById('formSearchValidation');
  if (formSearch) {
    formSearch.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = searchInput.value.trim();
      if (val) {
        window.history.replaceState({}, '', `validar.html?id=${encodeURIComponent(val)}`);
        await ejecutarVerificacion(val);
      }
    });
  }
});

async function ejecutarVerificacion(codigoODni) {
  const container = document.getElementById('verificationResult');
  container.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #cbd5e1; border-top-color: #1e3a8a; border-radius: 50%; animation: spin 1s infinite linear;"></div>
      <p style="margin-top: 1rem; color: #64748b; font-weight: 500;">Consultando autenticidad en el sistema central...</p>
    </div>
  `;

  // Llamada al backend de Google Drive / Local
  const resultado = await window.driveAPI.buscarCertificado(codigoODni);

  if (resultado.encontrado) {
    const d = resultado.data;
    const espaciosHtml = (d.espaciosAcreditados || []).map(e => `<li>${e}</li>`).join('');

    container.innerHTML = `
      <div style="background: #ffffff; border-radius: 12px; border: 2px solid #10b981; padding: 1.75rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
        <div style="display: flex; align-items: center; gap: 0.75rem; color: #047857; background: #ecfdf5; padding: 0.85rem 1.25rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <div>
            <strong style="font-size: 1.1rem; display: block;">CERTIFICADO OFICIAL VÁLIDO Y VERIFICADO</strong>
            <span style="font-size: 0.825rem; opacity: 0.9;">Registrado en el sistema de la Dirección de Educación Permanente de Jóvenes y Adultos</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem; margin-bottom: 1.25rem;">
          <div><strong>Código de Verificación:</strong> <span style="font-family: monospace;">${d.idCertificado}</span></div>
          <div><strong>Fuente de Datos:</strong> ${resultado.fuente}</div>
          <div><strong>Nombre y Apellido:</strong> ${d.nombreApellido}</div>
          <div><strong>DNI:</strong> ${d.dni}</div>
          <div><strong>Escuela de Origen:</strong> ${d.escuelaOrigen} (CUE: ${d.cue || 'N/A'})</div>
          <div><strong>Localidad:</strong> ${d.localidad || 'N/A'}</div>
          <div><strong>Año de Cursado:</strong> ${d.anoCursado}º Año</div>
          <div><strong>Opción Pedagógica:</strong> ${d.opcionPedagogica}</div>
          <div><strong>Fecha de Emisión:</strong> ${d.fechaEmision}</div>
          <div><strong>Fecha de Inscripción:</strong> ${d.fechaInscripcion}</div>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem; margin-top: 1rem;">
          <strong style="display: block; font-size: 0.9rem; margin-bottom: 0.5rem; color: #1e3a8a;">Espacios Curregulares / Materias Acreditadas:</strong>
          <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: #334155; display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;">
            ${espaciosHtml || '<li>Espacios acreditados registrados según expediente.</li>'}
          </ul>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="background: #ffffff; border-radius: 12px; border: 2px solid #ef4444; padding: 1.75rem; text-align: center;">
        <div style="color: #dc2626; margin-bottom: 0.75rem;">
          <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin: 0 auto;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        </div>
        <h3 style="font-size: 1.2rem; color: #991b1b; margin-bottom: 0.5rem;">CERTIFICADO NO ENCONTRADO O INVÁLIDO</h3>
        <p style="font-size: 0.9rem; color: #64748b;">No se encontró ningún registro oficial coincidente con el código o DNI "<strong>${codigoODni}</strong>".</p>
      </div>
    `;
  }
}
