// exporter.js

const { dialog, clipboard  } = require('electron')
const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip');
const info = require('./info.js')

const activityEditor = require('./activityEditor.js')

const debugMode = info.debugMode

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

    let activityPath = activityEditor.findActivityPath(activity, source)

    activityEditor.openActivityTemplate(activityPath).then(activityTemplate => {
      activityEditor.openFonts(settings).then ( fontData => {
        if(debugMode){console.log(fontData)}
        settings.scorm = false // add scorm (false) tag to the  settings
        exportData = activityEditor.addActivityTemplateData(activityTemplate, data, settings, files, windows.main.prefsStore, fontData)
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
  const exportActivityAsScorm = (activity, source, data, settings, files, packageIdentifier) => {
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
        exportData = activityEditor.addActivityTemplateData(activityTemplate, data, settings, files, windows.main.prefsStore, fontData)

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
  activity: exportActivity
}