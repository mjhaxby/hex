// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog, shell, clipboard } = require('electron')
const contextMenu = require('electron-context-menu');
const fs = require('fs')
const path = require('path')
const request = require('electron-request')
const activityEditor = require('./activityEditor.js')
const octokit = require('@octokit/request')
const AdmZip = require('adm-zip');

const isMac = process.platform === 'darwin'
var prefsStore // for checking security later
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

async function checkForUpdate(){
  const v = app.getVersion().replace(' ', '');
  const appName = app.getName() // during dev, this will return electron instead of hex
  const releaseInfo = await octokit.request('GET /repos/mjhaxby/hex/releases/latest', {
    owner: 'MJHAXBY',
    repo: 'HEX'
  })
  // console.log(releaseInfo)
  var latestV = releaseInfo.data.tag_name.replace('v', '');
  if(latestV!=v && appName!='Electron'){ // don't ask this in dev testing
    console.log('Update found\nCurrent version: '+v+'\nNew version: '+latestV)
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

        dialog.showMessageBox(null, options) // change null to mainWindow?
        .then((response) =>{
          console.log('User response to update')
          console.log(response)
          if(response.response === 0){
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

var mainWindow

var activityWindows = [] // stores activity windows and later their data
// var blockBustersWindow

const configFilePath = app.getPath('userData') + '/hex_config.json'
const defaultConfig = {userActivitiesDir: app.getPath('documents') + '/Hex/', showAdvancedExport:false, showScormInfo: true}
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
      nodeIntegration: false,
      contextIsolation: true,
      devTools: !app.isPackaged,
      sandbox: app.isPackaged
    }
  }  )
  process.env.MAIN_WINDOW_ID = mainWindow.id;

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

const createActivityWindow = (activityType, data, settings, source) => {

  // window options
  const windowOpts = {
    title: activityType,
    show: false, // hidden at first so that the position can be determined
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload_activity.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: !app.isPackaged,
      sandbox: app.isPackaged
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
  newWindow.data = data
  newWindow.settings = settings
  newWindow.source = source
  newWindow.window = new BrowserWindow(windowOpts)

  let thisWin = newWindow
  newWindow.window.once('ready-to-show', () => {
      thisWin.window.show()
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
      if (config.showAdvancedExport){
        applicationMenu.getMenuItemById('showAdvancedExport').checked = true
        // mainWindow.webContents.send('showAdvancedExport')
        console.log('marking menu item as true')
      }
      mainWindow.webContents.send('configStore',config)
      // if we're debugging, add the dev tools
      if (!app.isPackaged){
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
        'buttons': ['Yes','No']      
      }).then(result => {
        console.log(result)
        try{ 
          if (result.response != 0) { return; }
          if (result.response == 0) {
            shell.openExternal(navigationUrl);
        }
        } catch (err){
          console.log(err)
        }

      })    
    }
  })
})

// probably don't actually want this, but leaving it for now
const dockMenu = Menu.buildFromTemplate([
  {
    label: 'New Window',
    click () { createMainWindow() }
  }
  //{ label: 'New Command...' } // add coma before
])

function findSettingAnomolies(settings){

  // first check that we're supposed to have some settings. We'll report this straight away if we do but we're not supposed to, in order to not have a bunch of uncaught errors.
  if(!prefsStore.hasOwnProperty('settings')){
    if (Object.keys(settings).length == 0){
      return [];
    } else {
    return [{error: 'number', expectedNum: 0, actualNum: Object.keys(settings).length}]
    }
  }

  var actualNumSettings = Object.keys(settings).length
  var expectedNumSettings = prefsStore.settings.length

  var currentSetting
  var currentSettingVarType
  var currentExpectedVarType
  var errors = []

  if (actualNumSettings != expectedNumSettings){
    errors.push({error: 'number', expectedNum: expectedNumSettings, actualNum: actualNumSettings})
  }

  prefsStore.settings.forEach(setting => {
    currentSetting = settings[setting.name]
    currentSettingVarType = typeof currentSetting

    if(setting.type == 'select' || setting.type == 'text' || setting.type == 'code'){      
      currentExpectedVarType = 'string'      
    } else if (setting.type == 'number') {
      currentExpectedVarType = 'number'
    } else if (setting.type == 'checkbox'){
      currentExpectedVarType = 'boolean'
    } else {
      currentExpectedVarType = 'unknown'
    }

    // console.log(currentSetting + ' is ' + setting.type + ' and evaluated as ' + currentExpectedVarType)

    if (currentSetting == null){
      errors.push({name: setting.name, error:'missing'})
    } else if(currentSettingVarType != currentExpectedVarType){
      errors.push({name: setting.name,error:'type',expectedType:currentExpectedVarType,actualType:currentSettingVarType})
    }
  })  
  
  return errors

}

