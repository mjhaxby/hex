// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog, shell } = require('electron')
const fs = require('fs')
const path = require('path')
const activityEditor = require('./activityEditor.js')

const isMac = process.platform === 'darwin'

var mainWindow

var activityWindows = [] // stores activity windows and later their data
// var blockBustersWindow

// var dataHolder // for holding data to send to apps (TO DELETE)
// var activityType // for remembering activity type (TO DELETE)

const activityWindowPrototype = {
  activityType: null,
  window: null,
  windowId: null,
  data: null // not used yet
}

const createMainWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: "Hex",
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  })
  process.env.MAIN_WINDOW_ID = mainWindow.id;

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

const createActivityWindow = (activityType, data) => {
  var newWindow = Object.create(activityWindowPrototype);
  newWindow.activityType = activityType
  newWindow.data = data
  newWindow.window = new BrowserWindow({
    title: activityType, // later replace with a user-friendly version of this
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  })

  newWindow.windowId = newWindow.window.id

  newWindow.window.loadFile('Activities/'+activityType+'.html')

  // store the window with the others in an array
  activityWindows.push(newWindow)

  // when it's closed, remove it from the array
  newWindow.window.on('closed', _ => {
    activityWindows.splice(activityWindows.findIndex(window => window.windowId === newWindow.windowId),1);
  })
}

// TO DELETE
// const createBlockbusters = () => {
//
//   //add code to close existing blockbusterswindow if there is one
//
//   // Create the browser window.
//   blockBustersWindow = new BrowserWindow({
//     title: "Hex",
//     width: 800,
//     height: 600,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       nodeIntegration: true,
//       contextIsolation: false,
//     }
//   })
//
//   // and load the html of the app.
//   blockBustersWindow.loadFile('Activities/blockbusters.html')
//   // blockBustersWindow.webContents.toggleDevTools() // for debugging
//   }
  // const createMatch = () => {
  //
  //   //add code to close existing matchWindow if there is one
  //
  //   // Create the browser window.
  //   matchWindow = new BrowserWindow({
  //     title: "Hex",
  //     width: 800,
  //     height: 600,
  //     webPreferences: {
  //       preload: path.join(__dirname, 'preload.js'),
  //       nodeIntegration: true,
  //       contextIsolation: false,
  //     }
  //   })
  //
  //   // and load the html of the app.
  //   matchWindow.loadFile('Activities/match.html')
  //   // matchWindow.webContents.toggleDevTools() // for debugging
  //   }

// when the activity page is ready, send the data to load
function finishLoadingActivity(thisWindow){
  data = activityWindows.find( ({windowId}) => windowId === thisWindow.id).data
  if(thisWindow){
    thisWindow.webContents.send('loadActivity', data)
  }
}

ipcMain.on('activityReady', (event, arg) =>{
  finishLoadingActivity(event.sender.getOwnerBrowserWindow())
})

// TO DELETE:
// ipcMain.on('blockbustersReady', (event, arg) =>{
//   finishLoadingActivity(blockBustersWindow)
// })
// ipcMain.on('matchReady', (event, arg) =>{
//   finishLoadingActivity(matchWindow)
// })



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.setMenu(dockMenu)
  }
  Menu.setApplicationMenu(applicationMenu)
  createMainWindow()
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// probably don't actually want this, but leaving it for now
const dockMenu = Menu.buildFromTemplate([
  {
    label: 'New Window',
    click () { createMainWindow() }
  }
  //{ label: 'New Command...' } // add coma before
])

//ipcMain.on will receive the "runActivity"" info from renderprocess
ipcMain.on("runActivity",function (event, data, activity) {
    console.log(event)
    console.log(data)
    console.log(activity)
    // dataHolder = data // TO DELETE
    if (activity=='blockbusters'|| activity=='match'||activity == 'crack_the_code'||activity == 'backs_to_the_board'){
      //create new window
      createActivityWindow(activity,data)
    } else {
      dialogNotReadyMsg()
    }


   // inform the render process that the assigned task finished. Show a message in html
  // event.sender.send in ipcMain will return the reply to renderprocess
   // event.sender.send("run-activity-task-finished", "yes");
});

