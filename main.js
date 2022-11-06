// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog, shell, clipboard } = require('electron')
const fs = require('fs')
const path = require('path')
const activityEditor = require('./activityEditor.js')

const isMac = process.platform === 'darwin'

var mainWindow

var activityWindows = [] // stores activity windows and later their data
// var blockBustersWindow

const configFilePath = app.getPath('userData') + '/hex_config.json'
const defaultConfig = {userActivitiesDir: app.getPath('documents') + '/Hex/'}
var config = {...defaultConfig}

// var dataHolder // for holding data to send to apps (TO DELETE)
// var activityType // for remembering activity type (TO DELETE)

const activityWindowPrototype = {
  activityType: null,
  window: null,
  windowId: null,
  data: null,
  settings: null
}

const createMainWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: "Hex",
    width: 1024,
    height: 768,
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

const createActivityWindow = (activityType, data, settings, source) => {
  var newWindow = Object.create(activityWindowPrototype);
  newWindow.activityType = activityType
  newWindow.data = data
  newWindow.settings = settings
  newWindow.source = source
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

  newWindow.window.loadFile(findActivityPath(activityType, source))

  // store the window with the others in an array
  activityWindows.push(newWindow)

  // when it's closed, remove it from the array
  newWindow.window.on('closed', _ => {
    activityWindows.splice(activityWindows.findIndex(window => window.windowId === newWindow.windowId),1);
  })
}

