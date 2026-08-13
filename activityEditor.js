const fs = require('fs')
const path = require('path')
const async = require('async')
const markdownUtils = require('./markdown-utils.js')

let openActivityTemplate = function openTemplatePromise(file){
  return new Promise((resolve, reject)=>{
    fs.readFile(file, 'utf-8', (err, data) => {
      if(err){
        console.log("An error ocurred reading the file:" + err.message);
        reject("Error");
      }
      // console.log(data)
      template = data.toString()
      resolve(template);
    });
  })

}

let openFonts = function openFontsPromise(settings){
  let fontSettings = extractFontSettings(settings)
  console.log(fontSettings)
  let fontData = []
  return new Promise((resolve, reject)=>{
    if (fontSettings.length == 0){
      resolve([])
    }
    async.eachSeries(
      fontSettings,
      function(font, cb){
        fs.readFile(path.resolve(__dirname, font.src), function(err, data) {
          if(!err){
            fontData.push({name: font.name, data: data.toString('base64'), var: font.var, format: font.format})
          }
          cb(err)
        })
      },
      function(err){
        if(err){
          reject('Error')
        }
        resolve(fontData)
      }
      )
    })
  }

function addActivityTemplateData(activityTemplate, activityData, activitySettings, activityFiles, prefsStore, fontData){

  let fontSettings = extractFontSettings(activitySettings,websafe=true) // get all font information, including websafe

  if (prefsStore.hasOwnProperty('markdown_support') && prefsStore.markdown_support){
    //  TO DO: && if user has enabled this
    withMarkdown = markdownUtils.applyMarkdown(activityData,activitySettings,prefsStore.settings,true)
    activityData = withMarkdown.data
    activitySettings = withMarkdown.settings
  }

// I'm not sure why I had the following, since JSON will already escape " characters
//   for (i = 0; i < activityData.length; i++){
//     for (j = 0; j < activityData[i].length; j++){
//       // escape "
//       if(typeof activityData[i][j] == 'string'){
//         activityData[i][j] = activityData[i][j].replaceAll(/([^\\])"/g,'$1\\"') // replace all " with \" unless there is already a \ (already escaped)
//       } else {
//         activityData[i][j].text = activityData[i][j].text.replaceAll(/([^\\])"/g,'$1\\"') // replace all " with \" unless there is already a \ (already escaped)
//       }
      
//     }
// }

  let activityDataAsArray = 'gameData = ' + JSON.stringify(activityData).replaceAll(/\\\\\\",\\"/g) // some " are double escaped, so we need to remove one of the \s
  // possibly remove the .replaceAll above… it might not be necessary
  let activitySettingsAsObject = 'gameSettings = ' + JSON.stringify(activitySettings)
  let activityFilesAsObject = 'gameFiles = ' + JSON.stringify(activityFiles)
  let exportInfo = {version: prefsStore.app_version, creationTime: Date.now(), platform: prefsStore.platform, activity: prefsStore.activity, source: prefsStore.source}
  // outputData = activityTemplate
  let activityDataIntegration = '<script  charset="utf-8">' + activityDataAsArray + ';\n' + activitySettingsAsObject + ';\n' + activityFilesAsObject + ';\nif(gameFiles.gameData){ for(let row = 0; row < gameData.length; row++){ for (let col = 0; col < gameData[row].length; col++){ if(typeof gameData[row][col] == \'object\' && gameData[row][col].hasOwnProperty(\'image\')){ gameData[row][col].image = gameFiles.gameData[parseInt(gameData[row][col].image)]; }; }; }; };' + '\ndocument.addEventListener("DOMContentLoaded",pageLoad())</script>'  

  if (fontSettings.length > 0){
    // add font information
    activityDataIntegration += '<style>:root{'
    fontSettings.forEach(font =>{
      activityDataIntegration += `--${font.var}: ${font.name}; `
    })
    activityDataIntegration += '}'
    // add data for non-websafe fonts
    if (fontData.length > 0){
      fontData.forEach(font =>{
        activityDataIntegration += `@font-face{font-family:"${font.name}";src:url(data:font/${font.format};base64,${font.data})} `
      })
    }
    activityDataIntegration += '</style>'
  }

  outputData = activityTemplate.replace('<script src="activityController.js"></script>','<!--*HEX DATA START*-->\n'+activityDataIntegration+'\n<!--*HEX DATA END*-->')
  let regex = /<!--\*HEX SETTINGS START\*([.\s\S]+)\*HEX SETTINGS END\*-->/gm // replace hex settings…
  outputData = outputData.replace(regex,`<!--*HEX INFO START*${JSON.stringify(exportInfo)}*HEX INFO END*-->`) // …with hex info

  // replace dependent content based on settings
  // (this allows us to reduce the size of the output file by removing content that is not needed based on the settings)
  prefsStore.settings.forEach(setting=>{
    if (setting.hasOwnProperty('dependentContent') && setting.dependentContent){
      let name = setting.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // escape special characters in the setting name for use in the regex
      let value = activitySettings[setting.name].toString().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // escape special characters in the setting value for use in the regex
      // to do: allow activity templates to specify regexValues
      let regexInclude = new RegExp(`(<!--|\/\/)\\*HEX DEPENDENT START NAME=${name} VALUE=${value}\\s*\\*[.\\s\\S]+\\*HEX DEPENDENT END NAME=${name}\\*(-->)?`,'gm') // matches the dependent content where the setting value matches
      let regexExclude = new RegExp(`(<!--|\/\/)\\*HEX DEPENDENT START NAME=${name}[.\\s\\S]+\\*HEX DEPENDENT END NAME=${name}\\s*\\*(-->)?`,'gm') // matches all dependent content for this setting, regardless of value

      console.log('regexInclude',regexInclude)
      console.log('regexExclude',regexExclude)

      let dependentContent = outputData.match(regexInclude)
      
        // temporarily remove dependent data
        let outputDataTemporary = outputData.split(regexInclude)
        outputDataTemporary.forEach((part, index) => {
          if (typeof part !== 'string') return
          part = part.replace(regexExclude, '')
          outputDataTemporary[index] = part + ((dependentContent && index < dependentContent.length) ? dependentContent[0] : '')
        })
      
    }
  })

  return outputData
}

