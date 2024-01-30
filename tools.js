const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')
var hotPotsData

const openHotPotatoesDialog = () => {
    var dialogOptions = {
      title: 'Select file',
      properties: ['openFile'],
      filters: [      
        {
          name: 'json',
          extensions: 'json'
        },
        {
          name: 'All files',
          extensions: ['*']
        }
      ]
    }
  
    dialog.showOpenDialog(windows.main, dialogOptions).then(result => {
      if (result.cancelled) {
        console.log("Cancelled")
        return
      }
      console.log(result)
      const fileExt = path.extname(result.filePaths[0])
      if (fileExt.toLowerCase() != '.html') {
        console.log("File extension: " + fileExt)
        dialog.showErrorBox("Error opening file", "Invalid file extension. Please select a .html file.")
        return;
      }
  
      fs.stat(result.filePaths[0], (err, stats) => {
        if (err) {
          console.log("An error ocurred reading the file:" + err.message);
          dialog.showErrorBox("Error opening file", "The file statistics could not be read.")
          return;
        }
          fs.readFile(result.filePaths[0], 'utf-8', (err, data) => {
            if (err) {
              console.log("An error ocurred reading the file:" + err.message);
              dialog.showErrorBox("Error opening file", "The file could not be read.")
              return;
            }
            
            hotPotsData = data
            createHotPotatoesWindow()

          })
      })
    });
  }

  const createHotPotatoesWindow = () => {
    // Create the browser window.
    windows['hotpots'] = new BrowserWindow({
      title: "Hot Potatoes Importer",
      width: 800,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        devTools: !app.isPackaged,
        sandbox: app.isPackaged
      }
    })
  
    // and load the html of the app.
    let pagePage = path.resolve(__dirname, 'hotpotsimport.html')
    windows.hotpots.loadFile(pagePage)
  
    windows.hotpots.on('closed', () => {
      windows.hotpots = null
    })
  
    // Open the DevTools.
    // windows.main.webContents.openDevTools()
  }

// when the activity page is ready, send the data to load
function finishLoadingHotPotsImport(thisWindow) {
    console.log(hotPotsData)
    if (thisWindow) {
      thisWindow.webContents.send('loadData', hotPotsData)
    }
  }

ipcMain.on('hotPotsReady', (event, arg) => {
    console.log('got ready signal')
    finishLoadingHotPotsImport(event.sender.getOwnerBrowserWindow())
})

  module.exports = {
    openHotPotatoesDialog,
    createHotPotatoesWindow,
    finishLoadingHotPotsImport
  }