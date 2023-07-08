const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, ...args) => {
    // Whitelist channels that are allowed to be sent
    const validChannels = ['activityReady'];

    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  on: (channel, listener) => {
    // Whitelist channels that are allowed to be received
    const validChannels = ['loadActivity'];

    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, listener);
    }
  },
  // Add other methods or properties of ipcRenderer as needed
});