// Example dependent content:
//  <!--*HEX DEPENDENT START NAME=exampleSetting VALUE=exampleValue*-->
// Here is your dependent content!
// <!--*HEX DEPENDENT END NAME=exampleSetting*-->
// (This also works as a JS comment, but don't forget the asterisks!)


let openManifestTemplate = function openManifestTemplatePromise(){
  return new Promise((resolve, reject)=>{
    file = path.resolve(__dirname,'manifest_template.xml')
    fs.readFile(file, 'utf-8', (err, data) => {
      if(err){
        console.log("An error ocurred reading the file:" + err.message);
        reject("Error");
      }
      template = data.toString()
      resolve(template);
    });
  })
}

function createManifestFile(manifestTemplate, activityDetails){
  var outputData = manifestTemplate
  console.log(activityDetails)
  let ref = activityDetails.saveName.replace(' ','_')+'_'+activityDetails.activity.replaceAll(' ','_')
  outputData = outputData.replaceAll('$PACKAGE_IDENTIFIER',activityDetails.packageIdentifier)
  outputData = outputData.replaceAll('$COURSE',activityDetails.saveName)
  outputData = outputData.replaceAll('$ITEM_IDENTIFIER',ref)
  outputData = outputData.replaceAll('$REF',ref+'_html')
  outputData = outputData.replaceAll('$ACTIVITY',activityDetails.activity)
  outputData = outputData.replaceAll('$TITLE',activityDetails.saveName.replaceAll('_',' '))
  return outputData
}

function extractFontSettings(settings,websafe=false){
  let fontSettings = []
  for (const name in settings){
      if(settings[name].hasOwnProperty('isFont') && (websafe || settings[name].src != 'websafe')){
          fontSettings.push(settings[name])
      }
  }
  return fontSettings
}

module.exports = {
  openActivityTemplate,
  addActivityTemplateData,
  openManifestTemplate,
  openFonts,
  createManifestFile,
  applyMarkdown: markdownUtils.applyMarkdown,
  convertHTMLToMarkdown: markdownUtils.convertHTMLToMarkdown
};
