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

var virgin = true
var tableObserver

// const table = new TableManager('table0')
const table = new TableTester('table0') // for testing purposes - this will replace the normal table manager with one that has testing functions, but is otherwise the same

// PAGE FUNCTIONS

document.addEventListener('DOMContentLoaded',pageLoad)

function pageLoad(){

  pageLoaded = true // just indicates that the DOM is ready

  const inputBox = document.getElementById('inputBox')
  inputBox.appendChild(table.tableElement) // add the table element (this is needed before we can do anything else with the table, so we'll just make it with 0 rows and cols for now and then add the rest of the structure when we get the activity prefs)
  inputBox.appendChild(table.detailEditor) // add the detail editor element

  table.initializeWysiwyg('')

  loadActivities()
  document.body.appendChild(table.dragPlaceholder())
  setTimeout(function(){
    document.body.classList.remove('preload');      
    ipcRenderer.send('editorWindowReady') // let main know that the renderer is ready, so it can send the config and any other info it needs to send on load
  },500)

  applyAppConfig() // this should have already happened, but it won't hurt to apply it again if it hasn't
  // if it hasn't happened (maybe the page was reloaded), it will request the config which will retrigger the same function

  document.body.addEventListener('pointerdown', (e) => table.deselectAll(e), true)
  setTimeout(function(){ // add the table observer after a delay, so as not to trigger it with the initial preparation of the table
    tableObserver = new MutationObserver(markTableModified)
    tableObserver.observe(table.tableBody, {subtree: true, childList: true, attributes: true, characterData: true})
    table.tableBody.addEventListener('input', markTableModified)
  },1000)

  table.enableTableRowSorting()
  
}



// to do – move into table manager? have a new general function that will look for other changes in the document, rather than just the table?
function markTableModified(e) {
  if (!virgin) return
  if (!tableObserver) return // if the table observer isn't ready yet, we don't want to mark the table as modified because of the changes that are being made to set it up
  virgin = false
  tableObserver.disconnect()
  table.tableBody.removeEventListener('input', markTableModified)
  ipcRenderer.send('tableModified') // tell main process that the table has been modified
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

  table.saveTextFromDetailEditor() // first save any text that might be in the detail editor, so it gets included in the validity check and the data that we send to main

  const validity = checkValidity()
  if (validity.valid){
    var data = [];
    // let textBlock = convertTableDataToBlock();
    const selector = document.getElementById('activitySlct')
    var activity = selector.value
    var source = selector.options[selector.selectedIndex].getAttribute('data-source')
    data = table.convertTableToTrimmedArray(true,true)    
    settings = getSettings(prefsStore.settings)
    console.log(settings)
     //send the info to main process
    ipcRenderer.send('runActivity', data, settings, activity, source); // ipcRender.send will pass the information to main process
  } else {
    displayValidityInfo(validity)
  }
}

function exporter(){
    table.saveTextFromDetailEditor() // first save any text that might be in the detail editor, so it gets included in the validity check and the data that we send to main

  const validity = checkValidity()  
  if (validity.valid){
      ipcRenderer.send('exportActivity'); // since export can be called from elsewhere, we won't bother sending the data from here
  } else {
    displayValidityInfo(validity)
  }
}