ipcMain.on("exportActivity",function (event) {
  console.log(event)
  getReadyToExport()
})

ipcMain.on("sentInputForExport",function (event, data){
  exportActivity(data.input, data.activity) // later add options
})

const openFileDialog = () => {
  var dialogOptions = {
    title: 'Select file',
    properties: [ 'openFile' ],
    filters: [
      {
        name: 'text',
        extensions: 'txt'
      },
      {
        name: 'All files',
        extensions: [ '*' ]
      }
    ]
  }

  dialog.showOpenDialog(mainWindow, dialogOptions).then(result => {
    if (result.cancelled) {
      console.log("Cancelled")
      return
    }
    console.log(result)

    fs.readFile(result.filePaths[0], 'utf-8', (err, data) => {
              if(err){
                console.log("An error ocurred reading the file:" + err.message);
                return;
              }
            mainWindow.webContents.send('loadInput', data);
            });
  });
};

const getReadyToExport = () => {
  mainWindow.webContents.send('getInputForExport'); // will put the data in the data holder and store activity type
}

const exportFromActivity = () => {
  activityWindow = activityFocused()
  exportActivity(activityWindow.data,activityWindow.activityType)
}

const exportActivity = (data,activity) => {
  var activityTemplate
  var exportData

  var dialogOptions = {
    title: 'Export activity',
    properties: ['createDirectory'],
    filters: [{
      name: 'HTML file',
      extension: 'html'
    }],
    defaultPath: 'New'+activity.charAt(0).toUpperCase()+activity.slice(1)+'.html' // when saving files added, can use saved name if given
  }

  activityEditor.openActivityTemplate(path.resolve(__dirname,'Activities/'+activity+'.html')).then(activityTemplate => {
      exportData = activityEditor.addActivityTemplateData(activityTemplate, data)
      dialog.showSaveDialog(dialogOptions).then(result =>{
        if (result.cancelled){
          console.log("Cancelled")
          return
        }
        fs.writeFile(result.filePath, exportData, {encoding: 'utf8'}, (err) => {
          if (err){
            console.log(err);
          } else {
            console.log("File written successfully.")
          }
        })
      })
    }
  );

};

function activityFocused(){
  focusedWindow = BrowserWindow.getFocusedWindow()
  if (focusedWindow != mainWindow){
    return activityWindows.find(window => window.windowId === focusedWindow.id)
  } else {
    return null
  }
  // for(let i=0;i<activityWindows.length;i++){
  //   if(activityWindows.window.isFocused()){
  //     console.log(activityWindows[i].windowId + ' is focused')
  //     return activityWindows[i]
  //   } else {
  //     console.log(activityWindows[i].windowId + ' is not focused')
  //   }
  // }
  // return null;
}

function dialogNotReadyMsg(){
  var dialogOptions = {
    message: 'Sorry, this activity is not ready yet.',
    title: 'Sorry!',
    type: 'warning'
  }
  dialog.showMessageBoxSync(dialogOptions)
}

// MENU template
const applicationMenu = Menu.buildFromTemplate([
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit' }
    ],
    submenu: [
      {
        label: 'Open',
        role: 'open',
        accelerator: process.platform === 'darwin' ? 'Cmd+O' : 'Ctrl+O',
        click: () => { openFileDialog() }
      },
      {
        label: 'Export',
        accelerator: process.platform === 'darwin' ? 'Cmd+Shift+S' : 'Ctrl+Shift+S',
        click: () => { if (activityFocused() == null){getReadyToExport()} else (exportFromActivity()) } // TO DO: if activity window has focus, get data from that (make an array of objects that contains each window and its data?)
      }
      ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac ? [
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' }
          ]
        }
      ] : [
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' },
        { role: 'close'}
      ] : [
        { role: 'close'}
      ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://electronjs.org')
        }
      }
    ]
  }
])
