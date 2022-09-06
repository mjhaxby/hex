const { ipcRenderer } = require('electron');
// The ipcRenderer module provides a few methods so you can send events from the render process (web page) to the main process.

// These are used for Electron:
const runActivity = document.getElementById('runBtn');
const exportActivity = document.getElementById('exportBtn');

// PAGE FUNCTIONS

function pageLoad(){
  //Allow us to type tabs in the text area field
  document.getElementById('inputBox').addEventListener('keydown', function(e) {
    if (e.key == 'Tab') {
      e.preventDefault();
      var start = this.selectionStart;
      var end = this.selectionEnd;

      // set textarea value to: text before caret + tab + text after caret
      this.value = this.value.substring(0, start) +
        "\t" + this.value.substring(end);

      // put caret at right position again
      this.selectionStart =
        this.selectionEnd = start + 1;
    }
  });
}

function inputToArray(textBlock){
  var data = [];
  let textBlockSplit = textBlock.split(/\r?\n/);
  for (i=0;i<textBlockSplit.length;i++){
    data.push(textBlockSplit[i].split(/\t/))
  }
  return data
}

function run() {
  var data = [];
  let textBlock = document.getElementById('inputBox').value;
  var activity = document.getElementById('activitySlct').value
  data = inputToArray(textBlock)

   //send the info to main process
  ipcRenderer.send('runActivity', data, activity); // ipcRender.send will pass the information to main process
}

function exporter(){
    ipcRenderer.send('exportActivity'); // since export can be called from elsewhere, we won't bother sending the data from here
}

function preview(){
  activityTypeSelector = document.getElementById('activitySlct')
  previewArea = document.getElementById('previewArea')
  previewTitle = document.getElementById('previewTitle')
  activityType = activityTypeSelector.value
  let textBlock = document.getElementById('inputBox').value;
  data = inputToArray(textBlock)
  if (checkValidity(data,activityType)){
    if (activityType == 'blockbusters' || activityType == 'match'){
      previewArea.innerHTML = '<table><tr><th>Prompt</th><th>&nbsp;<th>Answer</th></tr><tr><td>'+data[0][0]+'</td><td id="swapBtn" onclick="swapData()">↔︎</td><td>'+data[0][1]+'</td></table>'
            previewTitle.style.visibility = 'visible'
      previewArea.style.visibility = 'visible'
    } else if (activityType == 'crack_the_code') {
      if (data[0][0] != null){
        preview1 = data[0][0]
        preview2 = data[0][1]
      } else {
        preview1 = data[0]
        preview2 = '(No clue)'
      }
      previewArea.innerHTML = '<table><tr><th>Encode</th><th>&nbsp;<th>Clue</th></tr><tr><td>'+preview1+'</td><td id="swapBtn" onclick="swapData()">↔︎</td><td>'+preview2+'</td></table>'
      previewTitle.style.visibility = 'visible'
      previewArea.style.visibility = 'visible'
    } else if (activityType == 'backs_to_the_board'){
      previewArea.innerHTML = '<table><tr><th>Word/Phrase</th></tr><tr><td>'+data[0]+'</td></table>'
            previewTitle.style.visibility = 'visible'
      previewArea.style.visibility = 'visible'
    }
  } else {
    previewArea.innerHTML = ''
    previewTitle.style = null
    previewArea.style = null
  }
}

// later there should be an object for each activity type which dictates the rules of that activity's input
function checkValidity(data, type){ // later this could return an object that explains where the problem is too
  if(type == 'blockbusters'){
    if (data.length >= 22){ // if there are at least 22 items (will later return true)
      for (i=0; i<data.length; i++){
        if(data[i].length != 2){ // if there are not exactly two items (will return false)
          return false
        }
      }
      return true // if so far false has not return, it should be good
    }
  } else if (type == 'match'){
    if (data.length >= 1){ // if there is at least 1 item
      for (i=0; i<data.length; i++){
        if(data[i].length != 2){ // if there are not exactly two items
          return false
        }
      }
      return true // if so far false has not return, it should be good
    }
  } else if (type == 'crack_the_code'){
    if (data.length >= 1){ // if there is at least 1 item
      for (i=0; i<data.length; i++){
        if(data[i].length > 2){ // if there are more than two items
          return false
        }
      }
      return true // if so far false has not return, it should be good
    }
  }else if (type == 'backs_to_the_board'){
    if (data.length >= 1){ // if there is at least 1 item
      for (i=0; i<data.length; i++){
        if(data[i].length != 1){ // if there is not exactly 1 item
          return false
        }
      }
      return true // if so far false has not return, it should be good
    }
  }
  return false // if no conditions to return true have been satisfied
}

function swapData(){ // at the moment just for an array containing arrays of two, but should later develop this for more types
  let textBlock = document.getElementById('inputBox').value;
  data = inputToArray(textBlock)
  backToTextArray = []
  for (i=0; i<data.length; i++){
    backToTextArray.push(data[i][1] + '\t' + data[i][0])
  }
  backToText = backToTextArray.join('\n')
  document.getElementById('inputBox').value = backToText
  preview()
}


// Electron stuff:

ipcRenderer.on('loadInput', (event, msg) => {
  document.getElementById('inputBox').innerHTML = msg // fill in input box when opening a file
})

ipcRenderer.on('getInputForExport', (event) => { // main.js requests the data
  var data = new Object();
  data = {input: [], activity: document.getElementById('activitySlct').value} // later add options

  let textBlock = document.getElementById('inputBox').value;
  data.input = inputToArray(textBlock)
  console.log(data)
  ipcRenderer.send("sentInputForExport",data)
})