function selectActivity(){  
    if(table.detailEditorCell){
      table.closeDetailEditor() // close detail editor if open, make sure everything is up to date first
  }

  table.clearUnusedRowsFromEnd(true)
  table.clearUnusedColsFromEnd(true)
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

  document.getElementById('activityName').setAttribute('placeholder', prefsStore.hasOwnProperty('activity') ? `new ${prefsStore.activity.replaceAll('_', ' ')}` : '')

  // set table size etc first
  //replace header column (what's a bit stupid is that we add it when the page first loads and then replace it - there may be a better way)
  let tableBody = table.tableBody
  // tableBody = document.getElementById('tableBody')
  // tableBody.removeChild(tableBody.children[0])
  table.removeHeaderRow()
  if (prefs.hasOwnProperty('cols_min') && prefs.cols_min > table.numCols()){
    table.addNewColIDsToEnd(prefs.cols_min) // make sure the table manager knows about the new cols before we add the header row with controls, so it can add the colIDs for those cols
  }
  table.headerRow(table.numCols())

  // disable or re-enable images selector
  table.checkDataTypeCols()

  //set up settings area
  settingsArea = document.getElementById("settingsArea")
  settingsArea.innerHTML = ""
  if (prefs.hasOwnProperty('settings')){
    makeSettings(prefs.settings) // this will set the factory default settings first, which we should do just in case they've been updated since the defaults were set
    if (Object.keys(customDefaults).length > 0){
      prefsStore.customDefaults = customDefaults
      setSettings(customDefaults,prefs.settings)
        if(customDefaults.activityName && customDefaults.activityName != ''){
          document.getElementById('activityName').value = customDefaults.activityName
      }
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
    var example = exampleButton(0,prefs.sample_data.hasOwnProperty('settings'),prefs.sample_data.hasOwnProperty('title') ? prefs.sample_data.title : '')
    settingsArea.appendChild(example)
  } else if (prefs.hasOwnProperty('sample_datas')){
    // var exampleHolder = document.createElement('div')
    // exampleHolder.setAttribute('id','exampleHolder')
    for (let i=1; i<=prefs.sample_datas.length; i++){
      var example = exampleButton(i,prefs.sample_datas[i-1].hasOwnProperty('settings'),prefs.sample_datas[i-1].hasOwnProperty('title') ? prefs.sample_datas[i-1].title : '')      
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
  if (prefs.hasOwnProperty('cols_min') && table.numCols() < prefs.cols_min){
    for (let i = table.numCols()+1; i <= prefs.cols_min; i++){
      table.addCol()
    }
  }

  // make sure there are the minimum number of rows required
  if (prefs.hasOwnProperty('rows_min') && table.numRows() < prefs.rows_min){
    for (let i = table.numRows(); i <= prefs.rows_min; i++){
      table.addRow()
    }
  }
  // reduce opacity on unused columns and rows if there are any
  table.updateAppearanceForUnused()
}

function exampleButton(number = 0,includesSettings = false, title = '') {
  var exampleText = 'example'
  var withSettingsText = '(includes sample settings)'
  var functionRef = 'showExample(prefsStore.sample_data)'
  var example = document.createElement('button')

  if (number > 0) {
      exampleText += (' #' + number)
      functionRef = 'showExample(prefsStore.sample_datas[' + (number - 1) + '])'
  } 

  example.setAttribute('class', 'exampleBtn')

  example.innerHTML = `${exampleText}`
  if (title != ''){
    example.appendChild(document.createElement('br'))
    let titleEl = document.createElement('span')
    titleEl.innerHTML = `${title}`
    example.appendChild(titleEl)
  }
  if (includesSettings){
    example.appendChild(document.createElement('br'))
    let withSettings = document.createElement('small')
    withSettings.innerHTML = `${withSettingsText}`
    example.appendChild(withSettings)
  }
  example.setAttribute('onclick', functionRef)
  // example.setAttribute('data-category','all')
  return example
}

function checkValidity(){
  validityCheckList = {enoughCols: true, enoughRows: true, emptyCellsOK: true, emptyCells: [], valid: true}
  if (prefsStore.hasOwnProperty('cols_min') && prefsStore.cols_min > table.numCols()){
    validityCheckList.enoughCols = false
    validityCheckList.valid = false
  }
  if (prefsStore.hasOwnProperty('rows_min') && prefsStore.rows_min > table.numEnabledRows()){
    validityCheckList.enoughRows = false
    validityCheckList.valid = false
  }
  if (!prefsStore.hasOwnProperty('empty_cells_allowed') || !prefsStore.empty_cells_allowed){ // if not set, assume false
    // NOTE: we can't use the rowContainsEmptyCell() function here because we want to ignore rows and cols than we don't actually need
    var rowsToCheck
    var colsToCheck
    if (prefsStore.hasOwnProperty('rows_max') && table.numRows() > prefsStore.rows_max){ // if there are more rows than necessary
      rowsToCheck = prefsStore.rows_max-1 // only check max required
      if (rowsToCheck > table.numRows()-1){
        rowsToCheck = table.numRows()-1
      }
    } else {
      rowsToCheck = table.numRows()-1 // else check all
    }
    if (prefsStore.hasOwnProperty('cols_max') && table.numCols() > prefsStore.cols_max){ // if there are more cols than necessary
      colsToCheck = prefsStore.cols_max-1 // only check max required
      if (colsToCheck > table.numCols()-1){
        colsToCheck = table.numCols()-1
      }
    } else {
      colsToCheck = table.numCols()-1 // else check all
    }
    var nonEmptyRowFound = false // no longer needed?
    var nonEmptyColFound = false // no longer needed?
    var emptyCells = []
    var inputCellText
    for (let row=rowsToCheck; row>=0; row--){ // go backwards, so we can ignore excess blanks at the end unless they're important
      // table.numColsEmptyOnRow = 0
      let rowEl = table.get('row',row)
      if (rowEl.classList.contains('disabled')){ // if the row is disabled, we can ignore any empty cells in it, since we won't be using it anyway
        continue
      }
      nonEmptyColFound = false      
      for (let col=colsToCheck; col>=0; col--){
        let inputCellText = table.getTableCellTextElement(row,col)
        let inputCellFile = table.getTableCellFileElement(row,col)
        // we don't need to check for minimum rows by itself because cols can be optional but rows can't (unless blanks are explicitly allowed)
        if ((inputCellText.value == '' && (inputCellFile.classList.contains('disabled') || (!inputCellFile.classList.contains('disabled') && inputCellFile.classList.contains('hidden')))) // cell is empty if there is no text and file holder disabled (signalling it can't be used), or if file holder is not disabled (signalling it can be used) but is hidden (signalling it is empty)
        && ( ((nonEmptyRowFound || nonEmptyColFound) && (prefsStore.hasOwnProperty('cols_min') && col < prefsStore.cols_min))
          || ((prefsStore.hasOwnProperty('rows_min') && row <= prefsStore.rows_min) && (prefsStore.hasOwnProperty('cols_min') && col < prefsStore.cols_min))
        ) ) {
          // numColsEmptyOnRow++
          emptyCells.push(inputCellText) // only remember the empty cells that are important
        }
        // this bit not required anymore?
        if (inputCellText.value != '' || (!inputCellFile.classList.contains('disabled') && inputCellFile.classList.contains('hidden'))) { // this has to be kept has a seperate if, so not to get mixed up with the other conditions for the if above
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
    message += '\n' + activityName.charAt(0).toUpperCase() + activityName.slice(1) + ' requires ' + prefsStore.rows_min + ' rows and you only have ' + table.numRows() + " row"
    if (table.numRows() > 1){
      message += 's.'
    } else {
      message += '.'
    }
  }
  if (!validity.enoughCols){
    message += '\n' + activityName.charAt(0).toUpperCase() + activityName.slice(1) + ' requires ' + prefsStore.cols_min + ' columns and you only have ' + table.numCols() + " column"
    if (table.numCols() > 1){
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

ipcRenderer.on('loadInput', (event, data, fileStore, waitingForActivity=false) => {

  // if DOM not ready, create event
  if (!pageLoaded){
    document.addEventListener("DOMContentLoaded", function(event) { 
      ipcRenderer.emit('loadInput', event, data, fileStore, activity, source)
    });
    return
  }

  var dataAsArray = []
  if (typeof data == 'object'){
    dataAsArray = data
  } else {
    dataAsArray = returnJSONorArray(data)
  }  

  // if there are files in the input, put these back into the array
  // note: this approach should work even for version 3.4.1 and earlier where the images were already integrated into the table
  if(Object.keys(fileStore).length > 0){
    for(let row = 0; row < data.length; row++){
      for (let col = 0; col < data.length; col++){        
        if(typeof data[row][col] == 'object'){
          if(data[row][col].hasOwnProperty('image')){
            data[row][col].image = fileStore.gameData[parseInt(data[row][col].image)]
          }
          // if(data[row][col].hasOwnProperty('datetime')){
            // don't need to do anything?
          // }
        }
      }
    }
  }

  // empty the table
  if(table.isEmpty()){    
    table.convertArrayToTableData(dataAsArray)
    markTableModified()
  } else {
    if (confirm('This will erase all data currently in the table and cannot be undone. Are you sure you want to continue?')){
      table.clearTable()
      table.convertArrayToTableData(dataAsArray)
      markTableModified()
    }
  }

  if(waitingForActivity){
    ipcRenderer.send('getActivity')
  }
  
})

ipcRenderer.on('getInputForExport', (event) => { // main.js requests the data
  sendInput('export')
})

ipcRenderer.on('getInputForSave', (event,path) => { // main.js requests the data
  sendInput('save',path)
})

function importImage(cell,file=false,cellOffset=0){
  let cellID = cell.classList.contains('detailEditor') ? table.detailEditorCell : cell.dataset.cell  

  if(file){
    ipcRenderer.send('dataSelectImportFromFile', cellID, ['image'], file, cellOffset)
  } else {    
    ipcRenderer.send('dataSelectImport', cellID, ['image'], cellOffset)
  }
}

ipcRenderer.on('dataCellFileImportResult', (event,cellID,fileStoreItem) => {
  // console.log(event)
  // console.log(cellID)
  // console.log(fileStoreItem)
  table.addImageToCell(cellID,fileStoreItem)
  markTableModified()
})

function sendInput(purpose='export',path=''){
  var data = new Object();
  const selector = document.getElementById('activitySlct')
  var activity = selector.value
  var source = selector.options[selector.selectedIndex].getAttribute('data-source')
  var input = table.convertTableToTrimmedArray(true,true)
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

function changeSelectedActivity(activity, source){

  let selector = document.getElementById('activitySlct')
  var selectIndex = -1
  for (let i=0; i< selector.options.length; i++){
    if (selector.options[i].value == activity && selector.options[i].getAttribute('data-source') == source){
      selectIndex = i
      i = selector.options.length // stop looking
    }
    if (selectIndex == -1 && /_beta/.test(activity)){
      // if the activity is a beta version, we need to check if there is a non-beta version of the same activity
      if (selector.options[i].value == activity.replace('_beta','') && selector.options[i].getAttribute('data-source') == source){
        selectIndex = i
        i = selector.options.length // stop looking
      }
    }
  }
  if (selectIndex == -1){
    window.alert('Activity does not exist.')
  } else {
    // let prevIndex = selector.selectedIndex
    selector.selectedIndex = selectIndex // this will trigger loading the saved activity settings if there are any
    selectActivity() // not triggered by the change, so we'll trigger it here
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

  if(!pageLoaded){
    document.addEventListener("DOMContentLoaded", function(event) {
      ipcRenderer.emit('setActivity', event, activity, source)
    });
    return
  }

  changeSelectedActivity(activity, source)

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
    table.clearTable();
  }
})

ipcRenderer.on('deleteUnusedRows', (event) => {
  table.clearUnusedRowsFromEnd();
})

ipcRenderer.on('deleteUnusedCols', (event) => {
  table.clearUnusedColsFromEnd();
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
  if(settings.activityName && settings.activityName != ''){
    document.getElementById('activityName').value = settings.activityName
  }
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


