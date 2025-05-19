// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog, shell, clipboard } = require('electron')
const crypto = require('crypto'); // for hashing
const contextMenu = require('electron-context-menu');
const fs = require('fs')
const path = require('path')
const activityEditor = require('./activityEditor.js')
const tools = require('./tools.js')
const octokit = require('@octokit/request')
const AdmZip = require('adm-zip');
const sizeOfImage = require("buffer-image-size")

const isMac = process.platform === 'darwin'

const v = app.getVersion().replace(' ', '');

const extensions = {image: ['jpg','jpeg','png','gif','svg','webp'], text: ['txt'], sound: ['mp3', 'wav', 'm4a']} // extensions supported for importing files into data and settings

const debugMode = !app.isPackaged || app.getVersion().includes('alpha');

var config
var prefsStore // for checking security later
var currentActivity
var currentSource
var openTablePath = ''
var importFileStore = {}
var prefsWaiting = {exists: false}
var profileStore = { name: '', activities: [] }
var openProfilePath = ''
var lastSavedProfile = { name: '', activities: [] }
var profileActionWaiting = ''
var activitySettingControlsStore = {}
var prebuiltActivitiesList
var userActivitiesList

// to check for new versions
// async function checkForUpdate(){
//     const v = app.getVersion().replace(' ', '');
//     const url = 'https://api.github.com/repos/mjhaxby/hex/releases/latest';
//     const defaultOptions = {
//       method: 'GET',
//       headers: {'User-Agent':'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:59.0)'},
//       body: null,
//       followRedirect: true,
//       maxRedirectCount: 20,
//       timeout: 0,
//       size: 0,
//     };
//     const response = await request(url, defaultOptions);
//     const text = await response.text();
//     // var latestV = JSON.parse(text).tag_name.replace('v', '');
//     console.log(text)
// }

async function checkForUpdate() {  
  const appName = app.getName() // during dev, this will return electron instead of hex
  const releaseInfo = await octokit.request('GET /repos/mjhaxby/hex/releases/latest', {
    owner: 'MJHAXBY',
    repo: 'HEX'
  })
  // console.log(releaseInfo)
  var latestV = releaseInfo.data.tag_name.replace('v', '');
  if (latestV != v && appName != 'Electron') { // don't ask this in dev testing
    if(debugMode){console.log('Update found\nCurrent version: ' + v + '\nNew version: ' + latestV)}
    // var changeLog = releaseInfo.data.body.replace('<strong>Changelog</strong>', 'Update available. Here are the changes:\n');
    var changeLog = 'Press download now to see the changelog and download.' // Improve this later.
    const options = {
      type: 'question',
      buttons: ['Download now', 'Later'],
      defaultId: 2,
      title: 'Update',
      message: 'New version of hex available',
      detail: changeLog,
    };

    dialog.showMessageBox(null, options) // change null to windows.main?
      .then((response) => {
        if(debugMode){console.log('User response to update')}
        if(debugMode){console.log(response)}
        if (response.response === 0) {
          shell.openExternal('https://github.com/mjhaxby/hex/releases/latest');
        }
      });
  }
}

contextMenu({
  showLookUpSelection: true,
  showCopyLink: true,
  showServices: true
})

windows = {}
// mainW
// profileEditor
// documentation

windows['activities'] = [] // stores activity windows and later their data
// var blockBustersWindow

const configFilePath = app.getPath('userData') + '/hex_config.json'
const defaultConfig = { userActivitiesDir: app.getPath('documents') + '/Hex/', showAdvancedExport: false, showScormInfo: true }
config = { ...defaultConfig }

// var dataHolder // for holding data to send to apps (TO DELETE)
// var activityType // for remembering activity type (TO DELETE)

const activityWindowPrototype = {
  activityType: null,
  window: null,
  windowId: null,
  data: null,
  settings: null,
  importedFiles: null
}

const createMainWindow = () => {
  // Create the browser window.
  windows['main'] = new BrowserWindow({
    title: "Hex",
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: debugMode,
      sandbox: app.isPackaged,
      contentSecurityPolicy: "default-src 'self' data:;" // only own data
    }
  })
  process.env.MAIN_WINDOW_ID = windows.main.id;

  // and load the index.html of the app.
  windows.main.loadFile('index.html')

  // Open the DevTools.
  // windows.main.webContents.openDevTools()
}

const createActivityWindow = (activityType, data, settings, source, importedFiles) => {

  // window options
  const windowOpts = {
    title: activityType,
    show: false, // hidden at first so that the position can be determined
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload_activity.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: debugMode,
      sandbox: app.isPackaged,
      contentSecurityPolicy: "default-src 'self' data:;"  // only own data
    }
  }

  // get position of current browser window
  if (BrowserWindow.getFocusedWindow()) {
    current_win = BrowserWindow.getFocusedWindow();
    const pos = current_win.getPosition();
    Object.assign(windowOpts, {
      x: pos[0] + 22,
      y: pos[1] + 22,
    });
  };

  var newWindow = Object.create(activityWindowPrototype);
  newWindow.activityType = activityType
  newWindow.data = structuredClone(data) // experimenting structuredClone(data) to make sure we don't have a reference to data that can be overwritten (particularly for images)… could try [...data] as well
  newWindow.settings = settings
  newWindow.source = source
  newWindow.importedFiles = importedFiles
  newWindow.window = new BrowserWindow(windowOpts)

  let thisWin = newWindow
  newWindow.window.once('ready-to-show', () => {
    thisWin.window.show()
  })

  newWindow.windowId = newWindow.window.id

  newWindow.window.loadFile(findActivityPath(activityType, source))

  // store the window with the others in an array
  windows.activities.push(newWindow)

  // when it's closed, remove it from the array
  newWindow.window.on('closed', _ => {
    windows.activities.splice(windows.activities.findIndex(window => window.windowId === newWindow.windowId), 1);
  })

}

const createProfileWindow = () => {
  // Create the browser window.
  windows['profileEditor'] = new BrowserWindow({
    title: "Hex Profile Editor",
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: debugMode,
      sandbox: app.isPackaged
    }
  })
  // process.env.MAIN_WINDOW_ID = windows['profileEditor'].id;

  // and load the html of the app.
  windows.profileEditor.loadFile('profileEditor.html')

  windows.profileEditor.on('closed', () => {
    windows.profileEditor = null
  })

  // Open the DevTools.
  // windows.main.webContents.openDevTools()
}

const createDocumentationWindow = () => {
  // Create the browser window.
  windows['documentation'] = new BrowserWindow({
    title: "Hex Documentation",
    width: 800,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: debugMode,
      sandbox: app.isPackaged
    }
  })

  // and load the html of the app.
  let docuPath = path.resolve(__dirname, 'Documentation/index.html')
  windows.documentation.loadFile(docuPath)

  windows.documentation.on('closed', () => {
    windows.documentation = null
  })

  // Open the DevTools.
  // windows.main.webContents.openDevTools()
}

// when the activity page is ready, send the data to load
function finishLoadingActivity(thisWindow) {
  data = windows.activities.find(({ windowId }) => windowId === thisWindow.id).data
  settings = windows.activities.find(({ windowId }) => windowId === thisWindow.id).settings
  importedFiles = windows.activities.find(({ windowId }) => windowId === thisWindow.id).importedFiles
  if (thisWindow) {
    thisWindow.webContents.send('loadActivity', data, settings, importedFiles)
  }
}

ipcMain.on('activityReady', (event, arg) => {
  finishLoadingActivity(event.sender.getOwnerBrowserWindow())
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.setMenu(dockMenu)
  }
  app.setAboutPanelOptions(aboutOptions)
  createMainWindow();
  getConfig()
    .then((currentConfig) => {
      config = currentConfig
      if (config.showAdvancedExport) {
        applicationMenu.getMenuItemById('showAdvancedExport').checked = true
        // windows.main.webContents.send('showAdvancedExport')
        if(debugMode){console.log('marking menu item as true')}
      }
      windows.main.webContents.send('configStore', config)
      // if we're debugging, add the dev tools
      if (debugMode) {
        let menuItem = applicationMenu.getMenuItemById('tools')
        menuItem.submenu.append(new MenuItem({ role: 'toggleDevTools' }))
      }
      Menu.setApplicationMenu(applicationMenu) // set menu AFTER config is loaded
    })
    .catch((error) => {
      console.error(error)
      Menu.setApplicationMenu(applicationMenu) // set menu anyway 
    });
  checkForUpdate();
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

// prevents navigation
// app.on('web-contents-created', (event, contents) => {
//   contents.on('will-navigate', (event, navigationUrl) => {
//     const parsedUrl = new URL(navigationUrl)

//     if (parsedUrl.protocol !== 'file:') {
//       event.preventDefault()
//     }
//   })
// })

app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)

    if (parsedUrl.protocol !== 'file:') {
      // const window = contents.getOwnerBrowserWindow();
      // if (window) {
      //   window.close();
      // }
      event.preventDefault();

      dialog.showMessageBox({
        'type': 'question',
        'title': 'Open URL',
        'message': 'Would you like to navigate to this page in your browser? Make sure you trust the author of this activity template.',
        'buttons': ['Yes', 'No']
      }).then(result => {
        if (debugMode) {
          console.log(result)
        }
        try {
          if (result.response != 0) { return; }
          if (result.response == 0) {
            shell.openExternal(navigationUrl);
          }
        } catch (err) {
          if (debugMode) {
            console.log(err)
          }
        }

      })
    }
  })
})

