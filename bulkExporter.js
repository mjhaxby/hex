const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog, shell, clipboard, remote } = require('electron')
const fs = require('fs')
const path = require('path')
const tools = require('./tools.js')
const importer = require('./importer.js')
const exporter = require('./exporter.js')
const info = require('./info.js')

const debugMode = info.debugMode

var filesIn = []
var profilesOut = []

function openFiles(webContents) {
    var dialogOptions = {
        title: "Select files to import",
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'All Files', extensions: ['hext','json','html'] }
        ]
    };

    dialog.showOpenDialog(dialogOptions).then(result => {
        if (result.canceled) {
            return
        }
        if(debugMode){
            console.log("Files selected for bulk import: ", result.filePaths)
        }
        result.filePaths.forEach(filePath => {
            if(debugMode){
                console.log(`Processing file: ${filePath}`)
            }
            var ext = path.extname(filePath).toLowerCase().replace('.', '')
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading file ${filePath}:`, err)
                    return
                }
                var hexData = null
                if (ext == "html") {
                    hexData = importer.importExportedActivity(data)
                    hexData.activity = hexData.info.activity
                } else {
                    try {
                        const jsonData = JSON.parse(data)
                        if (!jsonData.hasOwnProperty('input') || !jsonData.hasOwnProperty('settings') || !jsonData.hasOwnProperty('activity')) {
                            console.error(`Invalid JSON structure in file ${filePath}. Expected keys: 'input', 'settings', 'activity'. Found keys: ${Object.keys(jsonData).join(', ')}`)
                            console.log(`JSON data: ${JSON.stringify(jsonData)}`)
                            throw new Error(`Invalid JSON structure in file ${filePath}. Expected keys: 'input', 'settings', 'activity'. Found keys: ${Object.keys(jsonData).join(', ')}`)
                        }
                        hexData = {
                            gameData: jsonData.input,
                            gameSettings: jsonData.settings,
                            gameFiles: jsonData.filesData || {},
                            activity: jsonData.activity
                        }
                    }
                    catch (error) {
                        console.error(`Error parsing JSON from file ${filePath}:`, error)
                        // show error
                        dialog.showErrorBox("Error", `Error parsing JSON from file ${filePath}: ${error.message}`)
                        return
                    }
                }
                filesIn.push({ path: filePath, name: path.basename(filePath), data: hexData })
                // Send the updated filesIn array to the renderer process
                webContents.send('updateFilesIn', filesIn)
            })
        })
    });
}

function removeFiles(selectedFiles, webContents) {
    selectedFiles.forEach(file => {
        filesIn = filesIn.filter(f => f.path !== file.path)
    })
    // Send the updated filesIn array to the renderer process
    webContents.send('updateFilesIn', filesIn)
}

function removeProfiles(selectedProfiles, webContents) {
    selectedProfiles.forEach(profile => {
        profilesOut = profilesOut.filter(p => p.path !== profile.path)
    })
    // Send the updated profilesOut array to the renderer process
    webContents.send('updateProfilesOut', profilesOut)
}

function addProfile(profile = {name: '', path: '', data: {activity: '', source: 'prebuilt', settings: {}}}, webContents) {
    profilesOut.push(profile)
    console.log(`Added profile for activity: ${profile.data.activity}, source: ${profile.data.source}`)
    if(debugMode){
        console.log("Current profilesOut array: ", profilesOut)
    }
    // Send the updated profilesOut array to the renderer process
    webContents.send('updateProfilesOut', profilesOut)
}



function openProfileFromFile(webContents) {
    var dialogOptions = {
        title: "Select a profile file to import",
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Profile Files', extensions: ['hexp', 'hext', 'html'] }
        ]
    };
    dialog.showOpenDialog(dialogOptions).then(result => {
        if (result.canceled) {
            return
        }
        if(debugMode){
            console.log("Profiles selected for bulk import: ", result.filePaths)
        }
        result.filePaths.forEach(filePath => {
            var ext = path.extname(filePath).toLowerCase().replace('.', '')
                            if (debugMode){
                    console.log(`Importing profile from file: ${filePath} with extension: ${ext}`);
                }
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading file ${filePath}:`, err);
                    return;
                }
                let hexData;

                if (ext === "html") {
                    hexData = importer.importExportedActivity(data);
                    hexData.activity = hexData.info.activity;
                    hexData.source = hexData.info.source || 'prebuilt';                    
                    // save memory by removing the gameData and gameFiles from the profile, since we don't need them for exporting
                    delete hexData.gameData
                    delete hexData.gameFiles
                    delete hexData.info
                } else if (ext === "hext") {
                    try {
                        const jsonData = JSON.parse(data);
                        if (!jsonData.hasOwnProperty('input') || !jsonData.hasOwnProperty('settings') || !jsonData.hasOwnProperty('activity')) {
                            console.error(`Invalid JSON structure in file ${filePath}. Expected keys: 'input', 'settings', 'activity'. Found keys: ${Object.keys(jsonData).join(', ')}`);
                            console.log(`JSON data: ${JSON.stringify(jsonData)}`);
                            throw new Error(`Invalid JSON structure in file ${filePath}. Expected keys: 'input', 'settings', 'activity'. Found keys: ${Object.keys(jsonData).join(', ')}`);
                        }
                        hexData = {                            
                            gameSettings: jsonData.settings,                            
                            activity: jsonData.activity,
                            source: jsonData.source || "prebuilt"
                        };
                    }
                    catch (error) {
                        console.error(`Error parsing JSON from file ${filePath}:`, error);
                        // show error
                        dialog.showErrorBox("Error", `Error parsing JSON from file ${filePath}: ${error.message}`);
                        return;
                    }
                } else if (ext === "hexp") {
                    // to do, establish a way to import .hexp files, which are profile files that contain only the settings and activity name, without the input data
                    // a hexp can contain multiple profiles for different activities, so each will need to be added (and we'll probably display the names of the activity type in the renderer?)
                }
                addProfile({name: path.basename(filePath), path: filePath, data: hexData}, webContents);
            });
        })
    });
}

