const axios = require('axios');

const API_KEY = 'AIzaSyCtQxkHg5jeYL9gLfa-ZxmVkxFv-kC5-kQ';
const FOLDER_ID = '1H9oQlOXrSXcAgp_sdY4D2TnxKS8KoiiR';

async function listFiles(folderId = 'root') {
  try {
    const url = `https://www.googleapis.com/drive/v3/files`;
    const params = {
      key: API_KEY,
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id,name,mimeType,modifiedTime)',
      pageSize: 50,
      orderBy: 'name',
    };

    const response = await axios.get(url, { params });
    return { success: true, files: response.data.files || [] };
  } catch (e) {
    console.error('Drive list error:', e.message);
    return { success: false, error: e.message };
  }
}

async function listGuapDadFiles() {
  return listFiles(FOLDER_ID);
}

async function searchFiles(query) {
  try {
    const url = `https://www.googleapis.com/drive/v3/files`;
    const params = {
      key: API_KEY,
      q: `name contains '${query}' and trashed = false`,
      fields: 'files(id,name,mimeType)',
      pageSize: 20,
    };

    const response = await axios.get(url, { params });
    return { success: true, files: response.data.files || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function downloadFile(fileId) {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

    // 1. Get metadata to get the actual original name and mimeType
    const metaResponse = await axios.get(url, {
      params: { key: API_KEY, fields: 'id,name,mimeType,size' }
    });

    // 2. Export or get file directly
    // Note: If it's a Google Workspace file type (Google Docs/Sheets), you'd need the export api.
    // For media (images/videos), we can just download via alt=media.
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
    const fileResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer'
    });

    return {
      success: true,
      buffer: fileResponse.data,
      metadata: metaResponse.data
    };
  } catch (e) {
    console.error('Drive download error:', e.message);
    return { success: false, error: e.message };
  }
}

module.exports = {
  init: () => console.log('📁 Google Drive (API Key) initialized'),
  isAuthenticated: () => true,
  listFiles,
  listGuapDadFiles,
  searchFiles,
  downloadFile,
};