function reportSettingErrors(errors){
  var errorString = 'The activity could not be run because the following anomolies in the activity settings were detected:'
  errors.forEach(error => {
    if(error.error == 'number'){
      errorString += '\n' + error.expectedNum + ' settings were expected, but there are ' + error.actualNum + '.'
    } else if (error.error == 'missing'){
      errorString += '\nThe "' + error.name + '" setting is missing.'
    } else if (error.error == 'type'){
      errorString += '\nSetting "' + error.name + '" should be a ' + error.expectedType + ' but a ' + error.actualType + ' was supplied.'
    }
  })
  console.log(settingErrors)
  dialog.showErrorBox('Error running activity',errorString)
}

function isArrayofStrings(variable) {
  if (!Array.isArray(variable)) {
    return false; // Not an array
    console.log('Not an array!')
  }

  return variable.every((item) => typeof item === 'string');
}

ipcMain.on("requestConfig",function (event) {
  mainWindow.webContents.send('configStore',config)
})

function isArrayofArrayofStrings(variable) {
  if (!Array.isArray(variable)) {
    return false; // Not an array
    console.log('Not an array of arrays!')
  }

  return variable.every((item) => isArrayofStrings(item));
}

function verifiyActivityAndSource(activity,source){
  if (source == 'prebuilt'){
    if (prebuiltActivitiesList.includes(activity)){
      return true
    } else {
      return false
      console.error('Activity name not found on the prebuilt activities list')
    }
  } else if (source == 'user'){
    if (userActivitiesList.includes(activity)){
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

function validateSender (frame) {
  // Parses the URL of the sender and check that it is local
  url = new URL(frame.url)
  if (url.protocol === 'file:') return true
  return false
}


//ipcMain.on will receive the "runActivity"" info from renderprocess
ipcMain.on("runActivity",function (event, data, settings, activity,source) {
  if (!validateSender(event.senderFrame)) {
    dialog.showErrorBox('Security error!','A renderer sent a signal from a non-local source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
    return null
  }
  console.log('Running activity')
    // console.log(event)
    // console.log(data)
    console.log(activity)
    console.log(settings)
    validateSender(event.senderFrame)
    /// TO DO: Sanatise the input. Check that data is a 2D array, that activity is a string, that settings matches what we expect and that source is one of the possible options
    settingErrors = findSettingAnomolies(settings)
    dataOK = isArrayofArrayofStrings(data)
    activityOK = verifiyActivityAndSource(activity, source)
    if (settingErrors.length == 0 && dataOK && activityOK){
      createActivityWindow(activity,data,settings,source)
    } else if (settingErrors.length > 0) {
      reportSettingErrors(settingErrors)      
    } else if (!dataOK){
      dialog.showErrorBox('Invalid data','Data in the table is invalid. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
    } else if (!activityOK){
      dialog.showErrorBox('Error finding activity','There was an error with the activity name or activity source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
    }
});

// packageIdentifier: string
// type: html scorm

ipcMain.on("exportActivity",function (event) {
  console.log(event)
  getReadyToExport('html')
})


ipcMain.on('sentInputForExport',function (event, data){
  if (!validateSender(event.senderFrame)) {
    dialog.showErrorBox('Security error!','A renderer sent a signal from a non-local source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
    return null
  }
  settingErrors = findSettingAnomolies(data.settings)
  dataOK = isArrayofArrayofStrings(data.input)
  activityOK = verifiyActivityAndSource(data.activity, data.source)
  typeOK = (data.type == 'html' || data.type == 'scorm')
  packageIdOK = (typeof data.packageIdentifier == 'string')
  settingErrors = findSettingAnomolies(data.settings)
  if (settingErrors.length == 0 && dataOK && activityOK){
    exportActivity(data.input, data.activity, data.settings, data.source, data.type, data.packageIdentifier)
  } else if (settingErrors.length > 0) {
    reportSettingErrors(settingErrors)      
  } else if (!dataOK){
    dialog.showErrorBox('Invalid data','Data in the table is invalid. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
  } else if (!activityOK){
    dialog.showErrorBox('Error finding activity','There was an error with the activity name or activity source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
  } else if (!typeOK){
    dialog.showErrorBox('Error in export type','There was an error in establishing the export type.  This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
  } else if (!packageIdOK){
    dialog.showErrorBox('Error in package identifier','There was an error in the SCORM pacakage identifier.  This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
  }
})

ipcMain.on('readActivityPrefs', function (event, activity, source){
  if (!validateSender(event.senderFrame)) {
    dialog.showErrorBox('Security error!','A renderer sent a signal from a non-local source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
    return null
  }
  activityOK = verifiyActivityAndSource(activity, source)

  if (activityOK){
    let activityPath = findActivityPath(activity, source)
    activityEditor.openActivityTemplate(activityPath).then(activityTemplate => {
      prefsStore = readPreferences(activityTemplate)
      console.log(prefsStore)
      mainWindow.webContents.send('setPrefs', prefsStore);
    })
  } else {
    dialog.showErrorBox('Error reading activity preferences','There was an error with the activity name or activity source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
  }
})

ipcMain.on('getPrebuiltActivities', function (event){
  if (!validateSender(event.senderFrame)) {
    dialog.showErrorBox('Security error!','A renderer sent a signal from a non-local source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
    return null
  }
  fs.readdir(path.resolve(__dirname,'Activities/'), (err, files) => {
    var activities = []
    files.forEach(file =>{
      if (file.match(/\.html$/)){
        activities.push(file.replace(/\.html$/,''))
      }
    })
    prebuiltActivitiesList = activities
    mainWindow.webContents.send('loadPrebuiltActivities', activities);
  })
})

ipcMain.on('getUserActivities', function (event){
  if (!validateSender(event.senderFrame)) {
    dialog.showErrorBox('Security error!','A renderer sent a signal from a non-local source. This error should only occur if there is a bug in the application or a security risk. Please contact the developer.')
    return null
  }
  if (fs.existsSync(config.userActivitiesDir)){
    fs.readdir(config.userActivitiesDir, (err, files) => {
      var activities = []
      if (files != null && files.length > 0){
        files.forEach(file =>{
          if (file.match(/\.html$/)){
            activities.push(file.replace(/\.html$/,''))
          }
        })
        userActivitiesList = activities
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
        name: 'json',
        extensions: 'json'
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
    const fileExt = path.extname(result.filePaths[0])
    if (fileExt.toLowerCase() != '.json' && fileExt.toLowerCase() != '.txt'){
      console.log("File extension: "+fileExt)
      dialog.showErrorBox("Error opening file", "Invalid file extension. Please select a .txt or .json file.")
      return;
    }

    fs.stat(result.filePaths[0], (err, stats) => {
      if(err){
        console.log("An error ocurred reading the file:" + err.message);
        dialog.showErrorBox("Error opening file", "The file statistics could not be read.")
        return;
      }
      if(stats.size > (1024*1024)){ // slightly arbitarily putting the limit at a megabyte, but this would be a huge table in any case
        console.log("File is too big. " + stats.size + " bytes.");
        dialog.showErrorBox("Error opening file", "This file is too large for hex to read efficiently. Please choose a file less than a megabyte in size or consider making a smaller activity.")
      } else {
        fs.readFile(result.filePaths[0], 'utf-8', (err, data) => {
          if(err){
            console.log("An error ocurred reading the file:" + err.message);
            dialog.showErrorBox("Error opening file", "The file could not be read.")
            return;
          }      
    
          const regexJson = /\[?\["([^"]*(?:"[^"]*)*)"(?:,\s*)*\]\]?/;
          const regexTab = /\t/
          const isJson = regexJson.test(data.trim())
          const isTabbed = regexTab.test(data.trim())
          if (isJson || isTabbed){
            mainWindow.webContents.send('loadInput', data);
          } else {
            console.log("Analysed as JSON: "+isJson)
            console.log("Tabs detected: "+isTabbed)
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

const toggleAdvancedExportOptions = () => {
  if (Menu.getApplicationMenu().getMenuItemById('showAdvancedExport').checked){
    config.showAdvancedExport = true
    console.log('Show advanced export options is on')    
  } else {
    config.showAdvancedExport = false
    console.log('Show advanced export options is off')
  }
  mainWindow.webContents.send('configStore',config)
  saveConfigFile();
}

const saveConfigFile = () => {
  fs.writeFile(configFilePath, JSON.stringify(config), {encoding: 'utf8'}, (err) => {
    if (err){
      console.log(err);
    } else {
      console.log("Config file updated successfully.")
      console.log(config)
    }
  })
}

const getReadyToExport = (type) => {
  mainWindow.webContents.send('getInputForExport'); // will put the data in the data holder and store activity type  
}

const exportFromActivity = () => {
  activityWindow = activityFocused()
  exportActivity(activityWindow.data,activityWindow.activityType,activityWindow.settings,activityWindow.source,'html','') // TO DO: possible to export scorm from window
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

const exportActivity = (data,activity,settings,source,type='html',packageIdentifier='') => {
  var activityTemplate
  var exportData

  if (type == 'html'){
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
      settings.scorm = false // add scorm (false) tag to the  settings
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
    });
  } else if (type == 'scorm'){

    var dialogOptions = {
      title: 'SCORM Package Identifier',
      detail: 'SCORM packages have a unique identifier to be distinguished by the LMS (Learning Management System, e.g. Moodle). \
      \nYou may wish to update this package later, in which case you should keep a copy of this identifier and paste it in the ID box before exporting again.\
      \nIf you export with a new identifier, the LMS will consider this a new package and learner information associated with this package may be lost.\
      \nYou should not reuse the same identifier for two packages on the same course, as the LMS will not be able to distinguish them.\
      \nThe package identifier is "' + packageIdentifier + '". If you prefer, you can cancel and input your own.',
      type: 'info',
      checkboxLabel: 'Do not remind me again',
      buttons: ['Proceed','Copy identifier to clipboard and proceed','Cancel'],
      defaultId: 1, // Copy selected by default
    }
    
    if (config.showScormInfo){ // if user has not said they don't want to see this anymore, we'll show the message with the above settings
      dialog.showMessageBox(dialogOptions).then(result => {

        console.log(result.response)
        console.log(result.canceled)

        if (result.response == 2){ // This should be result.cancelled, but that's not working for whatever reason
          console.log("Cancelled")
          return
        }
  
        if (result.checkboxChecked){
          config.showScormInfo = false
          saveConfigFile()
        }
        
        // default action: copy the package id to the clipboard then continue
        if (result.response == 1){
          clipboard.writeText(packageIdentifier)
        }

        if (result.response == 1 || result.response == 0){
          exportActivityAsScorm(activity, source, data, settings, packageIdentifier)
        }
        
      })
    } else {
      exportActivityAsScorm(activity, source, data, settings, packageIdentifier)
    }
    
  }

// if you are adding in a new way to export scorms, you probably want to do this through the regular exportActivity function (specifying type='scorm')
function exportActivityAsScorm(activity, source, data, settings, packageIdentifier){
  const zip = new AdmZip();
  var dialogOptions = {
    title: 'Export activity as SCORM',
    properties: ['createDirectory'],
    filters: [{
      name: 'ZIP file',
      extension: 'zip'
    }],
    defaultPath: 'New_'+activity.charAt(0).toUpperCase()+activity.slice(1)+'.zip' // when saving files added, can use saved name if given
  }

  let activityPath = findActivityPath(activity, source)

  activityEditor.openActivityTemplate(activityPath).then(activityTemplate => {
    activityEditor.openManifestTemplate().then(manifestTemplate => {
      settings.scorm = true // add scorm tag to the  settings
      var exportData = activityEditor.addActivityTemplateData(activityTemplate, data, settings)        
      dialog.showSaveDialog(dialogOptions).then(result =>{
        if (result.canceled){
          console.log("Cancelled")
          return
        }
        let activityDetails = {
          packageIdentifier: packageIdentifier,
          saveName: result.filePath.substring(result.filePath.lastIndexOf('/')+1).split('.')[0], // strip off everything else from the path and the extension
          activity: activity
        }          
        var manifestData = activityEditor.createManifestFile(manifestTemplate, activityDetails)
        try {            
          zip.addFile(activity+'.html', Buffer.from(exportData,'utf8'))
          zip.addFile('imsmanifest.xml', Buffer.from(manifestData,'utf8'))
          zip.writeZip(result.filePath)
        } catch (e){
          console.log('Unable to create zip file: ' + e)
        }
      })
    })     
  });
}
  

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
  return new Promise((resolve, reject) => {
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
          currentConfig = JSON.parse(configFile)
          // add in anything missing from the config
          if(!currentConfig.hasOwnProperty('userActivitiesDir')){
            currentConfig.userActivitiesDir = defaultConfig.userActivitiesDir
          }
          if(!currentConfig.hasOwnProperty('showAdvancedExport')){
            currentConfig.showAdvancedExport = defaultConfig.showAdvancedExport
          }
          if(!currentConfig.hasOwnProperty('showScormInfo')){
            currentConfig.showScormInfo = defaultConfig.showScormInfo
          }
          resolve(currentConfig)
        } catch(e) {
          currentConfig = {error: e} // pass on error if there is a json formatting issue
          resolve(currentConfig)
        }
        console.log(currentConfig)
        // mainWindow.webContents.send('setConfig', config); // not using this yet
      })
}); 
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

function askToClearTable(){
  mainWindow.webContents.send('clearTable');
}

function askToDeleteUnusedRows(){
  mainWindow.webContents.send('deleteUnusedRows');
}

function askToDeleteUnusedCols(){
  mainWindow.webContents.send('deleteUnusedCols');
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
      {
        label: 'Reset message before SCORM export',
        click: () => { config.showScormInfo = true; saveConfigFile(); }
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
        label: 'Report an issue',
        click: () => { 
          const { shell } = require('electron')
          shell.openExternal('https://github.com/mjhaxby/hex/issues')
        }
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
