const { ipcRenderer } = require('electron');

var gameData;
var gameSettings;
var filename = window.location.pathname.substring(window.location.pathname.lastIndexOf('/')+1);
var activityname = filename.match(/.*(?=\.)/)[0]


ipcRenderer.on('loadActivity', (event, data, settings) => {
  console.log(data)
  console.log(settings)
  gameData = data
  gameSettings = settings
  pageLoad()
})

function sendReadySignal(activity){
  ipcRenderer.send('activityReady','I am ready'); // e.g. blockbustersReady
}

document.addEventListener('DOMContentLoaded',sendReadySignal(activityname))