// probably don't actually want this, but leaving it for now
const dockMenu = Menu.buildFromTemplate([
  {
    label: 'New Window',
    click() { createMainWindow() }
  }
  //{ label: 'New Command...' } // add coma before
])

function setDefaultActivitySettings(settings){
  if (!config.activities) {
    config.activities = {};
  }

  const activityKey = currentSource + '_' + currentActivity;

  if (!config.activities[activityKey]) {
    config.activities[activityKey] = {};
  }

  config.activities[activityKey].default_settings = settings;
  saveConfigFile()
}

ipcMain.on('profileEditorReady', function (event) {
  console.log('Sending profile to profile editor')
  console.log(profileStore)

  loadProfileInEditor()
})

function resetCurrentActivitySettingDefaults(){
  if (!config.activities) {
    config.activities = {};
}

const activityKey = currentSource + '_' + currentActivity;

if (!config.activities[activityKey]) {
    config.activities[activityKey] = {};
}

  delete config.activities[activityKey].default_settings;
  windows.main.webContents.send('setPrefs', prefsStore)
  saveConfigFile()
}

function findSettingAnomolies(settings) {

  // first check that we're supposed to have some settings. We'll report this straight away if we do but we're not supposed to, in order to not have a bunch of uncaught errors.
  if (!prefsStore.hasOwnProperty('settings')) {
    if (Object.keys(settings).length == 0) {
      return [];
    } else {
      return [{ error: 'number', expectedNum: 0, actualNum: Object.keys(settings).length }]
    }
  }

  var actualNumSettings = Object.keys(settings).length
  var expectedNumSettings = prefsStore.settings.length

  var currentSetting
  var currentSettingVarType
  var currentExpectedVarType
  var errors = []

  if (actualNumSettings != expectedNumSettings) {
    errors.push({ error: 'number', expectedNum: expectedNumSettings, actualNum: actualNumSettings })
  }

  prefsStore.settings.forEach(setting => {
    currentSetting = settings[setting.name]
    currentSettingVarType = typeof currentSetting

    if (setting.type == 'select' || setting.type == 'text' || setting.type == 'code' || setting.type == 'language' || setting.type == 'select-import') {
      currentExpectedVarType = 'string'
    } else if (setting.type == 'number') {
      currentExpectedVarType = 'number'
    } else if (setting.type == 'checkbox') {
      currentExpectedVarType = 'boolean'
    } else if (setting.type == 'font_family') {
      currentExpectedVarType = 'object'
    } else {
      currentExpectedVarType = 'unknown'
    }

    // console.log(currentSetting + ' is ' + setting.type + ' and evaluated as ' + currentExpectedVarType)

    if (currentSetting == null) {
      errors.push({ name: setting.name, error: 'missing' })
    } else if (currentSettingVarType != currentExpectedVarType) {
      errors.push({ name: setting.name, error: 'type', expectedType: currentExpectedVarType, actualType: currentSettingVarType })
    }
  })

  return errors

}

function reportSettingErrors(errors) {
  var errorString = 'The activity could not be run because the following anomolies in the activity settings were detected:'
  errors.forEach(error => {
    if (error.error == 'number') {
      errorString += '\n' + error.expectedNum + ' settings were expected, but there are ' + error.actualNum + '.'
    } else if (error.error == 'missing') {
      errorString += '\nThe "' + error.name + '" setting is missing.'
    } else if (error.error == 'type') {
      errorString += '\nSetting "' + error.name + '" should be a ' + error.expectedType + ' but a ' + error.actualType + ' was supplied.'
    }
  })
  if (debugMode) {
    console.log(errors)
  }
  dialog.showErrorBox('Error running activity', errorString)
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function dataSelectImport(cell,fileTypes,file=false,cellOffset = 0){
  var validExtensions = []
   //to do: allow multiple files and increase offset with each file added

  var dialogOptions = {
    title: 'Select file',
    properties: ['openFile'],
    filters: []
  } 
  if (debugMode) {
    console.log(cell)
    console.log(fileTypes)
    console.log(path)
  }

  fileTypes.forEach(fileType => {
    if (extensions.hasOwnProperty(fileType.toLowerCase())){
      dialogOptions.filters.push({name: capitalizeFirstLetter(fileType), extensions: extensions[fileType.toLowerCase()]})
      validExtensions.push(...extensions[fileType.toLowerCase()])      
    } else {
      if (debugMode) {
        console.log('File type not found: ' + fileType)
      }
    }
  })  

  if (file){
    dataSelectImportFromFile(file, validExtensions, cell, cellOffset)
  } else {
    dialog.showOpenDialog(windows.main, dialogOptions).then(result => {
      if (result.cancelled) {
        console.log("Cancelled")
        windows.main.webContents.send('dataCellFileImportResult', cell, false, cellOffset)
        return
      }
  
      dataSelectImportFromPath(result.filePaths[0], validExtensions, cell, cellOffset)
      
    })
  }  
}

// function dataSelectImportFromFile(file, validExtensions, cell, cellOffset){
//   console.log(file)
//   console.log(file.name)

    
//   if (!validExtensions.includes(file.ext)) {
//     if (debugMode) {
//       console.log("File extension: ." + fileExt)
//       console.log("Valid extensions: ")
//       console.log(validExtensions)
//     }
//     dialog.showErrorBox("Error opening file", "Invalid file extension.")
//     return;
//   }
//   if (file.size > (1024 * 1024 * 5)) { // for now, limit is 5MB
//     console.log("File is too big. " + file.size + " bytes.");
//     dialog.showErrorBox("Error opening file", "This file is too large to import into an activity. Only files 500KB or smaller are supported.")
//     windows.main.webContents.send('dataCellFileImportResult', cell, false)  
//   } else {
//     addDataToDataCell(cell,cellOffset,file.data,file.ext,file.size,file.dimensions)
//   }
// }
  

function dataSelectImportFromPath(filePath, validExtensions, cell, cellOffset){
  const fileExt = path.extname(filePath).toLowerCase().slice(1)
    if (!validExtensions.includes(fileExt)) {
      if (debugMode) {
        console.log("File extension: ." + fileExt)
        console.log("Valid extensions: ")
        console.log(validExtensions)
      }
      dialog.showErrorBox("Error opening file", "Invalid file extension.")
      return;
    }
    fs.stat(filePath, (err, stats) => {
      if (err) {
        if (debugMode) {
          console.log("An error ocurred reading the file:" + err.message);
        }
        dialog.showErrorBox("Error opening file", "The file statistics could not be read.")
        return;
      }
      if (stats.size > (1024 * 1024 * 5)) { // for now, limit is 5MB
        console.log("File is too big. " + stats.size + " bytes.");
        dialog.showErrorBox("Error opening file", "This file is too large to import into an activity. Only files 500KB or smaller are supported.")
        windows.main.webContents.send('dataCellFileImportResult', cell, false)
      } else {
        openFileForDataCell(cell,cellOffset,filePath,fileExt,stats)        
      }
    })
}


function openFileForDataCell(cell,cellOffset,filePath,fileExt,stats){
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (debugMode) {
        console.log("An error ocurred reading the file:" + err.message);
      }
      dialog.showErrorBox("Error opening file", "The file could not be read.")
      windows.main.webContents.send('dataCellFileImportResult', cell, false)
      return;
    }
    addDataToDataCell(cell,cellOffset,data.toString('base64'),fileExt,stats.size,sizeOfImage(data))
    
  })
}

function addDataToDataCell(cell,cellOffset,dataAsString,fileExt,fileSize,dimensions=null){
  let fileStoreItem = { data: dataAsString, ext: fileExt, fileSize: fileSize, type: determineFileType(fileExt) }
  
    // for images, record dimensions
    if (dimensions){
      fileStoreItem.dimensions = dimensions
    }

    // importFileStore['data_' + cell] = fileStoreItem

    windows.main.webContents.send('dataCellFileImportResult', cell, fileStoreItem,cellOffset)
}

function determineFileType(fileExt){
  for (const type in extensions){
    if(extensions[type].includes(fileExt)){
      return type
    }
  }
  return null
}

