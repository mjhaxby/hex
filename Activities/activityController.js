// The ipcRenderer module provides a few methods so you can send events from the render process (web page) to the main process.
// It is now enabled in the preload.js file.

var gameData;
var gameSettings;
var filename = window.location.pathname.substring(window.location.pathname.lastIndexOf('/')+1);
var activityname = filename.match(/.*(?=\.)/)[0]

ipcRenderer.on('loadActivity', (event, data, settings, importedFiles) => {
  console.log(data)
  console.log(settings)
  console.log(importedFiles)
  gameData = data
  gameSettings = settings
  gameFiles = importedFiles
  if(gameFiles.gameData){
    console.log('Linking game files to game data')
    for(let row = 0; row < gameData.length; row++){
      for (let col = 0; col < gameData.length; col++){        
        if(typeof gameData[row][col] == 'object' && gameData[row][col].hasOwnProperty('image')){
          gameData[row][col].image = gameFiles.gameData[parseInt(gameData[row][col].image)]
        }
      }
    }
  }
  let fontSettings = extractFontSettings(settings)
  if (fontSettings){
    fontSettings.forEach(font =>{
      if(font.src != 'websafe'){
        let newStyle = document.createElement('style')
        newStyle.appendChild(document.createTextNode("\
        @font-face {\
            font-family: " + font.name + ";\
            src: url('../" + font.src + "');\
        }\
        "));
        document.head.appendChild(newStyle);
      }
      const root = document.documentElement;
      root.style.setProperty('--'+font.var,font.name)
    })    
  }
  pageLoad()
})

function extractFontSettings(settings){
  let fontSettings = []
  for (const name in settings){
      if(settings[name].hasOwnProperty('isFont')){
          fontSettings.push(settings[name])
      }
  }
  if (fontSettings.length > 0){
      return fontSettings
  } else {
      return null
  }    
}

function sendReadySignal(activity){
  ipcRenderer.send('activityReady','I am ready'); // e.g. blockbustersReady
}

document.addEventListener('DOMContentLoaded',sendReadySignal(activityname))
