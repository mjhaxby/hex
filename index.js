const { ipcRenderer } = require('electron');
// The ipcRenderer module provides a few methods so you can send events from the render process (web page) to the main process.

// These are used for Electron (I think – not actually sure what for anymore):
const runActivity = document.getElementById('runBtn');
const exportActivity = document.getElementById('exportBtn');

//GLOBAL VARS

var settingsVisible = false
var prefsStore = {cols_min: 1, rows_min: 1}

// PAGE FUNCTIONS

function pageLoad(){
  //Allow us to type tabs in the text area field
  // document.getElementById('inputBox').addEventListener('keydown', function(e) {
  //   if (e.key == 'Tab') {
  //     e.preventDefault();
  //     var start = this.selectionStart;
  //     var end = this.selectionEnd;
  //
  //     // set textarea value to: text before caret + tab + text after caret
  //     this.value = this.value.substring(0, start) +
  //       "\t" + this.value.substring(end);
  //
  //     // put caret at right position again
  //     this.selectionStart =
  //       this.selectionEnd = start + 1;
  //   }
  // });
  headerRow(numCols) // add the header row with controls
  addRow(1) // add the first data row
  loadActivities()
}

function run() {
  validity = checkValidity()
  if (validity.valid){
    var data = [];
    // let textBlock = convertTableDataToBlock();
    const selector = document.getElementById('activitySlct')
    var activity = selector.value
    var source = selector.options[selector.selectedIndex].getAttribute('data-source')
    data = convertTableToTrimmedArray()
    settings = getSettings(prefsStore.settings)

     //send the info to main process
    ipcRenderer.send('runActivity', data, settings, activity, source); // ipcRender.send will pass the information to main process
  } else {
    displayValidityInfo(validity)
  }
}

function exporter(){
  validity = checkValidity()
  if (validity.valid){
    ipcRenderer.send('exportActivity'); // since export can be called from elsewhere, we won't bother sending the data from here
  } else {
    displayValidityInfo(validity)
  }
}

function selectActivity(){
  clearUnusedRowsFromEnd()
  clearUnusedColsFromEnd()
  loadPrefs()
}

function loadPrefs(){
  const selector = document.getElementById('activitySlct')
  var activity = selector.value
  var source = selector.options[selector.selectedIndex].getAttribute('data-source')
  if (source == 'user'){
    document.getElementById('runBtn').disabled = true
  } else {
    document.getElementById('runBtn').disabled = false
  }
  ipcRenderer.send('readActivityPrefs', activity, source)
}

function loadActivities(){
  document.getElementById('activitySlct').innerHTML = '' // remove activities if already added
  ipcRenderer.send('getPrebuiltActivities') // request prebuilt activities from main
  // user activities requested when prebuilt activities are received
}

function setPrefs(prefs){
  // save prefs
  prefsStore = prefs

  // set table size etc first
  //replace header column (what's a bit stupid is that we add it when the page first loads and then replace it - there may be a better way)
  tableBody = document.getElementById('tableBody')
  tableBody.removeChild(tableBody.children[0])
  headerRow(numCols)

  //set up settings area
  settingsArea = document.getElementById("settingsArea")
  settingsArea.innerHTML = ""
  if (prefs.hasOwnProperty('settings')){
    makeSettings(prefs.settings)
  }
  if (prefs.hasOwnProperty('description')){
    var description = document.createElement('p')
    var aboutTitle = document.createElement('h3')
    description.innerHTML = prefs.description
    aboutTitle.innerHTML = 'about'
    settingsArea.appendChild(aboutTitle)
    settingsArea.appendChild(description)
  }
  if (prefs.hasOwnProperty('sample_data')){
    var example = document.createElement('button')
    example.innerHTML = 'example'
    example.setAttribute('onclick', 'showExample(prefsStore.sample_data)')
    settingsArea.appendChild(example)
  }

  // make sure there are the minimum number of cols required
  if (prefs.hasOwnProperty('cols_min') && numCols < prefs.cols_min){
    for (let i = numCols+1; i <= prefs.cols_min; i++){
      addCol(i)
    }
  }

  // make sure there are the minimum number of rows required
  if (prefs.hasOwnProperty('rows_min') && numRows < prefs.rows_min){
    for (let i = numRows+1; i <= prefs.rows_min; i++){
      addRow(i)
    }
  }
  // reduce opacity on unused columns and rows if there are any
  updateAppearanceForUnused()
}