function customSelectImport(settingId,fileTypes){
  var validExtensions = []

  var dialogOptions = {
    title: 'Select file',
    properties: ['openFile'],
    filters: []
  } 

  if(fileTypes == null || fileTypes == undefined || fileTypes.length == 0){
    fileTypes = ['image'] // if no file types are specified, default to image
  }

  fileTypes.forEach(fileType => {
    if (extensions.hasOwnProperty(fileType.toLowerCase())){
      dialogOptions.filters.push({name: capitalizeFirstLetter(fileType), extensions: extensions[fileType.toLowerCase()]})
      validExtensions.push(...extensions[fileType.toLowerCase()])
    } else {
      if (debugMode) {
        console.log('File type not found: ' + fileType)
      }
    }
  })
  // if(fileTypes.includes('Images') || fileTypes.includes('images') ){
  //   dialogOptions.filters.push({name: 'Images', extensions: ['jpg','jpeg','png','gif','svg','webp']})
  // }
  // if(fileTypes.includes('Text') || fileTypes.includes('images') ){
  //   dialogOptions.filters.push({name: 'Text', extensions: ['text']})
  // }
  // TO DO: Add others?

  dialog.showOpenDialog(windows.main, dialogOptions).then(result => {
    if (result.cancelled) {      
      windows.main.webContents.send('customSelectImportFileResult', settingId, false)
      return
    }
    const fileExt = path.extname(result.filePaths[0]).toLowerCase().slice(1)
    if (!validExtensions.includes(fileExt)) {
      if (debugMode) {
        console.log("File extension: ." + fileExt)
        console.log("Valid extensions: ")
        console.log(validExtensions)
      }
      dialog.showErrorBox("Error opening file", "Invalid file extension.")
      return;
    }
    fs.stat(result.filePaths[0], (err, stats) => {
      if (err) {
        if (debugMode) {
          console.log("An error ocurred reading the file:" + err.message);
        }
        dialog.showErrorBox("Error opening file", "The file statistics could not be read.")
        return;
      }
      if (stats.size > (1024 * 100)) { // for now, limit is 100KB
        if (debugMode) {
          console.log("File is too big. " + stats.size + " bytes.");
        }
        dialog.showErrorBox("Error opening file", "This file is too large to import into an activity. Only files 100KB or smaller are supported.")
        windows.main.webContents.send('customSelectImportFileResult', settingId, false)
      } else {
        fs.readFile(result.filePaths[0], (err, data) => {
          if (err) {
            if (debugMode) {
              console.log("An error ocurred reading the file:" + err.message);
            }
            dialog.showErrorBox("Error opening file", "The file could not be read.")
            windows.main.webContents.send('customSelectImportFileResult', settingId, false)
            return;
          }

          let fileStoreItem = { data: data.toString('base64'), ext: fileExt, fileSize: stats.size }
        
          if (extensions.image.includes(fileExt)){
            fileStoreItem.dimensions = sizeOfImage(data)
          }

          importFileStore['custom_' + settingId] = fileStoreItem

          windows.main.webContents.send('customSelectImportFileResult', settingId, true, path.basename(result.filePaths[0]))
        })
      }
    })
        
  });
}

function isArrayofStrings(variable) {
  if (!Array.isArray(variable)) {
    return false; // Not an array
  }

  return variable.every((item) => typeof item === 'string');
}


function isArrayofArrayofStrings(variable) {
  if (!Array.isArray(variable)) {
    return false; // Not an array
    console.log('Not an array of arrays!')
  }

  return variable.every((item) => isArrayofStrings(item));
}

function advancedCheckActivityData(data,exporting=false){
  if(!Array.isArray(data)){
    if(debugMode){console.error(`Advanced change activity data: Not an array`)}
    return false // not an array
  }
  let ok = true
  data.forEach(line =>{
    if(!Array.isArray(line)){
      if(debugMode){console.error(`Advanced change activity data: Array does not contain arrays`)}
      ok = false
      return false // line is not array (this will only make us leave the forEach)
    }
    line.forEach(cell =>{
      if(typeof cell != 'string'){
        let properties = Object.getOwnPropertyNames(cell)
        properties.forEach(property => {
         if(property != 'image' && property != 'text' && property != 'datetime'){      
          if(debugMode){console.error(`Advanced change activity data: Invalid property: ${property}`)}
          ok = false
          return false
         } 
        })
        if(cell.hasOwnProperty('text') && typeof(cell.text) != 'string'){
          if(debugMode){console.error(`Advanced change activity data: Text of object is not string`)}
          ok = false
          return false
        }
        if(cell.hasOwnProperty('image')){    
          if(debugMode){console.log(cell.image)}      
          // if(exporting && typeof cell.image != 'object' || !exporting && typeof cell.image != 'number'){ // TO DO: make exporting use the number system too in order to reduce file sizes
          if(cell.image != null && typeof cell.image != 'number'){ // TO DO: make exporting use the number system too in order to reduce file sizes
            if(debugMode){console.error(`Advanced change activity data: Image data link corrupt: typeof returns ${typeof cell.image}`)}
            ok = false
            return false
          }
        }
      }
    })
  })
  return ok
}

function checkFileStore(store){
  let ok = true
  let properties = Object.getOwnPropertyNames(store)
  if(debugMode){console.log('Checking the following file store properties: ')}
  if(debugMode){console.log(properties)}
  properties.forEach(property =>{
    if(property != 'gameData'){
      ok = checkImage(store[property])
    } else {
      if(debugMode){console.log(`Game data length is ${store.gameData.length}`)}
      for(let i = 1; i<store.gameData.length+1; i++){   
        if(debugMode && store.gameData[i] && typeof store.gameData[i] == 'object'){console.log(`Game data item ${i} has ${Object.keys(store.gameData[i]).length} keys`)}
        else {console.log(`Game data item ${i} is empty`)}
        if(store.gameData[i] && typeof store.gameData[i] == 'object' && Object.keys(store.gameData[i]).length > 0){
          ok = checkImage(store.gameData[i])
        } else if (debugMode){
          console.log(`Game data item ${i} is empty`)
        }
        if(!ok){
          if(debugMode){console.log('Image error.')}
          if(debugMode){console.log(store.gameData[i])}
          return false
        }
      }
    }
    if(!ok){
      return false
    }
  })
  return ok
}

function deleteUnusedFileStoreItems(fileStore, settings) {
  if (settings == null || settings == undefined || settings.length == 0) {
    return { ...fileStore }
  }

  // Create a shallow copy of fileStore to avoid mutating the original
  const newFileStore = { ...fileStore }

  // Remove unused 'custom_' fileStore items based on current settings
  Object.keys(newFileStore).forEach(key => {
    if (key.startsWith('custom_setting_')) {
      let used = false
      Object.values(settings).forEach(setting => {
        if (setting == key) {
          used = true
        }
      })
      if (!used) {
        delete newFileStore[key]
        if(debugMode){console.log(`Deleting ${key} from file store`)}
      }
    }
  });
  return newFileStore
}

function checkImage(image){
  let ok = true

  if(typeof image.data != 'string' || typeof image.ext != 'string' || (typeof image.fileSize != 'string' && typeof image.fileSize != 'number')){
    ok = false
  }

  // Below is coding to check the file size. However, this doesn't seem reliable, so for now it's disabled.

    //   let bytesEstimate = (image.data.length - 814) / 1.37
    // if(debugMode){console.log(`Check image: Bytes estimate is ${bytesEstimate}, recorded file size is ${image.fileSize}`)}
    // if(parseInt(image.fileSize) < bytesEstimate*0.75 || parseInt(image.fileSize) > bytesEstimate*1.25){
    //   console.error('Advanced change activity data: Size of image seems suspicious')
    //   ok = false
    //   return false
    // }
    return ok
}

function verifiyActivityAndSource(activity, source) {
  if (source == 'prebuilt') {
    if (prebuiltActivitiesList.includes(activity)) {
      return true
    } else {
      return false
      console.error('Activity name not found on the prebuilt activities list')
    }
  } else if (source == 'user') {
    if (userActivitiesList.includes(activity)) {
      return true
    } else {
      return false
      console.error('Activity name not found on the user activities list')
    }
  } else {
    return false
    console.error('Invalid source')
  }
}

function validateSender(frame) {
  // Parses the URL of the sender and check that it is local
  url = new URL(frame.url)
  if (url.protocol === 'file:') return true
  return false
}

function readActivitySettings(activity, source) {
  return new Promise((resolve, reject) => {
    if (debugMode) {
      console.log(source)
    }
    const activityPath = findActivityPath(activity, source);

    activityEditor.openActivityTemplate(activityPath)
      .then(activityTemplate => {
        const prefs = readPreferences(activityTemplate);
        if (prefs.hasOwnProperty('settings')) {
          resolve(prefs.settings);
        } else {
          resolve(null);
        }
      })
      .catch(error => {
        reject(error); // Propagate the error to the caller
      });
  });
}

function activityTemplateOnlyRequiresStrings(){
  let result = true
  if(prefsStore.hasOwnProperty('cols')){
    prefsStore.cols.forEach(col => {
      if (col.image){
        result = false
        return false // leave forEach
      } else if (col.sound) {
        result = false
        return false // leave forEach
      } else if (col.datetime){
        result = false
        return false
      }
    })
  } else {
    return true
  }
  return result
}

