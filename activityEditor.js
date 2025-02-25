const fs = require('fs')
const path = require('path')
const showdown  = require('showdown')  
const async = require('async')
showdown.setOption('strikethrough',true)  

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
    withMarkdown = applyMarkdown(activityData,activitySettings, prefsStore.settings)  
    activityData = withMarkdown.data
    activitySettings = withMarkdown.settings
  }

  for (i = 0; i < activityData.length; i++){
    for (j = 0; j < activityData[i].length; j++){
      // escape "
      if(typeof activityData[i][j] == 'string'){
        activityData[i][j] = activityData[i][j].replaceAll('"','\\"')
      } else {
        activityData[i][j].text = activityData[i][j].text.replaceAll('"','\\"')
      }
      
    }
}
  let activityDataAsArray = JSON.stringify(activityData)
  let activitySettingsAsObject = 'gameSettings = ' + JSON.stringify(activitySettings)
  let activityFilesAsObject = 'gameFiles = ' + JSON.stringify(activityFiles)
  let exportInfo = {version: prefsStore.app_version, creationTime: Date.now(), platform: prefsStore.platform, activity: prefsStore.activity, source: prefsStore.source}
  // outputData = activityTemplate
  let activityDataIntegration = '<script  charset="utf-8">gameData = ' + activityDataAsArray + ';\n' + activitySettingsAsObject + ';\n' + activityFilesAsObject + ';\nif(gameFiles.gameData){ for(let row = 0; row < gameData.length; row++){ for (let col = 0; col < gameData.length; col++){ if(typeof gameData[row][col] == \'object\' && gameData[row][col].hasOwnProperty(\'image\')){ gameData[row][col].image = gameFiles.gameData[parseInt(gameData[row][col].image)]; }; }; }; };' + '\ndocument.addEventListener("DOMContentLoaded",pageLoad())</script>'  

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

  outputData = activityTemplate.replace('<script src="activityController.js"></script>',activityDataIntegration)
  let regex = /<!--\*HEX SETTINGS START\*([.\s\S]+)\*HEX SETTINGS END\*-->/gm
  outputData = outputData.replace(regex,`<!--*HEX INFO START*${JSON.stringify(exportInfo)}*HEX INFO END*-->`)
  return outputData
}

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

// convert markdown to HTML for activities that support this
function applyMarkdown(activityData,activitySettings, settingsInfo){
  console.log('applying markdown')
  // let converter = new showdown.Converter()    
  for (i = 0; i < activityData.length; i++){
    for (j = 0; j < activityData[i].length; j++){   
      let cell
      let type = 'text'
      if(typeof activityData[i][j] == 'string'){
        cell = activityData[i][j]
      } else {
        cell = activityData[i][j].text
        type = 'object'
      }

      // TO REMOVE
      // cell = cell.replaceAll('\\\\n','\\<span></span>n') // protect \\n (this seems over the top, but it doesn't work another way). We're using <span></span> because any < and > will have already been removed anyway
      // // apply markdown, but remove <p> tags which should never be necessary. Replace \n with <br>
      // cell = cell.replaceAll('<span></span>','') // remove this just in case anyway
      // cell = converter.makeHtml(cell)
      // cell = cell.replaceAll(/<\/?p>/g,'').replaceAll(/(^|[^\\])(\\n)/g,'$1<br>').replaceAll(/(^|[^\\])(\\n)/g,'$1<br>') // replace \n twice in a row because otherwise some can get orphanned      

      cell = convertMarkdownToHTMLWithLineBreaks(cell)

      if (type == 'object'){
        activityData[i][j].text = cell
      } else {
        activityData[i][j] = cell
      }
    }
  }
  // data.forEach(line =>{
  //   line.forEach(cell =>{
  //     cell = converter.makeHtml(cell)
  //   })
  // })
  settingsInfo.forEach(setting =>{
    if(setting.type == 'text'){
      // apply markdown, but remove <p> tags which should never be necessary
      // activitySettings[setting.name] = converter.makeHtml(activitySettings[setting.name]).replaceAll(/<\/?p>/g,'')
      activitySettings[setting.name] = convertMarkdownToHTMLWithLineBreaks(activitySettings[setting.name])
    }
  })
  console.log(activityData)
  console.log(activitySettings)  
  return {data: activityData, settings: activitySettings}
}

function convertMarkdownToHTMLWithLineBreaks(string){
  let converter = new showdown.Converter()  
  let result = string.replaceAll('\\\\n','\\<span></span>n') // protect \\n (this seems over the top, but it doesn't work another way). We're using <span></span> because any < and > will have already been removed anyway
      // apply markdown, but remove <p> tags which should never be necessary. Replace \n with <br>
    result = result.replaceAll('<span></span>','') // remove this just in case anyway
    result = converter.makeHtml(result)
    result = result.replaceAll(/<\/?p>/g,'').replaceAll(/(^|[^\\])(\\n)/g,'$1<br>').replaceAll(/(^|[^\\])(\\n)/g,'$1<br>') // replace \n twice in a row because otherwise some can get orphanned 
    return result
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
  applyMarkdown
};
