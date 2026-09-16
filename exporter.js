// exporter.js

const { dialog, clipboard  } = require('electron')
const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip');
const info = require('./info.js')

const activityEditor = require('./activityEditor.js')

const debugMode = info.debugMode

function writeFile(filePath, data){
fs.writeFile(filePath, data, { encoding: 'utf8' }, (err) => {
            if (err) {
              if(debugMode){console.log(err)};
            } else {
              if(debugMode){console.log("File written successfully.")}
            }
          })
}

const readPreferences = (data) => {
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

const exportActivity = (options = {data: [[]], activity: '', settings: {}, files: [], source: 'prebuilt', type: 'html', packageIdentifier: '', path: '', prefsStore: {}}) => {
  options = {
    data: [[]],
    activity: '',
    settings: {},
    files: [],
    source: 'prebuilt',
    type: 'html',
    packageIdentifier: '',
    path: '',
    prefsStore: {},
    ...options
  }  
  const {data, activity, settings, files, source, type, packageIdentifier, path} = options
  var prefsStore = options.prefsStore || {}
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

    let activityPath = activityEditor.findActivityPath(activity, source)

    activityEditor.openActivityTemplate(activityPath).then(activityTemplate => {
      // if no prefsStore was passed, we'll need to read it now (this is the case when bulk exporting)
      if (Object.keys(prefsStore).length === 0) {
        prefsStore = readPreferences(activityTemplate)
      }
      activityEditor.openFonts(settings).then ( fontData => {
        if(debugMode){console.log(fontData)}
        settings.scorm = false // add scorm (false) tag to the  settings
        
        exportData = activityEditor.addActivityTemplateData(activityTemplate, data, settings, files, prefsStore, fontData)
        if (path.length > 0){
          writeFile(path, exportData)
        } else {
          dialog.showSaveDialog(dialogOptions).then(result => {
          if (result.canceled) {
            if(debugMode){console.log("Cancelled")}
            return
          }
          writeFile(result.filePath, exportData)
        })
        }
        
      }).catch(err => {
        console.error("Error opening fonts:", err);
      });
    })
    .catch(err => {
      console.error("Error opening activity template:", err);
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
          exportActivityAsScorm({activity: activity, source: source, data: data, settings: settings, files: files, packageIdentifier: packageIdentifier, prefsStore: prefsStore})
        }

      })
    } else {
      exportActivityAsScorm({activity: activity, source: source, data: data, settings: settings, files: files, packageIdentifier: packageIdentifier, prefsStore: prefsStore})
    }

  }



  // if you are adding in a new way to export scorms, you probably want to do this through the regular exportActivity function (specifying type='scorm'), and so you don't need to export this function
  const exportActivityAsScorm = (options = {activity: '', source: 'prebuilt', data: [[]], settings: {}, files: [], packageIdentifier: '', prefsStore: {}}) => {
    options = {
      activity: '',
      source: 'prebuilt',
      data: [[]],
      settings: {},
      files: [],
      packageIdentifier: '',
      prefsStore: {},
      ...options
    }    
    const {activity, source, data, settings, files, packageIdentifier, prefsStore} = options  

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

    let activityPath = activityEditor.findActivityPath(activity, source)

    activityEditor.openActivityTemplate(activityPath).then(activityTemplate => {
      activityEditor.openManifestTemplate().then(manifestTemplate => {
      activityEditor.openFonts(settings).then ( fontData => {
        if(debugMode){console.log(fontData)}
        settings.scorm = true // add scorm tag to the  settings
        exportData = activityEditor.addActivityTemplateData(activityTemplate, data, settings, files, prefsStore, fontData)
        if(debugMode){console.log(exportData)}
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

module.exports = {
  activity: exportActivity,
  readPreferences: readPreferences
}