function makeSettings(settings){
  settingsArea =  document.getElementById('settingsArea')
  var settingEls = new Array();
  // label type options default
  for (i=0; i<settings.length; i++){
    if (settings[i].type == 'text' | settings[i].type == 'number' | settings[i].type == 'checkbox'){
      newInput = document.createElement('input')
      newInputLabel = document.createElement('label')
      newInput.id = 'setting_' + settings[i].type + '_' + settings[i].name
      newInput.type = settings[i].type
      newInputLabel.for = 'setting_' + settings[i].type + '_' + settings[i].name
      newInputLabel.innerHTML = settings[i].label
      if (settings[i].hasOwnProperty('default')){
        if (settings[i].type == 'checkbox'){
          if (settings[i].default){
            newInput.checked = true
          } else {
            newInput.checked = false
          }
        } else {
          newInput.value = settings[i].default
        }
      }
      if (settings[i].type == 'number'){
        if (settings[i].hasOwnProperty('min')){
          newInput.min = settings[i].min
        }
        if (settings[i].hasOwnProperty('max')){
          newInput.max = settings[i].max
        }
      }
      if (settings[i].type == 'checkbox'){
        settingEls.push(newInput)
        settingEls.push(newInputLabel)
      } else {
        settingEls.push(newInputLabel)
        settingEls.push(newInput)
      }
    } else if (settings[i].type = 'select'){
      newSelect = document.createElement('select')
      newSelect.id = 'setting_' + settings[i].type + '_' + settings[i].name
      newSelectLabel = document.createElement('label')
      newSelectLabel.for = 'setting_' + settings[i].type + '_' + settings[i].name
      newSelectLabel.innerHTML = settings[i].label
      for (j=0; j<settings[i].options.length; j++){
        newOption = document.createElement('option')
        newOption.value = settings[i].options[j]
        newOption.innerHTML = settings[i].options[j]
        newSelect.appendChild(newOption)
      }
      if (settings[i].hasOwnProperty('default')){
        newSelect.value = settings[i].default
      }
      settingEls.push(newSelectLabel)
      settingEls.push(newSelect)
    }
    settingEls.push(document.createElement('br'))
  }
  for (i=0; i<settingEls.length; i++){
    settingsArea.appendChild(settingEls[i])
  }
}


function getSettings(settings){ // gets the settngs as they've been set by the user
  var settingEl
  var settingsToReturn = {};
  // var settingItem = {name: '', type: '', value: ''}
  if (settings != null){
    for (i=0; i<settings.length; i++){
      // settingItem.name = settings[i].name
      // settingItem.type = settings[i].type
      settingEl = document.getElementById('setting_' + settings[i].type+ '_' + settings[i].name)
      if (settings[i].type == 'checkbox'){ // for checkboxes
        if(settingEl.checked){ // set to true or false depending on whether it's checked
          // settingItem.value = true
          settingsToReturn[settings[i].name] = true;
        } else {
          settingsToReturn[settings[i].name] = false;
        }
      } else if (settings[i].type == 'number') {
        settingsToReturn[settings[i].name] = parseFloat(settingEl.value) // for numbers, parse as number
      } else { // for everything else, just get its value
        settingsToReturn[settings[i].name] = settingEl.value
      }
      // settingsToReturn.push({ ...settingItem})
    }
  }
  return settingsToReturn
}

