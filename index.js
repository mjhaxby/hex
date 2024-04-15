// The ipcRenderer module provides a few methods so you can send events from the render process (web page) to the main process.
// It is now enabled in the preload.js file.

// These are used for Electron (I think – not actually sure what for anymore):
const runActivity = document.getElementById('runBtn');
const exportActivity = document.getElementById('exportBtn');

//GLOBAL VARS

var prefsStore = {cols_min: 1, rows_min: 1} // for activity prefs
var configStore = {} // for app prefs
var configStoreRequestCount = 0
var pageLoaded = false
var lastExportedScormID = ''
var appVersion

// PAGE FUNCTIONS

document.addEventListener('DOMContentLoaded',pageLoad)

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
  setTimeout(function(){
    document.body.classList.remove('preload');
  },500)
  pageLoaded = true
  applyAppConfig() // this should have already happened, but it won't hurt to apply it again if it hasn't
  // if it hasn't happened (maybe the page was reloaded), it will request the config which will retrigger the same function
  document.body.addEventListener('pointerdown', deselectAll, true); // unselect when clicking anywhere
}

// apply preferences set by the app
function applyAppConfig(){
  if (Object.keys(configStore).length > 0){
    if (configStore.showAdvancedExport){
      showAdvancedExport()
    } else {
      hideAdvancedExport()
    }
  } else { // if the page is reloaded for example, we won't have it
    if (configStoreRequestCount < 10){ // don't do this forever, just in case
      ipcRenderer.send('requestConfig')
      configStoreRequestCount++
    }
  }
}

