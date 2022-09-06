// NOT USING! THIS IS IN MAIN FOR NOW

const { app, BrowserWindow, Menu, shell, dialog, ipcRenderer } = require('electron');
const fs = require('fs')
//const mainProcess = require('./main');




// const menu = Menu.buildFromTemplate(template)
// Menu.setApplicationMenu(menu)

// if (process.platform === 'darwin') {
//   const name = app.getName();
//   template.unshift({ label: name });
// }



module.exports = Menu.buildFromTemplate(template);