function extractFilesFromGameDataToImportFileStore(data){
  importFileStore.gameData = [0] // add an empty first array so that we can use existingFile as both a bool and an integer (otherwise existingFile while count as false if 0)
  if (debugMode) {
    console.log(data)
  }
  for (let row = 0; row < data.length; row++){
    for (let col = 0; col < data[row].length; col++){
      let cell = data[row][col]
      if(typeof cell != 'string'){
        for (const file in cell){
          if (file != 'text' && file != 'datetime' && cell[file] != null){  // ignore text and datetime, we can leave this as it is
            let existingFile = gameFileAlreadyExists(cell[file]) // returns index of existing file
            if(existingFile){
              cell[file] = existingFile
            } else {
              importFileStore.gameData.push(cell[file])
              cell[file] = importFileStore.gameData.length-1
            }
          }
        }
      }
    }
  }
  return data
}

function gameFileAlreadyExists(fileStoreItem){
  if (importFileStore.gameData){
    for (let i = 1; i < importFileStore.gameData.length; i++){
      let existingFile = importFileStore.gameData[i]
      // check first the size as this might be quicker than checking the data - most of the time, if these are different, it's not the same file
      // if (debugMode) {
      //   console.log(fileStoreItem.fileSize)
      //   console.log(existingFile.fileSize)
      //   console.log(fileStoreItem.data)
      //   console.log(existingFile.data)
      // }
      if (fileStoreItem.fileSize == existingFile.fileSize && fileStoreItem.data == existingFile.data){
        return i
      }
    }
  }
  return false
}

