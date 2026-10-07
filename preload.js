// preload.js


const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})


contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, ...args) => {
    // Whitelist channels that are allowed to be sent
    const validChannels = [
      'runActivity',
      'exportActivity',
      'getPrebuiltActivities',
      'readActivityPrefs',
      'readActivitySettings',
      'sentInputForExport',
      'sentInputForSave',
      'getUserActivities',
      'setActivitySettingsDefaults',
      'customSelectImport',
      'settingsToProfile',
      'settingsToBulk',
      'profileEditorReady',
      'updateProfile',
      'applyActivityProfile',
      'saveProfile',
      'checkProfileChangesThen',
      'hotPotsReady',
      'dataSelectImport',
      'dataSelectImportFromFile',
      'requestConfig',
      'tableModified',
      'getActivity',
      'editorWindowReady',
      'openFilesForBulk',
      'removeFileFromBulk',
      'addCurrentProfileToBulk',
      'openProfileFromFile',
      'removeProfileFromBulk',
      'bulkExport',
      'undoRequested',
      'redoRequested',
      'activityNameUpdated'
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  on: (channel, listener) => {
    // Whitelist channels that are allowed to be received
    const validChannels = [
      'loadInput',
      'getInputForExport',
      'getInputForSave',
      'setPrefs',
      'setActivity',
      'copyToClipboard',
      'clearTable',
      'deleteUnusedRows',
      'deleteUnusedCols',
      'loadActivities',
      'readActivityPrefs',
      'configStore',
      'loadPrebuiltActivities',
      'loadUserActivities',
      'loadSettings',
      'requestActivitySettingDefaults',
      'loadProfile',
      'loadData',
      'getActivitySettingsForProfile',
      'getActivitySettingsForBulk',
      'addToProfile',
      'applyActivitySettings',
      'updateAndApplyActivityProfile',
      'undoRequested',
      'updateProfileToSave',
      'toCheckProfileChangesThen',
      'customSelectImportFileResult',
      'dataCellFileImportResult',
      'updateFilesIn',
      'updateProfilesOut',
      'tableSaved',
      'markClean'
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, listener);
    }
  },
  // Add other methods or properties of ipcRenderer as needed
});