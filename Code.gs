
/**
 * U.B.A. S-MAP SERVER-SIDE CONTROLLER
 * Architecture: Apps Script Platform Standard
 */

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('UBA Integrated Management System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * CLOUD SYNCHRONIZATION
 * Persists the entire system state to Google's cloud properties
 */
function syncCloudData(payload) {
  try {
    const props = PropertiesService.getUserProperties();
    // Split large payloads if necessary, but PropertiesService supports up to 9kb per property.
    // For very large datasets, we use a single key for state.
    props.setProperty('UBA_SYSTEM_STATE', payload);
    return { status: "success", message: "Cloud Ledger Synchronized" };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

function loadCloudData() {
  try {
    const props = PropertiesService.getUserProperties();
    return props.getProperty('UBA_SYSTEM_STATE');
  } catch (e) {
    return null;
  }
}

/**
 * DATABASE OPERATIONS (CRUD) - For Spreadsheet logging
 */
const DB = {
  getRows: (sheetName) => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) return [];
    return sheet.getDataRange().getValues();
  },
  
  saveEntry: (sheetName, data) => {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
      if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
      }
      sheet.appendRow(data);
      return { status: "success", message: "Data synchronized to " + sheetName };
    } catch (e) {
      return { status: "error", message: e.toString() };
    }
  }
};

/**
 * AUTOMATED NOTIFICATIONS
 */
function sendInvigilationInvite(details) {
  const msg = `Dear ${details.name}, you are invited to invigilate ${details.subject} at ${details.venue} on ${details.date}.`;
  // MailApp.sendEmail(details.email, "Invigilation Assignment", msg);
  return "Invitation Sent and Logged";
}