function processSaveExport(event,data,purpose='export',path=''){
  if (!validateSender(event.senderFrame)) {
    dialog.showErrorBox('Security error!', 'A renderer sent a signal from a non-local source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
    return null
  }  
  let settingErrors = findSettingAnomolies(data.settings)
  let dataOK
  let fileStoreOK = true
  let stringsOnlyActivity = activityTemplateOnlyRequiresStrings()
  // console.log(`Only requires strings? ${stringsOnlyActivity}`)
  if (stringsOnlyActivity){
    dataOK = isArrayofArrayofStrings(data.input)
    importFileStore.gameData = [] // empty the file store so we don't unecessarily add a bunch of cached files
  } else {
    data.input = extractFilesFromGameDataToImportFileStore(data.input)
    dataOK = advancedCheckActivityData(data.input,true)
    fileStoreOK = checkFileStore(importFileStore)
  }
  let activityOK = verifiyActivityAndSource(data.activity, data.source)
  let typeOK = (data.type == 'html' || data.type == 'scorm')
  let packageIdOK = (typeof data.packageIdentifier == 'string')
  let exportFileStore = deleteUnusedFileStoreItems(importFileStore,data.settings)
  // settingErrors = findSettingAnomolies(data.settings)
  if (settingErrors.length == 0 && dataOK && activityOK) {
    if (purpose == 'export'){
      exportActivity(data.input, data.activity, data.settings, exportFileStore, data.source, data.type, data.packageIdentifier)
    } else if (purpose == 'save'){
      saveTable(data,path,exportFileStore)
    }
  } else if (settingErrors.length > 0) {
    reportSettingErrors(settingErrors)
  } else if (!dataOK) {
    dialog.showErrorBox('Invalid data', 'Data in the table is invalid. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
  } else if (!activityOK) {
    dialog.showErrorBox('Error finding activity', 'There was an error with the activity name or activity source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
  } else if (!typeOK) {
    dialog.showErrorBox('Error in export type', 'There was an error in establishing the export type.  This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
  } else if (!packageIdOK) {
    dialog.showErrorBox('Error in package identifier', 'There was an error in the SCORM pacakage identifier.  This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
  }
}


//ipcMain.on will receive the "runActivity"" info from renderprocess
ipcMain.on("runActivity", function (event, data, settings, activity, source) {
  if (!validateSender(event.senderFrame)) {
    dialog.showErrorBox('Security error!', 'A renderer sent a signal from a non-local source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
    return null
  }
  if (debugMode) {
    console.log('Running activity')
  }
  // console.log(event)
  // console.log(data)
  if(prefsStore.hasOwnProperty('markdown_support') && prefsStore.markdown_support){
    // TO DO: && if enabled by user
    withMarkdown = activityEditor.applyMarkdown(data, settings, prefsStore.settings)    
    data.input = withMarkdown.data
    settings = withMarkdown.settings
  }
  if (debugMode) {
    console.log(activity)
    console.log(settings)
  }
  validateSender(event.senderFrame) // security check
  let settingErrors = findSettingAnomolies(settings) // security check
  // let fileStore = deleteUnusedFileStoreItems(importFileStore,settings) // remove any files that are not used in the settings
  let fileStore = importFileStore // for now, don't delete unused items
  
  let dataOK
  let fileStoreOK = true
  let stringsOnlyActivity = activityTemplateOnlyRequiresStrings()

  if (debugMode) {console.log(`Only requires strings? ${stringsOnlyActivity}`)}

  if (stringsOnlyActivity){
    dataOK = isArrayofArrayofStrings(data)
    if (debugMode) {console.log(`Data ok? ${dataOK}`)}
  } else {    
    data = extractFilesFromGameDataToImportFileStore(data)
    dataOK = advancedCheckActivityData(data)
    fileStoreOK = checkFileStore(fileStore)
    if (debugMode) {console.log(`Data ok? ${dataOK}`)}
  }

  let activityOK = verifiyActivityAndSource(activity, source) // security check
  if (debugMode) {console.log(`Activity ok? ${activityOK}`)}

  if (settingErrors.length == 0 && dataOK && activityOK && fileStoreOK) {     
    if(debugMode){console.log('about to make activity window')}
    if(debugMode){console.log(fileStore)}
    createActivityWindow(activity, data, settings, source, fileStore)
  } else if (settingErrors.length > 0) {
    reportSettingErrors(settingErrors)
  } else if (!dataOK) {
    dialog.showErrorBox('Invalid data', 'Data in the table is invalid. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
  } else if (!activityOK) {
    dialog.showErrorBox('Error finding activity', 'There was an error with the activity name or activity source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
  } else if (!fileStoreOK){
    dialog.showErrorBox('File store error','Some files may be corrupted. If this error keeps appearing, please log a bug with the developer.')
  }
});

// packageIdentifier: string
// type: html scorm

ipcMain.on("exportActivity", function (event) {
  if (debugMode) {
    console.log(event)
  }
  getReadyToExport('html')
})


ipcMain.on('sentInputForExport', function (event, data) {
  processSaveExport(event,data,'export')
})

ipcMain.on('sentInputForSave', function (event, data, path){
  processSaveExport(event,data,'save',path)
})

ipcMain.on('readActivityPrefs', function (event, activity, source) {
  if (!validateSender(event.senderFrame)) {
    dialog.showErrorBox('Security error!', 'A renderer sent a signal from a non-local source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
    return null
  }
  activityOK = verifiyActivityAndSource(activity, source)

  // save to refer to these later
  currentActivity = activity
  currentSource = source

  if (activityOK) {
    let activityPath = findActivityPath(activity, source)
    let customDefaults = {}
    activityEditor.openActivityTemplate(activityPath).then(activityTemplate => {
      prefsStore = readPreferences(activityTemplate)
      if (config.activities && config.activities[source+'_'+activity] && config.activities[source+'_'+activity].default_settings){
        customDefaults = config.activities[source+'_'+activity].default_settings
        if (debugMode) {
          console.log(customDefaults)
        }
      }

      // get some more information for when exporting later
      prefsStore.app_version = v;
      prefsStore.platform = process.platform
      prefsStore.source = source
      prefsStore.activity = activity
      if (debugMode) {
        console.log(prefsStore)
      }

      //transform templates into full settings
      if(prefsStore.hasOwnProperty('settings')){
        prefsStore.settings = unrollTemplates(prefsStore.settings)
      }

      // standardise cols to an object (rather than just a string with the col title)
      if (prefsStore.hasOwnProperty('cols')){
        for (let i = 0; i < prefsStore.cols.length; i++){
          if (typeof prefsStore.cols[i] == 'string'){

            prefsStore.cols[i] = {title: prefsStore.cols[i], text: true, image: false, datetime: false}
          }
        }
      }

      if (!prefsWaiting.hasOwnProperty('exists')){
        windows.main.webContents.send('setPrefs', prefsStore, prefsWaiting);
        // reset prefsWaiting now that they've been set
        prefsWaiting = {exists: false}
      } else {
        windows.main.webContents.send('setPrefs', prefsStore, customDefaults);
      }      

      // if the activity is in the profile, get the latest version of that and apply it
      activityProfile = profileStore.activities.find(actProf => actProf.activity === activity && actProf.source === source)
      if (activityProfile && windows.profileEditor){ // if the window is open, we'll assume that has the latest version of the profile
        windows.profileEditor.webContents.send('updateAndApplyActivityProfile',activity,source)
      } else if (activityProfile) { // if it's not, the latest version is already here
        windows.main.webContents.send('applyActivitySettings',activityProfile.settings)
      }

      importFileStore = {} // purge imported file store ready for new files for use in custom settings (these are likely to be images or sounds)
    })
  } else {
    dialog.showErrorBox('Error reading activity preferences', 'There was an error with the activity name or activity source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
  }
})

// this is for just getting the activity settings (used by the profile editor)
// Maybe don't need this?
// ipcMain.on('readActivitySettings', function (event, activity, source){
//   if (!validateSender(event.senderFrame)) {
//     dialog.showErrorBox('Security error!','A renderer sent a signal from a non-local source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
//     return null
//   }
//   activityOK = verifiyActivityAndSource(activity, source)

//   if (activityOK){
//     readActivitySettings.then(settings => {
//       windows.profileEditor.webContents.send('loadSettings', settings);
//     })
//   } else {
//     dialog.showErrorBox('Error reading activity preferences','There was an error with the activity name or activity source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
//   }
// })

ipcMain.on('getPrebuiltActivities', function (event) {
  if (!validateSender(event.senderFrame)) {
    dialog.showErrorBox('Security error!', 'A renderer sent a signal from a non-local source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
    return null
  }
  fs.readdir(path.resolve(__dirname, 'Activities/'), (err, files) => {
    var activities = []
    files.forEach(file => {
      if (file.match(/\.html$/) && (debugMode || (!file.match(/.+_WIP.+/i) && !file.match(/.+_alpha.+/)))) {
        activities.push(file.replace(/\.html$/, ''))
      }
    })    
    prebuiltActivitiesList = activities
    windows.main.webContents.send('loadPrebuiltActivities', activities);
  })
})

ipcMain.on('getUserActivities', function (event) {
  if (!validateSender(event.senderFrame)) {
    dialog.showErrorBox('Security error!', 'A renderer sent a signal from a non-local source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
    return null
  }
  if (fs.existsSync(config.userActivitiesDir)) {
    fs.readdir(config.userActivitiesDir, (err, files) => {
      var activities = []
      if (files != null && files.length > 0) {
        files.forEach(file => {
          if (file.match(/\.html$/)) {
            activities.push(file.replace(/\.html$/, ''))
          }
        })
        userActivitiesList = activities
        windows.main.webContents.send('loadUserActivities', activities);
      }
    });
  };
})

ipcMain.on('setActivitySettingsDefaults', function (event, settings) {
  setDefaultActivitySettings(settings)
})

ipcMain.on('dataSelectImport', function(event,cell, fileTypes){
  dataSelectImport(cell,fileTypes)
})

// no longer used (see below) – locked this out for security reasons too
// ipcMain.on('dataSelectImportFromPath', function(event, cell, fileTypes, path){
//   dataSelectImport(cell,fileTypes, path)
// })
// nevermind, don't need this either
// ipcMain.on('dataSelectImportFromFile', function(event, cell, fileTypes, file, cellOffset){
//   console.log('Received data')
//   dataSelectImport(cell,fileTypes, file,cellOffset)
// })

ipcMain.on('customSelectImport', function (event, settingId, fileTypes){
  customSelectImport(settingId, fileTypes)
})

ipcMain.on('settingsToProfile', function (event, activity, source, settings) {
  activityProfile = profileStore.activities.find(profile => profile.activity === activity && profile.source === source)
  if (activityProfile) {
    activityProfile.settings = settings
  } else {
    profileStore.activities.push({ activity: activity, source: source, settings: settings })
  }
  if (debugMode) {
    console.log(profileStore)
  }
  if (windows.profileEditor){
    readActivitySettings(activity, source).then(settingControls => {
      windows.profileEditor.webContents.send('addToProfile', activity, source, settings, settingControls)
    })
  }  
})

ipcMain.on('updateProfile', function (event, profile){
  if (debugMode) {
    console.log(profile)
    profile.activities.forEach(activityProfile => {
      console.log(activityProfile.settings)
    })
  }
  profileStore = profile
})

ipcMain.on('saveProfile', function(event, profile, path){
  profileStore = profile
  saveProfile(profile,path)
})

ipcMain.on('applyActivityProfile', function(event, activity, source){
  let activityProfile = profileStore.activities.find(profile => profile.activity === activity && profile.source === source)
  windows.main.webContents.send('applyActivitySettings',activityProfile.settings)
})

ipcMain.on('checkProfileChangesThen', function(event, profile, action){
  profileStore = profile
  checkProfileChangesThen(action)
})


ipcMain.on("requestConfig", function (event) {
  windows.main.webContents.send('configStore', config)
})



const importTableDialog = () => {
  var dialogOptions = {
    title: 'Select file',
    properties: ['openFile'],
    filters: [  
      {
        name: 'text',
        extensions: 'txt'
      },
      {
        name: 'hex',
        extensions: 'hex'
      },
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
      return
    }
    if (debugMode) {
      console.log(result)
    }
    const fileExt = path.extname(result.filePaths[0])
    if (fileExt.toLowerCase() != '.hex' &&fileExt.toLowerCase() != '.json' && fileExt.toLowerCase() != '.txt') {
      if (debugMode) {
        console.log("File extension: " + fileExt)
      }
      dialog.showErrorBox("Error opening file", "Invalid file extension. Please select a .txt or .json file.")
      return;
    }

    fs.stat(result.filePaths[0], (err, stats) => {
      if (err) {
        if (debugMode) {
          console.log("An error ocurred reading the file:" + err.message);
        }
        dialog.showErrorBox("Error opening file", "The file statistics could not be read.")
        return;
      }
      if (stats.size > (1024 * 1024)) { // slightly arbitarily putting the limit at a megabyte, but this would be a huge table in any case
        if(debugMode){console.log("File is too big. " + stats.size + " bytes.")};
        dialog.showErrorBox("Error opening file", "This file is too large for hex to read efficiently. Please choose a file less than a megabyte in size or consider making a smaller activity.")
      } else {
        fs.readFile(result.filePaths[0], 'utf-8', (err, data) => {
          if (err) {
            if(debugMode){console.log("An error ocurred reading the file:" + err.message)};
            dialog.showErrorBox("Error opening file", "The file could not be read.")
            return;
          }

          const regexJson = /\[?\["([^"]*(?:"[^"]*)*)"(?:,\s*)*\]\]?/;
          const regexTab = /\t/
          const isJson = regexJson.test(data.trim())
          const isTabbed = regexTab.test(data.trim())
          if (isJson || isTabbed) {
            windows.main.webContents.send('loadInput', data);
          } else {
            if(debugMode){console.log("Analysed as JSON: " + isJson)}
            if(debugMode){console.log("Tabs detected: " + isTabbed)}
            dialog.showErrorBox("Error opening file", "Invalid file format. Please used tabbed input or JSON.")
            return;
          }

        });
      }
    })
  });
};

const openUserActivitiesDirDialog = () => {
  var defaultPath
  if (!fs.existsSync(config.userActivitiesDir)) {
    defaultPath = config.userActivitiesDir
  } else {
    defaultPath = app.getPath('documents')
  }
  dialog.showOpenDialog(windows.main, {
    defaultPath: config.userActivitiesDir,
    properties: ['openDirectory', 'createDirectory']
  }).then(result => {
    if (result.canceled) {
      return
    } else {
      if(debugMode){console.log(result)}
      config.userActivitiesDir = result.filePaths[0].replace(/(\s+)/g, '\$1')
      if(debugMode){console.log(config)}
      saveConfigFile();
      windows.main.webContents.send('loadActivities')
      // TODO save config file, reload activities list
    }
  });
}

const toggleAdvancedExportOptions = () => {
  if (Menu.getApplicationMenu().getMenuItemById('showAdvancedExport').checked) {
    config.showAdvancedExport = true
    if(debugMode){console.log('Show advanced export options is on')}
  } else {
    config.showAdvancedExport = false
    if(debugMode){console.log('Show advanced export options is off')}
  }
  windows.main.webContents.send('configStore', config)
  saveConfigFile();
}

const saveConfigFile = () => {
  fs.writeFile(configFilePath, JSON.stringify(config), { encoding: 'utf8' }, (err) => {
    if (err) {
      if(debugMode){console.log(err)};
    } else {
      if(debugMode){console.log("Config file updated successfully.")}
      if(debugMode){console.log(config)}
    }
  })
}

const getReadyToExport = (type) => {
  windows.main.webContents.send('getInputForExport'); // will put the data in the data holder and store activity type  
}

const exportFromActivity = () => {
  activityWindow = activityFocused()
  exportActivity(activityWindow.data, activityWindow.activityType, activityWindow.settings, activityWindow.importedFiles, activityWindow.source, 'html', '') // TO DO: possible to export scorm from window
}

const findActivityPath = (activity, source) => {
  if (source == 'prebuilt') {
    let activityPath = path.resolve(__dirname, 'Activities/' + activity + '.html')
    return activityPath
  } else if (source == 'user') {
    let activityPath = config.userActivitiesDir + '/' + activity + '.html'
    return activityPath
  } else {
    dialog.showErrorBox('Activity source not found.', 'Source of activity file cannot be determined. Please file a bug report on https://github.com/mjhaxby/hex')
  }
}

const exportActivity = (data, activity, settings, files, source, type = 'html', packageIdentifier = '') => {
  var activityTemplate
  var exportData

  if (type == 'html') {
    var dialogOptions = {
      title: 'Export activity',
      properties: ['createDirectory'],
      filters: [{
        name: 'HTML file',
        extension: 'html'
      }],
      defaultPath: 'New_' + activity.charAt(0).toUpperCase() + activity.slice(1) + '.html' // when saving files added, can use saved name if given
    }

    let activityPath = findActivityPath(activity, source)

    activityEditor.openActivityTemplate(activityPath).then(activityTemplate => {
      activityEditor.openFonts(settings).then ( fontData => {
        if(debugMode){console.log(fontData)}
        settings.scorm = false // add scorm (false) tag to the  settings
        exportData = activityEditor.addActivityTemplateData(activityTemplate, data, settings, files, prefsStore, fontData)
        dialog.showSaveDialog(dialogOptions).then(result => {
          if (result.canceled) {
            if(debugMode){console.log("Cancelled")}
            return
          }
          fs.writeFile(result.filePath, exportData, { encoding: 'utf8' }, (err) => {
            if (err) {
              if(debugMode){console.log(err)};
            } else {
              if(debugMode){console.log("File written successfully.")}
            }
          })
        })
      })
    });
  } else if (type == 'scorm') {

    var dialogOptions = {
      title: 'SCORM Package Identifier',
      detail: 'SCORM packages have a unique identifier to be distinguished by the LMS (Learning Management System, e.g. Moodle). \
      \nYou may wish to update this package later, in which case you should keep a copy of this identifier and paste it in the ID box before exporting again.\
      \nIf you export with a new identifier, the LMS will consider this a new package and learner information associated with this package may be lost.\
      \nYou should not reuse the same identifier for two packages on the same course, as the LMS will not be able to distinguish them.\
      \nThe package identifier is "' + packageIdentifier + '". If you prefer, you can cancel and input your own.',
      type: 'info',
      checkboxLabel: 'Do not remind me again',
      buttons: ['Proceed', 'Copy identifier to clipboard and proceed', 'Cancel'],
      defaultId: 1, // Copy selected by default
    }

    if (config.showScormInfo) { // if user has not said they don't want to see this anymore, we'll show the message with the above settings
      dialog.showMessageBox(dialogOptions).then(result => {

        if(debugMode){console.log(result.response)}
        if(debugMode){console.log(result.canceled)}

        if (result.response == 2) { // This should be result.cancelled, but that's not working for whatever reason
          if(debugMode){console.log("Cancelled")}
          return
        }

        if (result.checkboxChecked) {
          config.showScormInfo = false
          saveConfigFile()
        }

        // default action: copy the package id to the clipboard then continue
        if (result.response == 1) {
          clipboard.writeText(packageIdentifier)
        }

        if (result.response == 1 || result.response == 0) {
          exportActivityAsScorm(activity, source, data, settings, packageIdentifier)
        }

      })
    } else {
      exportActivityAsScorm(activity, source, data, settings, packageIdentifier)
    }

  }

  // if you are adding in a new way to export scorms, you probably want to do this through the regular exportActivity function (specifying type='scorm')
  function exportActivityAsScorm(activity, source, data, settings, files, packageIdentifier) {
    const zip = new AdmZip();
    var dialogOptions = {
      title: 'Export activity as SCORM',
      properties: ['createDirectory'],
      filters: [{
        name: 'ZIP file',
        extension: 'zip'
      }],
      defaultPath: 'New_' + activity.charAt(0).toUpperCase() + activity.slice(1) + '.zip' // when saving files added, can use saved name if given
    }

    let activityPath = findActivityPath(activity, source)

    activityEditor.openActivityTemplate(activityPath).then(activityTemplate => {
      activityEditor.openManifestTemplate().then(manifestTemplate => {
      activityEditor.openFonts(settings).then ( fontData => {
        if(debugMode){console.log(fontData)}
        settings.scorm = true // add scorm tag to the  settings
        exportData = activityEditor.addActivityTemplateData(activityTemplate, data, settings, files, prefsStore, fontData)

        dialog.showSaveDialog(dialogOptions).then(result => {
          if (result.canceled) {
            if(debugMode){console.log("Cancelled")}
            return
          }
          let activityDetails = {
            packageIdentifier: packageIdentifier,
            saveName: result.filePath.substring(result.filePath.lastIndexOf('/') + 1).split('.')[0], // strip off everything else from the path and the extension
            activity: activity
          }
          var manifestData = activityEditor.createManifestFile(manifestTemplate, activityDetails)
          try {
            zip.addFile(activity + '.html', Buffer.from(exportData, 'utf8'))
            zip.addFile('imsmanifest.xml', Buffer.from(manifestData, 'utf8'))
            zip.writeZip(result.filePath)
          } catch (e) {
            if(debugMode){console.log('Unable to create zip file: ' + e)}
          }
        })
      })
    })
    });
  }


};

const openTableDialog = () => {
  var dialogOptions = {
    title: 'Select file',
    properties: ['openFile'],
    filters: [      
      {
        name: 'hex',
        extensions: 'hex'
      },
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
      if(debugMode){console.log("Cancelled")}
      return
    }
    if(debugMode){console.log(result)}
    const fileExt = path.extname(result.filePaths[0])
    if (fileExt.toLowerCase() != '.hex' &&fileExt.toLowerCase() != '.json' && fileExt.toLowerCase() != '.txt') {
      if(debugMode){console.log("File extension: " + fileExt)}
      dialog.showErrorBox("Error opening file", "Invalid file extension. Please select a .hex or .json or .txt file.")
      return;
    }

    fs.stat(result.filePaths[0], (err, stats) => {
      if (err) {
        if(debugMode){console.log("An error ocurred reading the file:" + err.message)};
        dialog.showErrorBox("Error opening file", "The file statistics could not be read.")
        return;
      }
      if (stats.size > (1024 * 1024 * 1024)) { // slightly arbitarily putting the limit at 1 gigabyte, but this would be a huge table in any case
        if(debugMode){console.log("File is too big. " + stats.size + " bytes.")};
        dialog.showErrorBox("Error opening file", "This file is too large for hex to read efficiently. Please choose a file less than a megabyte in size or consider making a smaller activity.")
      } else {
        fs.readFile(result.filePaths[0], 'utf-8', (err, data) => {
          if (err) {
            if(debugMode){console.log("An error ocurred reading the file:" + err.message)};
            dialog.showErrorBox("Error opening file", "The file could not be read.")
            return;
          }

          if(debugMode){console.log(data)}

          const isJson = !(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(
            data.replace(/"(\\.|[^"\\])*"/g, ''))) && eval('(' + data + ')');
          if (isJson) {
            openTablePath = result.filePaths[0]
            openTable(data)
          } else {
            dialog.showErrorBox("Error opening file", "Invalid file format. Please used JSON format.")
            return;
          }

        });
      }
    })
  });
}

const openProfileDialog = () => {
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
      if(debugMode){console.log("Cancelled")}
      return
    }
    if(debugMode){console.log(result)}
    const fileExt = path.extname(result.filePaths[0])
    if (fileExt.toLowerCase() != '.json' && fileExt.toLowerCase() != '.txt') {
      if(debugMode){console.log("File extension: " + fileExt)}
      dialog.showErrorBox("Error opening file", "Invalid file extension. Please select a .txt or .json file.")
      return;
    }

    fs.stat(result.filePaths[0], (err, stats) => {
      if (err) {
        if(debugMode){console.log("An error ocurred reading the file:" + err.message)};
        dialog.showErrorBox("Error opening file", "The file statistics could not be read.")
        return;
      }
      if (stats.size > (1024 * 1024 * 1024)) { // slightly arbitarily putting the limit at a gigabyte, but this would be a huge table in any case
        if(debugMode){console.log("File is too big. " + stats.size + " bytes.")};
        dialog.showErrorBox("Error opening file", "This file is too large for hex to read efficiently. Please choose a file less than a megabyte in size or consider making a smaller activity.")
      } else {
        fs.readFile(result.filePaths[0], 'utf-8', (err, data) => {
          if (err) {
            if(debugMode){console.log("An error ocurred reading the file:" + err.message)};
            dialog.showErrorBox("Error opening file", "The file could not be read.")
            return;
          }

          if(debugMode){console.log(data)}

          const isJson = !(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(
            data.replace(/"(\\.|[^"\\])*"/g, ''))) && eval('(' + data + ')');
          if (isJson) {
            openProfilePath = result.filePaths[0]
            openProfile(data)
            openProfileEditor()
          } else {
            dialog.showErrorBox("Error opening file", "Invalid file format. Please used JSON format.")
            return;
          }

        });
      }
    })
  });
}

const saveTableDialog = (data) => {  

  var fileName = ''
  let defaultPath = openTablePath

  if (defaultPath == ''){
    if (profileStore.name != ''){
      fileName = profileStore.name.replaceAll(' ','_') + '_'
    } else {
      fileName = 'New_'
    }
    fileName += prefsStore.activity
    defaultPath = fileName + '.json' 
    // defaultPath = fileName + '.hext' // TO DO 
  }

  var dialogOptions = {
    title: 'Save table',
    properties: ['createDirectory'],
    filters: [
    //   {
    //   name: 'hex table file',
    //   extension: 'hext'
    // },
    {
      name: 'JSON file',
      extension: 'json'
    }],
    defaultPath: defaultPath
  }

    dialog.showSaveDialog(dialogOptions).then(result => {
      if (result.canceled) {
        if(debugMode){console.log("Cancelled")}
        return
      }
      initiateSaveTable(result.filePath)
    })

}

const saveProfileDialog = () => {  

    if(debugMode){console.log(profileStore)}
    let defaultPath = openProfilePath

    if (defaultPath == ''){
      defaultPath = profileStore.name + '.json' 
    }

    var dialogOptions = {
      title: 'Save profile',
      properties: ['createDirectory'],
      filters: [{
        name: 'JSON file',
        extension: 'json'
      }],
      defaultPath: defaultPath
    }

      dialog.showSaveDialog(dialogOptions).then(result => {
        if (result.canceled) {
          if(debugMode){console.log("Cancelled")}
          return
        }
        initiateSaveProfile(result.filePath)
      })

  }

function loadProfileInEditor(){
  profileStore.activities.forEach(activityProfile => {
    activitySettingControlsStore = {}
    readActivitySettings(activityProfile.activity, activityProfile.source).then(settingControls => {
      activitySettingControlsStore[activityProfile.source + '_' + activityProfile.activity] = settingControls
      if(debugMode){console.log(Object.keys(activitySettingControlsStore).length + ' setting controls found')}
      if(debugMode){console.log(profileStore.activities.length + ' activity settings in profile')}
      // when all the activity setting controls have been loaded, send the profile and the setting controls off to the profile editor
      if (Object.keys(activitySettingControlsStore).length == profileStore.activities.length) {
        windows.profileEditor.webContents.send('loadProfile', profileStore, activitySettingControlsStore)
      }
    })
  })

  if (profileStore.activities.length == 0){
    windows.profileEditor.webContents.send('loadProfile', profileStore, activitySettingControlsStore)
  }
}

function openTable(data){  
  try {     
    inputData = JSON.parse(data)
    if(inputData.hasOwnProperty('filesData')){
      importFileStore = inputData.filesData
      if(debugMode){console.log('Found files.')}
    } else {
      if(debugMode){console.log('Data contains no files.')}
    }
    windows.main.send('loadInput',inputData.input,importFileStore) // put the data in the table
    prefsWaiting = inputData.settings // remember the settings to load later
    windows.main.send('setActivity',inputData.activity,inputData.source) // select the relevant activity
  }
  catch (error) {
    dialog.showErrorBox("Error opening file","JSON data in file could not be parsed.")
    console.error(error)
    return
  }  
}

function openProfile(data){
  try {     
    profileStore = JSON.parse(data)
    lastSavedProfile = profileStore
  }
  catch (error) {
    dialog.showErrorBox("Error opening file","JSON data in profile could not be parsed.")
    console.alert(error)
    return
  }
  if(windows.profileEditor){
    loadProfileInEditor()
  }
}

function closeProfile(){
  profileStore = { name: '', activities: [] }
  lastSavedProfile = profileStore
  openProfilePath = ''
  activitySettingControlsStore = {}
  if(windows.profileEditor){
    windows.profileEditor.webContents.send('loadProfile',profileStore, activitySettingControlsStore)
  }
}

function requestCheckProfileChangesThen(action){
  //action is 'open' or 'close'
  if (windows.profileEditor){
    windows.profileEditor.webContents.send('toCheckProfileChangesThen',action)
  } else {
    checkProfileChangesThen(action)
  }
}

function checkProfileChangesThen(action){
  if (profileHasChanged()){
    dialog.showMessageBox({
      'type': 'question',
      'title': 'Confirm '+action,
      'message': 'Would you like to save changes first?',
      'buttons': ['Yes', 'No','Cancel'],
      'defaultId':0,
      'cancelId':2
    }).then(result => {
      if(debugMode){console.log(result)}
      try {
        if (result.response == 2) { return; } // Cancelled
        if (result.response == 0) { // Yes
          if (openProfilePath != ''){
            saveProfile(profileStore,openProfilePath) // profileStore will have been updated in the checking process)
          } else {
            saveProfileDialog()
          }
                  // we'll hold this action off to make sure the save has gone through
          profileActionWaiting = action
        } else if (result.response == 1){ // No - we can go ahead and do the actions straight away
          if (action == 'open'){
            openProfileDialog()
          } else if (action == 'close'){
            closeProfile()
          }
        } 
      } catch (err) {
        if(debugMode){console.log(err)}
      }

    })
  } else {
    if (action == 'open'){
      openProfileDialog()
    } else if (action == 'close') {
      closeProfile()
    }
  }
}

function profileHasChanged(){
  // first a couple of simple checks so we don't have to do too much work to see if there's a change
  if(profileStore.name != lastSavedProfile.name){
    return true // profile name has changed
  }
  if(profileStore.activities.length != lastSavedProfile.activities.length){
    return true // there are not the same number as activities in the profile as before
  }
  if(profileStore.activities.length > 0){
    if(lastSavedProfile.activities.length > 0){
      if(profileStore.activities[0].settings[Object.keys(profileStore.activities[0].settings)[0]] && lastSavedProfile.activities[0].settings[Object.keys(lastSavedProfile.activities[0].settings)[0]]){
        if(profileStore.activities[0].settings[Object.keys(profileStore.activities[0].settings)[0]] != lastSavedProfile.activities[0].settings[Object.keys(lastSavedProfile.activities[0].settings)[0]]){
          return true // first setting in the first activity has changed
        }
      }
    } else {
      return true // last saved profile had no activities, but current version does
    }
  } else {
    if(lastSavedProfile.activities.length > 0){
      return true // last saved version had activities, but current version doesn't
    }
  }

  // if that's not worked, we'll make a hash of each and compare those
  // if this were for a bigger file, we'd want to do this in chunks
  const lastSaved = crypto.createHash('md5').update(JSON.stringify(lastSavedProfile)).digest("hex")
  const currentProfile = crypto.createHash('md5').update(JSON.stringify(profileStore)).digest("hex")

  if(lastSaved == currentProfile){
    return false
  } else {
    return true
  }

}

function initiateSaveProfile(path=openProfilePath){

  // if there is no path, we need to show the dialog instead
  if(path == ''){
    saveProfileDialog()
    return
  }

  if (windows.profileEditor){
    if(debugMode){console.log('Getting latest version of profile')}
    windows.profileEditor.webContents.send('updateProfileToSave',path)   
  } else {
    saveProfile(profileStore,path)
  }

}

function initiateSaveTable(path=openTablePath){

  // if there is no path, we need to show the dialog instead
  if(path == ''){
    saveTableDialog()
    return
  }

  windows.main.webContents.send('getInputForSave',path)   

}

function saveProfile(profile,path){
  let data = JSON.stringify(profile)

  fs.writeFile(path, data, { encoding: 'utf8' }, (err) => {
    if (err) {
      if(debugMode){console.log(err)};
    } else {
      if(debugMode){console.log("File written successfully.")}
      lastSavedProfile = profileStore
      openProfilePath = path

      // we may be saving in anticipation of opening or closing the file, in which case this variable will have been set
      if (profileActionWaiting == 'open'){
        openProfileDialog()
      } else if (profileActionWaiting == 'close'){
        closeProfile()
      }
      profileActionWaiting = ''
    }
  })
}

function saveTable(inputData,path,fileData){
  
  // add extra info
  inputData.app_version = v
  inputData.platform = process.platform
  inputData.modificationTime = Date.now()
  inputData.filesData = fileData

  let data = JSON.stringify(inputData)

  if(!/.hex$|\.json$/.test(path)){
    path += '.hex'
  }

  fs.writeFile(path, data, { encoding: 'utf8' }, (err) => {
    if (err) {
      if(debugMode){console.log(err)};
    } else {
      if(debugMode){console.log("File written successfully.")}
      // lastSavedProfile = profileStore

      // we may be saving in anticipation of opening or closing the file, in which case this variable will have been set
    //   if (profileActionWaiting == 'open'){
    //     openProfileDialog()
    //   } else if (profileActionWaiting == 'close'){
    //     closeProfile()
    //   }
    //   profileActionWaiting = ''
    }
  })
}

function readPreferences(data) {
  let regex = /<!--\*HEX SETTINGS START\*([.\s\S]+)\*HEX SETTINGS END\*-->/gm
  var dataArea = data.match(regex)[0] // find the pref data with the flags
  var jsonData = dataArea.replace(regex, '$1').trim() // remove the flags and trim
  // if(debugMode){console.log(jsonData)}
  if (jsonData) {
    try {
      obj = JSON.parse(jsonData)
    } catch (e) {
      obj = { error: e } // pass on error if there is a json formatting issue
    }
  } else {
    obj = { error: 'Hex settings not found.' } // pass on error if we can't find the settings at all
  }
  return obj
}

function unrollTemplates(settings){
  let unrolledSettings = []
  settings.forEach(setting =>{
    let updatedSetting
    if(setting.hasOwnProperty('template')){
      let templateSetting = settings.find(s => s.name == setting.template)
      if (templateSetting){
        if(debugMode){console.log(`Copying template settings ${setting.template}`)}
        updatedSetting = Object.assign({}, templateSetting, setting)
      } else {
        if(debugMode){console.error(`Template setting not found: ${setting.template}`)}
        updatedSetting = setting
      }
    } else {
      updatedSetting = setting
    }
    unrolledSettings.push(updatedSetting)
  })
  return unrolledSettings
}

function activityFocused() {
  focusedWindow = BrowserWindow.getFocusedWindow()
  if (focusedWindow != windows.main) {
    return windows.activities.find(window => window.windowId === focusedWindow.id)
  } else {
    return null
  }
  // for(let i=0;i<windows.activities.length;i++){
  //   if(windows.activities.window.isFocused()){
  //     console.log(windows.activities[i].windowId + ' is focused')
  //     return windows.activities[i]
  //   } else {
  //     console.log(windows.activities[i].windowId + ' is not focused')
  //   }
  // }
  // return null;
}

let openConfigFile = function openConfigFilePromise(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf-8', (err, data) => {
      if (err) {
        if(debugMode){console.log("An error ocurred reading the config file:" + err.message)};
        reject("Error");
      }
      // console.log(data)
      // configFile = data.toString()
      resolve(data);
    });
  })
}

function getConfig() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(configFilePath)) { // look for config file
      if(debugMode){console.log('Config file path found: ' + configFilePath)}
    } else { // create the file if it doesn't exist
      fs.writeFile(configFilePath, JSON.stringify(defaultConfig), { encoding: 'utf8' }, (err) => {
        if (err) {
          if(debugMode){console.log(err)};
        } else {
          if(debugMode){console.log("Config file create successfully.")}
        }
      })
    }
    openConfigFile(configFilePath).then(configFile => {
      try {
        currentConfig = JSON.parse(configFile)
        // add in anything missing from the config
        if (!currentConfig.hasOwnProperty('userActivitiesDir')) {
          currentConfig.userActivitiesDir = defaultConfig.userActivitiesDir
        }
        if (!currentConfig.hasOwnProperty('showAdvancedExport')) {
          currentConfig.showAdvancedExport = defaultConfig.showAdvancedExport
        }
        if (!currentConfig.hasOwnProperty('showScormInfo')) {
          currentConfig.showScormInfo = defaultConfig.showScormInfo
        }
        resolve(currentConfig)
      } catch (e) {
        currentConfig = { error: e } // pass on error if there is a json formatting issue
        resolve(currentConfig)
      }
      if(debugMode){console.log(currentConfig)}
      // windows.main.webContents.send('setConfig', config); // not using this yet
    })
  });
}

