/**
 * Guarda las inscripciones a los juegos en una planilla de Google Sheets.
 *
 * Cómo conectarlo (una sola vez):
 * 1. Crea una planilla nueva en Google Sheets. En la fila 1 escribe:
 *    Fecha | Nombre | ¿Juega? | ¿Sigue con cuota $2.000?
 * 2. En la planilla: Extensiones → Apps Script. Borra lo que haya, pega este archivo y guarda.
 * 3. Implementar → Nueva implementación → tipo "Aplicación web".
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier persona
 *    Acepta los permisos que pide Google.
 * 4. Copia la URL que termina en /exec y pégala en URL_RESPUESTAS, al inicio de src/Juegos.jsx.
 *
 * Si después cambias este código, usa Implementar → Gestionar implementaciones → editar → Nueva versión,
 * así la URL sigue siendo la misma.
 */
function doPost(e) {
  const p = e.parameter;
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  hoja.appendRow([new Date(), String(p.nombre || '').slice(0, 80), p.juega || '', p.cuota || '']);
  return ContentService.createTextOutput('ok');
}