function showExample(sampleData){
  if (!tableIsEmpty()){
    if (confirm('This will erase all data in the table and replace it with sample data. Are you sure you want to continue?')){
      clearTable();
    } else {
      return
    }
  }
  convertArrayToTableData(sampleData)
}

function checkValidity(){
  validityCheckList = {enoughCols: true, enoughRows: true, emptyCellsOK: true, emptyCells: [], valid: true}
  if (prefsStore.hasOwnProperty('cols_min') && prefsStore.cols_min > numCols){
    validityCheckList.enoughCols = false
    validityCheckList.valid = false
  }
  if (prefsStore.hasOwnProperty('rows_min') && prefsStore.rows_min > numRows){
    validityCheckList.enoughRows = false
    validityCheckList.valid = false
  }
  if (!prefsStore.hasOwnProperty('empty_cells_allowed') || !prefsStore.empty_cells_allowed){ // if not set, assume false
    // NOTE: we can't use the rowContainsEmptyCell() function here because we want to ignore rows and cols than we don't actually need
    var rowsToCheck
    var colsToCheck
    if (prefsStore.hasOwnProperty('rows_max') && numRows > prefsStore.rows_max){ // if there are more rows than necessary
      rowsToCheck = prefsStore.rows_max // only check max required
    } else {
      rowsToCheck = numRows // else check all
    }
    if (prefsStore.hasOwnProperty('cols_max') && numCols > prefsStore.cols_max){ // if there are more cols than necessary
      colsToCheck = prefsStore.cols_max // only check max required
    } else {
      colsToCheck = numCols // else check all
    }
    var nonEmptyRowFound = false // no longer needed?
    var nonEmptyColFound = false // no longer needed?
    var emptyCells = []
    var inputCell
    for (let row=rowsToCheck; row>0; row--){ // go backwards, so we can ignore excess blanks at the end unless they're important
      // numColsEmptyOnRow = 0
      nonEmptyColFound = false
      for (let col=colsToCheck; col>0; col--){
        inputCell = document.getElementById('inputCell_' + row + '_' + col)
        // we don't need to check for minimum rows by itself because cols can be optional but rows can't (unless blanks are explicitly allowed)
        if (inputCell.value == '' && ( ((nonEmptyRowFound || nonEmptyColFound) && (prefsStore.hasOwnProperty('cols_min') && col <= prefsStore.cols_min))
          || ((prefsStore.hasOwnProperty('rows_min') && row <= prefsStore.rows_min) && (prefsStore.hasOwnProperty('cols_min') && col <= prefsStore.cols_min))
        ) ) {
          // numColsEmptyOnRow++
          emptyCells.push(inputCell) // only remember the empty cells that are important
        }
        // this bit not required anymore?
        if (inputCell.value != '') { // this has to be kept has a seperate if, so not to get mixed up with the other conditions for the if above
          nonEmptyColFound = true
          nonEmptyRowFound = true
        }
      }
    }
    if (emptyCells.length > 0){
      validityCheckList.emptyCellsOK = false
      validityCheckList.emptyCells = emptyCells
      validityCheckList.valid = false
    }
  }
  return validityCheckList
}

function displayValidityInfo(validity){
  console.log("Invalid table")
  console.log(validity)
  var message = "The data in the table is not valid for this activity."
  var activityName = document.getElementById('activitySlct').value.replaceAll('_',' ')
  if (!validity.enoughRows){
    message += '\n' + activityName.charAt(0).toUpperCase() + activityName.slice(1) + ' requires ' + prefsStore.rows_min + ' rows and you only have ' + numRows + " row"
    if (numRows > 1){
      message += 's.'
    } else {
      message += '.'
    }
  }
  if (!validity.enoughCols){
    message += '\n' + activityName.charAt(0).toUpperCase() + activityName.slice(1) + ' requires ' + prefsStore.cols_min + ' columns and you only have ' + numCols + " column"
    if (numCols > 1){
      message += 's.'
    } else {
      message += '.'
    }
  }
  if (!validity.emptyCellsOK){
    message += '\n' + activityName.charAt(0).toUpperCase() + activityName.slice(1) + ' does not allow empty cells and you have ' + validity.emptyCells.length + ' empty cell'
    if (validity.emptyCells.length > 1){
      message += 's.'
    } else {
      message += '.'
    }
    for (let i=0; i<validity.emptyCells.length; i++){
      validity.emptyCells[i].classList.add('invalid')
    }
  }
  alert(message)
  // change color of problem cells
}

