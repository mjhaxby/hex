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
    const validChannels = ['runActivity','exportActivity','getPrebuiltActivities','readActivityPrefs','sentInputForExport','getUserActivities'];

    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  on: (channel, listener) => {
    // Whitelist channels that are allowed to be received
    const validChannels = ['loadInput','getInputForExport','setPrefs','copyToClipboard','copyToClipboard','clearTable','deleteUnusedRows','deleteUnusedCols','loadActivities','readActivityPrefs','configStore','loadPrebuiltActivities','loadUserActivities'];

    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, listener);
    }
  },
  // Add other methods or properties of ipcRenderer as needed
});