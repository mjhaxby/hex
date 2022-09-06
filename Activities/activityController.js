const { ipcRenderer } = require('electron');

var gameData;
var filename = window.location.pathname.substring(window.location.pathname.lastIndexOf('/')+1);
var activityname = filename.match(/.*(?=\.)/)[0]


ipcRenderer.on('loadActivity', (event, msg) => {
  console.log(msg)
  gameData = msg
  pageLoad()
})

function sendReadySignal(activity){
  ipcRenderer.send('activityReady','I am ready'); // e.g. blockbustersReady
}

document.addEventListener('DOMContentLoaded',sendReadySignal(activityname))