function showSettings(){
  showSettingsButton = document.getElementById("showSettingsButton")
  settingsArea = document.getElementById("settingsArea")
  inputBox = document.getElementById("inputBox")
  if (settingsVisible){
    showSettingsButton.style.transform = null // unrotate button
    settingsVisible = false
    settingsArea.style.height = ""
    inputBox.style.height = ""
    // settingsArea.style.minHeight = ""
    settingsArea.style.padding = ""
  } else {
    showSettingsButton.style.transform = 'rotate(180deg)' // rotate the button
    settingsVisible = true
    settingsArea.style.height = "220px"
    settingsArea.style.padding = "20px"
    inputBox.style.height = "calc(100% - 480px)"
    // settingsArea.style.minHeight = "100px"
  }
}


// Electron stuff:

ipcRenderer.on('loadInput', (event, msg) => {
  document.getElementById('inputBox').innerHTML = msg // fill in input box when opening a file
})

ipcRenderer.on('getInputForExport', (event) => { // main.js requests the data
  var data = new Object();
  const selector = document.getElementById('activitySlct')
  var activity = selector.value
  var source = selector.options[selector.selectedIndex].getAttribute('data-source')
  var input = convertTableToTrimmedArray()
  var settings = getSettings(prefsStore.settings)
  data = {input: input, activity: activity, settings: settings, source: source}

  // let textBlock = convertTableDataToBlock(); // TO DO: merge these two steps into one! (still want to keep this function, will use it for exporting to clipboard)
  // data.input = convertTextBlockToArray(textBlock)

  console.log(data)
  ipcRenderer.send('sentInputForExport' ,data)
})

ipcRenderer.on('setPrefs', (event, prefs) => {
  if (prefs.hasOwnProperty('error')){
    alert('The hex settings in this activity have not been formatted correctly.\n'+prefs.error)
  } else {
    setPrefs(prefs)
  }
});

ipcRenderer.on('copyToClipboard', (event, form) => {
  var copyString = ''
  if (form == 'json'){
    copyString = convertTableDataToJSONString()
  } else if (form == 'block'){
    copyString = convertTableDataToBlock()
  }
  navigator.clipboard.writeText(copyString)
})

ipcRenderer.on('loadActivities', (event) => { // this is used for reloading the activities from main
  loadActivities()
})

ipcRenderer.on('loadPrebuiltActivities', (event, activities) => {
  const activitySlct = document.getElementById('activitySlct');
  activities.forEach(activity => {
    var option = document.createElement('option')
    option.setAttribute('value',activity)
    option.setAttribute('data-source','prebuilt')
    option.innerHTML = activity.replaceAll('_',' ')
    activitySlct.appendChild(option)
  });
  loadPrefs()
  ipcRenderer.send('getUserActivities') // request user activities
});

ipcRenderer.on('loadUserActivities', (event, activities) => {
  const activitySlct = document.getElementById('activitySlct');
  var separator = document.createElement('option')
  separator.disabled = true
  activitySlct.appendChild(separator)
  separator.innerHTML = '– User activities –'
  activities.forEach(activity => {
    var option = document.createElement('option')
    option.setAttribute('value',activity)
    option.setAttribute('data-source','user')
    option.innerHTML = activity.replaceAll('_',' ')
    activitySlct.appendChild(option)
  });
  loadPrefs()
});
