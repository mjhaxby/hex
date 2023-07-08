const fs = require('fs')
const path = require('path')

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

function addActivityTemplateData(activityTemplate, activityData, activitySettings){
  for (i = 0; i < activityData.length; i++){
    for (j = 0; j < activityData[i].length; j++){
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
  outputData = activityTemplate
  outputData = activityTemplate.replace('<script src="activityController.js"></script>','<script  charset="utf-8">gameData = ' + activityDataAsArray + '\n' + activitySettingsAsObject + '\ndocument.addEventListener("DOMContentLoaded",pageLoad())</script>')
  //TO DO: Add SCORM setting when appropriate
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

module.exports = {
  openActivityTemplate,
  addActivityTemplateData,
  openManifestTemplate,
  createManifestFile
};