function openProfileEditor(){
  if(windows['profileEditor']){
    windows.profileEditor.focus()
  } else {
    createProfileWindow()
  }
}

function openDocumentation(){
  if(windows['documentation']){
    windows.documentation.focus()
  } else {
    createDocumentationWindow()
  }
}


function addActivityProfile() {
  windows.main.webContents.send('getActivitySettingsForProfile')
}

function getTableDataForClipboard(form) {
  windows.main.webContents.send('copyToClipboard', form);
}

function askToClearTable() {
  windows.main.webContents.send('clearTable');
}

function askToDeleteUnusedRows() {
  windows.main.webContents.send('deleteUnusedRows');
}

function askToDeleteUnusedCols() {
  windows.main.webContents.send('deleteUnusedCols');
}

const aboutOptions = {
  credits: 'Confetti animation by Patrik Svensson.',
  website: 'https://github.com/mjhaxby/hex',
  iconPath: 'icon.png',
  authors: 'Morgan Haxby'
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
        label: 'Open table and settings…',
        role: 'open', 
        accelerator: process.platform === 'darwin' ? 'Cmd+O' : 'Ctrl+O',
        click: () => { openTableDialog() }
      },
      // TO DO!
      // {
      //   label: 'Save table and settings',
      //   role: 'save',
      //   accelerator: process.platform === 'darwin' ? 'Cmd+S' : 'Ctrl+S',
      //   click: () => { initiateSaveTable() }
      // },
      {
        label: 'Save table and settings as…',
        role: 'save',
        accelerator: process.platform === 'darwin' ? 'Cmd+S' : 'Ctrl+S',
        click: () => { saveTableDialog() }
      },
      // {
      //   label: 'Close table file',
      //   click: () => { requestCheckTableChangesThen('close') }
      // },
      {
        label: 'Import table…',        
        click: () => { importTableDialog() }
      },
      { type: 'separator' },
      {
        label: 'Export activity',
        accelerator: process.platform === 'darwin' ? 'Cmd+Shift+S' : 'Ctrl+Shift+S',
        click: () => { if (activityFocused() == null) { getReadyToExport() } else (exportFromActivity()) } // TO DO: if activity window has focus, get data from that (make an array of objects that contains each window and its data?)
      },
      { type: 'separator' },
      {
        label: 'Open profile…',
        click: () => { requestCheckProfileChangesThen('open') },
        accelerator: 'Alt+O'
      },
      {
        label: 'Save profile',
        click: () => { initiateSaveProfile() },
        accelerator: 'Alt+S'
      },
      {
        label: 'Save profile as…',
        click: () => { saveProfileDialog() },
        accelerator: 'Alt+Shift+S'
      },
      {
        label: 'Close profile',
        click: () => { requestCheckProfileChangesThen('close') }
      },
      { type: 'separator' },
      {
        label: 'Select user activities folder…',
        click: () => { openUserActivitiesDirDialog() }
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
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
      {
        id: 'showAdvancedExport',
        label: 'Advanced export options',
        type: 'checkbox',
        checked: false,
        click: () => { toggleAdvancedExportOptions() }
      }
    ]
  },
  {
    label: 'Tools',
    id: 'tools',
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
      },
      {
        label: 'Empty table',
        accelerator: process.platform === 'darwin' ? 'Cmd+Shift+Delete' : 'Ctrl+Shift+Delete',
        click: () => { askToClearTable() }
      },
      {
        label: 'Delete unused rows from end',
        click: () => { askToDeleteUnusedRows() }
      },
      {
        label: 'Delete unused columns from end',
        click: () => { askToDeleteUnusedCols() }
      },
      { type: 'separator' },
      {
        label: 'Set current activity settings as default',
        click: () => { windows.main.webContents.send('requestActivitySettingDefaults') }
      },
      {
        label: 'Reset current activity settings to factory',
        click: () => { resetCurrentActivitySettingDefaults() }
      },
      { type: 'separator' },
      {
        label: 'Open profile editor',
        click: () => { openProfileEditor() }
      },
      {
        label: 'Add/Update current activity to profile',
        click: () => { addActivityProfile() }
      },
      { type: 'separator' },
      {
        label: 'Reset message before SCORM export',
        click: () => { config.showScormInfo = true; saveConfigFile(); }
      },
      {
        label: 'Hot Potatoes importer',
        click: () => { config.showScormInfo = true; tools.openHotPotatoesDialog(); }
      },
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
        // { role: 'toggleTabBar'},
        // { role: 'selectNextTab'},
        // { role: 'selectPreviousTab'},
        // { role: 'mergeAllWindows'},
        // { role: 'moveTabToNewWindow'},
        { type: 'separator' },
        // { role: 'window' },
        { role: 'close' }
      ] : [
        { role: 'close' }
      ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Report an issue',
        click: () => {
          const { shell } = require('electron')
          shell.openExternal('https://github.com/mjhaxby/hex/issues')
        }
      },
      {
        label: 'Open documentation',
        click: () => { openDocumentation() }
      },
      {
        label: 'Learn More',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://github.com/mjhaxby/hex')
        }
      }
    ]
  }
])
