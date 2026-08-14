/**
 * GOOGLE APPS SCRIPT - BACKEND API GRATUITO PARA CERTIFICADOS DEPJA
 * 
 * Instrucciones:
 * 1. Abre Google Drive (https://drive.google.com).
 * 2. Crea una nueva Planilla de Google Sheets llamada "Registro_Certificados_DEPJA".
 * 3. En el menú superior, ve a Extensiones -> Apps Script.
 * 4. Pega todo este código en el editor de Apps Script.
 * 5. Haz clic en "Desplegar" -> "Nuevo despliegue".
 * 6. Selecciona Tipo: "Aplicación Web".
 * 7. Ejecutar como: "Yo" (Tu cuenta).
 * 8. Quién tiene acceso: "Cualquier persona" (Anyone).
 * 9. Copia la URL del despliegue (ejemplo: https://script.google.com/macros/s/.../exec).
 * 10. Pega esa URL en el archivo `config.js` en la variable `googleAppsScriptUrl`.
 */

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "ID Certificado",
      "Fecha Registro",
      "Nombre y Apellido",
      "DNI",
      "Localidad Estudiante",
      "Escuela Origen",
      "CUE",
      "Año Cursado",
      "Año Lectivo",
      "Opción Pedagógica",
      "Espacios Acreditados",
      "Fecha Inscripción",
      "Fecha Emisión",
      "Hash Verificación QR",
      "Email Responsable"
    ]);
  }
}

function doPost(e) {
  try {
    setupSheet();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.idCertificado || ("CERT-" + Date.now()),
      new Date().toLocaleString("es-AR"),
      data.nombreApellido || "",
      data.dni || "",
      data.localidad || "",
      data.escuelaOrigen || "",
      data.cue || "",
      data.anoCursado || "",
      data.ano || "",
      data.opcionPedagogica || "",
      JSON.stringify(data.espaciosAcreditados || []),
      data.fechaInscripcion || "",
      data.fechaEmision || "",
      data.hashVerificacion || "",
      data.correoResponsable || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Certificado registrado exitosamente en Google Drive",
      idCertificado: data.idCertificado
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    setupSheet();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    
    var searchId = e.parameter.id;
    var searchDni = e.parameter.dni;
    
    var result = null;
    
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if ((searchId && row[0] == searchId) || (searchDni && row[3] == searchDni)) {
        var espacios = [];
        try {
          espacios = JSON.parse(row[10]);
        } catch(err) {
          espacios = [row[10]];
        }
        
        result = {
          idCertificado: row[0],
          fechaRegistro: row[1],
          nombreApellido: row[2],
          dni: row[3],
          localidad: row[4],
          escuelaOrigen: row[5],
          cue: row[6],
          anoCursado: row[7],
          ano: row[8],
          opcionPedagogica: row[9],
          espaciosAcreditados: espacios,
          fechaInscripcion: row[11],
          fechaEmision: row[12],
          hashVerificacion: row[13]
        };
        break;
      }
    }
    
    if (result) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        found: true,
        data: result
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        found: false,
        message: "Certificado no encontrado en el sistema"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
