const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'data', 'service-account.json');

let drive;
let initialized = false;

function init() {
  if (initialized) return;
  
  try {
    // Load Service Account
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    
    const auth = new google.auth.JWT(
      serviceAccount.client_email,
      null,
      serviceAccount.private_key,
      ['https://www.googleapis.com/auth/drive.readonly']
    );
    
    drive = google.drive({ version: 'v3', auth });
    initialized = true;
    console.log('📁 Google Drive (Service Account) initialized');
  } catch (e) {
    console.error('Failed to init Drive:', e.message);
  }
}

function isAuthenticated() {
  return initialized;
}

async function listFiles(folderId = 'root') {
  init();
  
  if (!drive) return { success: false, error: 'Not initialized' };
  
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id,name,mimeType,modifiedTime,parents)',
      orderBy: 'name',
      pageSize: 50,
    });
    return { success: true, files: response.data.files || [] };
  } catch (e) {
    console.error('Drive list error:', e.message);
    return { success: false, error: e.message };
  }
}

async function listGuapDadFiles() {
  init();
  
  // The folder ID from the user
  const FOLDER_ID = '1H9oQlOXrSXcAgp_sdY4D2TnxKS8KoiiR';
  
  try {
    const response = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id,name,mimeType,modifiedTime,parents)',
      orderBy: 'name',
      pageSize: 50,
    });
    return { success: true, files: response.data.files || [] };
  } catch (e) {
    console.error('Drive list error:', e.message);
    return { success: false, error: e.message };
  }
}

async function getFileContent(fileId) {
  init();
  
  try {
    const response = await drive.files.get({
      fileId,
      alt: 'media',
    }, { responseType: 'text' });
    return { success: true, content: response.data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  init,
  isAuthenticated,
  listFiles,
  listGuapDadFiles,
  getFileContent,
};