function run() {
  validity = checkValidity()
  if (validity.valid){
    var data = [];
    // let textBlock = convertTableDataToBlock();
    const selector = document.getElementById('activitySlct')
    var activity = selector.value
    var source = selector.options[selector.selectedIndex].getAttribute('data-source')
    data = convertTableToTrimmedArray(true)
    settings = getSettings(prefsStore.settings)
    console.log(settings)
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

  packageIDEl = document.getElementById('packageID')
  if (document.getElementById('scormToggle').checked && lastExportedScormID == packageIDEl.value){
    packageIDEl.value = ''
  }
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

function setPrefs(prefs, customDefaults={}){
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
    makeSettings(prefs.settings) // this will set the factory default settings first, which we should do just in case they've been updated since the defaults were set
    if (Object.keys(customDefaults).length > 0){
      setSettings(customDefaults,prefs.settings)
    }
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
    var example = exampleButton()
    settingsArea.appendChild(example)
  } else if (prefs.hasOwnProperty('sample_datas')){
    // var exampleHolder = document.createElement('div')
    // exampleHolder.setAttribute('id','exampleHolder')
    for (let i=1; i<=prefs.sample_datas.length; i++){
      var example = exampleButton(i)      
      settingsArea.appendChild(example)
      if (i<prefs.sample_datas.length) {settingsArea.append(' ')} // weirdly this is how we get the space between the other buttons, so we're doing the same here to be consistent
    }
  }

  // enable or disable scorm toggle
  var scormTogglerHolder = document.getElementById('scormToggle_holder')
  var scormToggle = document.getElementById('scormToggle')
  if (prefs.scorm_support){
    scormTogglerHolder.classList.remove('disabled')
    scormToggle.disabled = false 
    exportTypeToggled()    
  } else {
    scormTogglerHolder.classList.add('disabled')
    scormToggle.checked = false
    scormToggle.disabled = true // just in case
    exportTypeToggled()
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

function exampleButton(number = 0) {
  var exampleText = 'example'
  var functionRef = 'showExample(prefsStore.sample_data)'
  var example = document.createElement('button')

  if (number > 0) {
      exampleText += (' #' + number)
      functionRef = 'showExample(prefsStore.sample_datas[' + (number - 1) + '])'
  }

  example.setAttribute('class', 'exampleBtn')

  example.innerHTML = exampleText
  example.setAttribute('onclick', functionRef)
  // example.setAttribute('data-category','all')
  return example
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

function exportTypeToggled() {
  var checkboxEl = document.getElementById('scormToggle')
  var packageIDWrapper = document.getElementById('packageIDWrapper');
  var packageIDEl = document.getElementById('packageID')

  if (checkboxEl.checked) {
    packageIDWrapper.classList.add('expandedLeft');
    packageIDWrapper.classList.remove('hiddenLeft');
  } else {
    packageIDWrapper.classList.remove('expandedLeft');
    packageIDWrapper.classList.add('hiddenLeft');
    if (lastExportedScormID == packageIDEl.value){
      packageIDEl.value = ''
    }
  }
}

function generateID(){
  document.getElementById('packageID').value = crypto.randomUUID()
}


// Electron stuff:

ipcRenderer.on('loadInput', (event, data) => {
  var dataAsArray = []
  if (typeof data == 'object'){
    dataAsArray = data
  } else {
    dataAsArray = returnJSONorArray(data)
  }  
  convertArrayToTableData(dataAsArray)
})

ipcRenderer.on('getInputForExport', (event) => { // main.js requests the data
  sendInput('export')
})

ipcRenderer.on('getInputForSave', (event,path) => { // main.js requests the data
  sendInput('save',path)
})

function sendInput(purpose='export',path=''){
  var data = new Object();
  const selector = document.getElementById('activitySlct')
  var activity = selector.value
  var source = selector.options[selector.selectedIndex].getAttribute('data-source')
  var input = convertTableToTrimmedArray(true)
  var settings = getSettings(prefsStore.settings)
  var packageIDEl = document.getElementById('packageID')


  if(document.getElementById('scormToggle').checked){
    type = 'scorm'
    if (packageIDEl.value.trim() == ''){
      generateID()
    }
    packageIdentifier = packageIDEl.value.trim()
    lastExportedScormID = packageIdentifier
  } else {
    type = 'html'
    packageIdentifier = ''
  }
  data = {input: input, activity: activity, settings: settings, source: source, type: type, packageIdentifier: packageIdentifier}

  console.log(data)
  if (purpose == 'export'){
    ipcRenderer.send('sentInputForExport', data)
  } else if (purpose == 'save') {
    ipcRenderer.send('sentInputForSave', data, path)
  }
  
}

ipcRenderer.on('setPrefs', (event, prefs,customDefaults) => {
  if (prefs.hasOwnProperty('error')){
    alert('The hex settings in this activity have not been formatted correctly.\n'+prefs.error)
  } else {
    setPrefs(prefs,customDefaults)
  }
});

ipcRenderer.on('setActivity', (event, activity, source) => {
  let selector = document.getElementById('activitySlct')
  var selectIndex = -1
  for (let i=0; i< selector.options.length; i++){
    if (selector.options[i].value == activity && selector.options[i].getAttribute('data-source') == source){
      selectIndex = i
      i = selector.options.length // stop looking
    }
  }
  if (selectIndex == -1){
    window.alert('Activity does not exist.')
  } else {
    // let prevIndex = selector.selectedIndex
    selector.selectedIndex = selectIndex // this will trigger loading the saved activity settings if there are any
    selectActivity() // not triggered by the change, so we'll trigger it here
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

ipcRenderer.on('clearTable', (event) => {
  if (confirm('This will erase all data in the table and cannot be undone. Are you sure you want to continue?')){
    clearTable();
  }
})

ipcRenderer.on('deleteUnusedRows', (event) => {
  clearUnusedRowsFromEnd();
})

ipcRenderer.on('deleteUnusedCols', (event) => {
  clearUnusedColsFromEnd();
})

ipcRenderer.on('loadActivities', (event) => { // this is used for reloading the activities from main
  loadActivities()
})

ipcRenderer.on('configStore', (event, config) => {
  configStore = config
  if(pageLoaded){
    applyAppConfig()
  }
  // just in case the page hasn't loaded, we'll also apply it again when it does
  document.addEventListener("DOMContentLoaded", function(event) { 
    applyAppConfig() 
  });
})

ipcRenderer.on('getActivitySettingsForProfile', (event) => {
  let activitySettings = getSettings(prefsStore.settings)
  const selector = document.getElementById('activitySlct')
  var activity = selector.value
  var source = selector.options[selector.selectedIndex].getAttribute('data-source')
  console.log('sending settings to profile')
  console.log(activitySettings)
  ipcRenderer.send('settingsToProfile', activity, source, activitySettings)
})

ipcRenderer.on('applyActivitySettings', (event, settings) => {
  console.log(settings)
  setSettings(settings,prefsStore.settings,false) // later change to false
})

// ipcRenderer.on('showAdvancedExport', (event) => {
//   console.log('Show advanced export options')
//   try{
//     showAdvancedExport()
//   } catch { //if it doesn't work, it's probably because the page hasn't loaded, so set it up to do it then
//     document.addEventListener("DOMContentLoaded", function(event) { 
//       showAdvancedExport()
//     });
//   }

// })

function showAdvancedExport(){
  advancedExport = document.getElementById('advancedExport')
  advancedExport.style.display = 'inline-block'
  setTimeout(function(){
    advancedExport.classList.remove('preload');
  },500)
  document.getElementById('buttons').classList.add('leftAlign')
}

function hideAdvancedExport(){
  console.log('Hide advanced export options')
  advancedExport = document.getElementById('advancedExport')
  advancedExport.style.display = null
  advancedExport.classList.add('preload');
  document.getElementById('buttons').classList.remove('leftAlign')
  document.getElementById('scormToggle').checked = false // set back to default HTML
}

// ipcRenderer.on('hideAdvancedExport', (event) => {
//   console.log('Hide advanced export options')
//   advancedExport = document.getElementById('advancedExport')
//   advancedExport.style.display = null
//   advancedExport.classList.add('preload');
//   document.getElementById('buttons').classList.remove('leftAlign')
//   document.getElementById('scormToggle').checked = false // set back to default HTML
// })

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

ipcRenderer.on('requestActivitySettingDefaults', (event) => {
  setDefaultActivitySettings()
})


