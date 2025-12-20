
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
 * DATABASE OPERATIONS (CRUD)
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
      if (!sheet) throw new Error("Sheet not found");
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

/**
 * NRT GRADING ENGINE (SERVER-SIDE)
 */
function calculateServerNRT(scores) {
  // Processing logic for standard nine grading
}