// when the activity page is ready, send the data to load
function finishLoadingActivity(thisWindow){
  data = activityWindows.find( ({windowId}) => windowId === thisWindow.id).data
  settings = activityWindows.find( ({windowId}) => windowId === thisWindow.id).settings
  if(thisWindow){
    thisWindow.webContents.send('loadActivity', data, settings)
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
  createMainWindow();
  getConfig();
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
ipcMain.on("runActivity",function (event, data, settings, activity,source) {
  console.log('Running activity')
    // console.log(event)
    // console.log(data)
    console.log(activity)
    console.log(settings)
    createActivityWindow(activity,data,settings,source)

   // inform the render process that the assigned task finished. Show a message in html
  // event.sender.send in ipcMain will return the reply to renderprocess
   // event.sender.send("run-activity-task-finished", "yes");
});

ipcMain.on("exportActivity",function (event) {
  console.log(event)
  getReadyToExport()
})

ipcMain.on('sentInputForExport',function (event, data){
  exportActivity(data.input, data.activity, data.settings, data.source)
})

ipcMain.on('readActivityPrefs', function (event, activity, source){
  let activityPath = findActivityPath(activity, source)
  activityEditor.openActivityTemplate(activityPath).then(activityTemplate => {
    prefs = readPreferences(activityTemplate)
    console.log(prefs)
    mainWindow.webContents.send('setPrefs', prefs);
  })
})

ipcMain.on('getPrebuiltActivities', function (event){
  fs.readdir(path.resolve(__dirname,'Activities/'), (err, files) => {
    var activities = []
    files.forEach(file =>{
      if (file.match(/\.html$/)){
        activities.push(file.replace(/\.html$/,''))
      }
    })
    mainWindow.webContents.send('loadPrebuiltActivities', activities);
  })
})

ipcMain.on('getUserActivities', function (event){
  if (fs.existsSync(config.userActivitiesDir)){
    fs.readdir(config.userActivitiesDir, (err, files) => {
      var activities = []
      if (files != null && files.length > 0){
        files.forEach(file =>{
          if (file.match(/\.html$/)){
            activities.push(file.replace(/\.html$/,''))
          }
        })
        mainWindow.webContents.send('loadUserActivities', activities);
      }
    });
  };
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

const openUserActivitiesDirDialog = () => {
  var defaultPath
  if (!fs.existsSync(config.userActivitiesDir)){
    defaultPath = config.userActivitiesDir
  } else {
    defaultPath = app.getPath('documents')
  }
  dialog.showOpenDialog(mainWindow, {
        defaultPath: config.userActivitiesDir,
        properties: ['openDirectory', 'createDirectory']
    }).then(result =>{
      if (result.canceled) {
        console.log("Cancelled")
        return
      } else {
        console.log(result)
        config.userActivitiesDir = result.filePaths[0].replace(/(\s+)/g, '\$1')
        console.log(config)
        saveConfigFile();
        mainWindow.webContents.send('loadActivities')
        // TODO save config file, reload activities list
      }
    });
}

const saveConfigFile = () => {
  fs.writeFile(configFilePath, JSON.stringify(config), {encoding: 'utf8'}, (err) => {
    if (err){
      console.log(err);
    } else {
      console.log("Config file updated successfully.")
    }
  })
}

const getReadyToExport = () => {
  mainWindow.webContents.send('getInputForExport'); // will put the data in the data holder and store activity type
}

const exportFromActivity = () => {
  activityWindow = activityFocused()
  exportActivity(activityWindow.data,activityWindow.activityType,activityWindow.settings,activityWindow.source)
}

const findActivityPath = (activity, source) => {
  if (source == 'prebuilt'){
    let activityPath = path.resolve(__dirname,'Activities/'+activity+'.html')
    return activityPath
  } else if (source == 'user') {
    let activityPath = config.userActivitiesDir + '/' + activity + '.html'
    return activityPath
  } else {
    alert('Source of activity file cannot be determined. Please file a bug report on https://github.com/mjhaxby/hex')
  }
}

const exportActivity = (data,activity,settings,source) => {
  var activityTemplate
  var exportData

  var dialogOptions = {
    title: 'Export activity',
    properties: ['createDirectory'],
    filters: [{
      name: 'HTML file',
      extension: 'html'
    }],
    defaultPath: 'New_'+activity.charAt(0).toUpperCase()+activity.slice(1)+'.html' // when saving files added, can use saved name if given
  }

  let activityPath = findActivityPath(activity, source)

  activityEditor.openActivityTemplate(activityPath).then(activityTemplate => {
      exportData = activityEditor.addActivityTemplateData(activityTemplate, data, settings)
      dialog.showSaveDialog(dialogOptions).then(result =>{
        if (result.canceled){
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

function readPreferences(data){
  let regex = /<!--\*HEX SETTINGS START\*([.\s\S]+)\*HEX SETTINGS END\*-->/gm
  var dataArea = data.match(regex)[0] // find the pref data with the flags
  var jsonData = dataArea.replace(regex,'$1').trim() // remove the flags and trim
  // console.log(jsonData)
  if (jsonData){
    try{
      obj = JSON.parse(jsonData)
    } catch(e) {
      obj = {error: e} // pass on error if there is a json formatting issue
    }
  } else {
    obj = {error: 'Hex settings not found.'} // pass on error if we can't find the settings at all
  }
  return obj
}

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

let openConfigFile = function openConfigFilePromise(file){
  return new Promise((resolve, reject)=>{
    fs.readFile(file, 'utf-8', (err, data) => {
      if(err){
        console.log("An error ocurred reading the config file:" + err.message);
        reject("Error");
      }
      // console.log(data)
      // configFile = data.toString()
      resolve(data);
    });
  })}

function getConfig(){
  if (fs.existsSync(configFilePath)) { // look for config file
    console.log('Config file path found: ' + configFilePath)
  } else { // create the file if it doesn't exist
    fs.writeFile(configFilePath, JSON.stringify(defaultConfig), {encoding: 'utf8'}, (err) => {
      if (err){
        console.log(err);
      } else {
        console.log("Config file create successfully.")
      }
    })
  }
  openConfigFile(configFilePath).then(configFile => {
    try{
      config = JSON.parse(configFile)
    } catch(e) {
      config = {error: e} // pass on error if there is a json formatting issue
    }
    console.log(config)
    // mainWindow.webContents.send('setConfig', config); // not using this yet
  })
}

function dialogNotReadyMsg(){
  var dialogOptions = {
    message: 'Sorry, this activity is not ready yet.',
    title: 'Sorry!',
    type: 'warning'
  }
  dialog.showMessageBoxSync(dialogOptions)
}

function getTableDataForClipboard(form){
  mainWindow.webContents.send('copyToClipboard', form);
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
      },
      {
        label: 'Select user activities folder…',
        click: () => {openUserActivitiesDirDialog()}
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
  {
    label: 'Tools',
    submenu: [
      {
        label: 'Copy table as tabbed text',
        accelerator: process.platform === 'darwin' ? 'Cmd+Shift+C' : 'Ctrl+Shift+C',
        click: () => { getTableDataForClipboard('block') }
      },
      {
        label: 'Copy table as JSON',
        accelerator: process.platform === 'darwin' ? 'Cmd+Shift+Alt+C' : 'Ctrl+Shift+Alt+C',
        click: () => { getTableDataForClipboard('json') }
      }
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