function exportBulk(selectedFiles, selectedProfiles, option="html", webContents) {
    const files = filesIn.filter(file => selectedFiles.includes(file.path))
    const profiles = profilesOut.filter(profile => selectedProfiles.includes(profile.path))

    if(debugMode){
        console.log(`Exporting bulk data with options: ${JSON.stringify({files, profiles, option})}`)
    }

    const dialogOptions = {
        title: "Select a folder to export the bulk data",
        properties: ['openDirectory', 'createDirectory']
    };

    dialog.showOpenDialog(dialogOptions).then(result => {
        if (result.canceled) {
            return
        }
        const exportPath = result.filePaths[0]
        if(debugMode){
            console.log("Exporting bulk data to: ", exportPath)
        }
        files.forEach(file => {
            const ext = option === "scorm" ? ".zip" : `.${option}`            
            // to do: if no profiles, just re-export the file as is (thereby updating it)
            profiles.forEach(profile => {
                const fileName = file.name.replace(/\.[^/.]+$/, "") + '_' + profile.name.replace(/\.[^/.]+$/, "") + ext
                const filePath = path.join(exportPath, fileName)
                // to do, check validity of profile for the activity type, and if not valid, skip it and show a warning
                // will need to deal with mismatches between object and string
                if(debugMode){
                    console.log(`Exporting profile: ${profile.name}`)
                }
                exporter.activity({data: file.data.gameData, activity: profile.data.activity, settings: profile.data.gameSettings, files: file.data.gameFiles, source: profile.data.source, type: option, packageIdentifier: '', path: filePath})
            })
        })
    })
}

module.exports = {
	openFiles,
	removeFiles,
	addProfile,
	openProfileFromFile,
	removeProfiles,
	export: exportBulk
}

