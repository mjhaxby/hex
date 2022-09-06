const fs = require('fs')

let openActivityTemplate = function openTemplatePromise(file){
  return new Promise((resolve, reject)=>{
    fs.readFile(file, 'utf-8', (err, data) => {
      if(err){
        console.log("An error ocurred reading the file:" + err.message);
        reject("Error");
      }
      console.log(data)
      template = data.toString()
      resolve(template);
    });
  })

}

function addActivityTemplateData(activityTemplate, activityData){
  activityDataAsArray = '['
  for(i=0;i<activityData.length;i++){
    activityDataAsArray = activityDataAsArray + '["' + activityData[i].join('","') + '"],'
  }
  activityDataAsArray = activityDataAsArray.slice(0, -1) // remove last comma
  activityDataAsArray = activityDataAsArray + ']' // add final square bracket
  outputData = activityTemplate
  outputData = activityTemplate.replace('<script src="activityController.js"></script>','<script  charset="utf-8">gameData = ' + activityDataAsArray + '\ndocument.addEventListener("DOMContentLoaded",pageLoad())</script>')
  return outputData
}

module.exports = {
  openActivityTemplate,
  addActivityTemplateData
};
