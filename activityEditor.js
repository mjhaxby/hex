const fs = require('fs')
const path = require('path')
const showdown  = require('showdown')  
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

function addActivityTemplateData(activityTemplate, activityData, activitySettings, prefsStore){

  if (prefsStore.hasOwnProperty('markdown_support') && prefsStore.markdown_support){
    //  TO DO: && if user has enabled this
    withMarkdown = applyMarkdown(activityData,activitySettings, prefsStore.settings)  
    activityData = withMarkdown.data
    activitySettings = withMarkdown.settings
  }

  for (i = 0; i < activityData.length; i++){
    for (j = 0; j < activityData[i].length; j++){
      // escape "
      activityData[i][j] = activityData[i][j].replaceAll('"','\\"')
    }
}

  activityDataAsArray = '['
  for(i=0;i<activityData.length;i++){
    activityDataAsArray = activityDataAsArray + '["' + activityData[i].join('","') + '"],'
  }
  activityDataAsArray = activityDataAsArray.slice(0, -1) // remove last comma
  activityDataAsArray = activityDataAsArray + ']' // add final square bracket
  activitySettingsAsObject = 'gameSettings = ' + JSON.stringify(activitySettings)
  exportInfo = {version: prefsStore.app_version, creationTime: Date.now(), platform: prefsStore.platform, activity: prefsStore.activity, source: prefsStore.source}
  // outputData = activityTemplate
  outputData = activityTemplate.replace('<script src="activityController.js"></script>','<script  charset="utf-8">gameData = ' + activityDataAsArray + '\n' + activitySettingsAsObject + '\ndocument.addEventListener("DOMContentLoaded",pageLoad())</script>')
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
  let converter = new showdown.Converter()    
  for (i = 0; i < activityData.length; i++){
    for (j = 0; j < activityData[i].length; j++){      
      activityData[i][j] = activityData[i][j].replaceAll('\\\\n','\\<span></span>n') // protect \\n (this seems over the top, but it doesn't work another way). We're using <span></span> because any < and > will have already been removed anyway
      // apply markdown, but remove <p> tags which should never be necessary. Replace \n with <br>
      activityData[i][j] = converter.makeHtml(activityData[i][j]).replaceAll(/<\/?p>/g,'').replaceAll(/(?:^|[^\\])(\\n)/g,'<br>')
      activityData[i][j] = activityData[i][j].replaceAll('<span></span>','') // remove this just in case anyway
      
      //.replaceAll(/\\\\n/g,'\\!n')
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
      activitySettings[setting.name] = converter.makeHtml(activitySettings[setting.name]).replaceAll(/<\/?p>/g,'')
    }
  })
  console.log(activityData)
  console.log(activitySettings)  
  return {data: activityData, settings: activitySettings}
}

module.exports = {
  openActivityTemplate,
  addActivityTemplateData,
  openManifestTemplate,
  createManifestFile,
  applyMarkdown
};
