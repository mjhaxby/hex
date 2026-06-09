const activityEditor = require('./activityEditor.js')
const info = require('./info.js')

const debugMode = info.debugMode 

function importExportedActivity(string){

    const hexInfo = extractActivityInfo(string)
    let activityData = null

    if(!hexInfo){
        console.log('Malformed activity file or activty file from old version. Attempting to parse anyway.')
        activityData = extractActivityDataFromOldVersion(string)
        if (activityData == null){
            console.log('Failed to parse activity data from old version. Please check the file format.')
            return null    
        }    
    } else {
        activityData = extractActivityData(string)
        if (activityData == null){
            console.log('Failed to parse activity data. Trying a different way.')
            activityData = extractActivityDataFromOldVersion(string)            
            if (activityData == null){
                console.log('Failed to parse activity data. Please check the file format.')
                return null    
            } else {
                // If we found hex info and activity data, we stand a good chance of finding activity settings too
                activityData.gameSettings = extractSettingsDataFromOldVersion(string)
            }
        }
    }

    // Restore markdown from HTML
    activityData.gameData.forEach(r => {
        r.forEach(c=>{
            if (c && c.hasOwnProperty('text')) {
                c.text = activityEditor.convertHTMLToMarkdown(c.text)
            } else if (c){
                c = activityEditor.convertHTMLToMarkdown(c)
            }
        })
    })
    
    if(activityData.gameSettings && activityData.gameSettings.hasOwnProperty('scorm')){
        // If the activity has SCORM settings, we need to remove them
        delete activityData.gameSettings.scorm
        if(debugMode){
            console.log('Removing SCORM setting.')
        }
    }

    return {
        gameData: activityData.gameData,
        gameSettings: activityData.gameSettings || {},
        gameFiles: activityData.gameFiles || {},
        info: hexInfo
    }

}

function extractActivityInfo(string){
    const hexInfoRex = /<!--\*HEX INFO START\*({.+})\*HEX INFO END\*-->/
    let hexInfoString = string.match(hexInfoRex)[1]
    let hexInfo = null
    if (hexInfoString != null) {
        hexInfo = JSON.parse(hexInfoString)
    }
    return hexInfo
}

function extractActivityData(string){
    let data = {}
    let settings = {}
    let files = {}

    const dataAreaRegex = /\<!--\*HEX DATA START\*--\>\n\<script\s+charset="utf-8"\>\s*(gameData\s*=\s*\[[\s\S]+\];?\ngameSettings[\s\S]+)\<!--\*HEX DATA END\*--\>/m
    const dataAreaMatch = string.match(dataAreaRegex)
    const dataAreaString = dataAreaMatch ? dataAreaMatch[1].replace('<script  charset="utf-8">', '').replace('</script>', '').trim() : null // removing the script tags so we can detect line starts reliably

    if (dataAreaString == null) {
        console.log('Malformed activity file. Please check the file format.')
        return null
    }

    const dataRegex = /^gameData\s*=\s*(\[.+\]);?/m
    const settingsRegex = /^gameSettings\s*=\s*(\{.+\});?/m
    const filesRegex = /^gameFiles\s*=\s*(\{.+\});?/m

    let dataMatch = dataAreaString.match(dataRegex)
    let settingsMatch = dataAreaString.match(settingsRegex)
    let filesMatch = dataAreaString.match(filesRegex)
    let dataString = dataMatch ? dataMatch[1] : null
    let settingsString = settingsMatch ? settingsMatch[1] : {}
    let filesString = filesMatch ? filesMatch[1] : {}

    try {
        data = JSON.parse(dataString)
    } catch (error) {
        console.error('Error parsing JSON for gameData:', error)
        if(debugMode){
            console.log('Data string:', dataString)
        }
        return null
    }

    try {
        settings = JSON.parse(settingsString)
    } catch (error) {
        console.error('Error parsing JSON for gameSettings:', error)
        // No need to return null here, we'll just use the default settings
    }

    try {
        files = JSON.parse(filesString)
    } catch (error) {
        console.error('Error parsing JSON for gameFiles:', error)
        // No need to return null here, we just won't have the files
    }

    return {
        gameData: data,
        gameSettings: settings,
        gameFiles: files
    }
}

function extractActivityDataFromOldVersion(string){
    const regex = /\<script\s+charset="utf-8"\>gameData = \[(.+)\];?\n/
    const dataMatch = string.match(regex)
    const dataString = dataMatch ? `[${dataMatch[1]}]` : null
    if (dataString == null) {
        console.log('Malformed activity file. Please check the file format.')
        return null
    }
    try {
        const data = JSON.parse(dataString)
        return {
            gameData: data,
            gameSettings: {},
            gameFiles: {}
        }
    } catch (error) {
        console.error('Error parsing JSON:', error)
        // if(debugMode){
        console.log(debugMode)
            console.log('Data string:', dataString)
        // }
        return null
    }
}

function extractSettingsDataFromOldVersion(string){
    const regex = /gameSettings = \{(.+)\};?\n/
    const settingsMatch = string.match(regex)
    const settingsString = settingsMatch ? `{${settingsMatch[1]}}` : null
    if (settingsString == null) {
        console.log('Malformed activity file. Please check the file format.')
        return null
    }
    try {
        return JSON.parse(settingsString)
    } catch (error) {
        console.error('Error parsing JSON:', error)
        // if(debugMode){
        console.log(debugMode)
            console.log('Settings string:', settingsString)
        // }
        return null
    }
}

module.exports = {
    importExportedActivity
}