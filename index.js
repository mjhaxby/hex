// The ipcRenderer module provides a few methods so you can send events from the render process (web page) to the main process.
// It is now enabled in the preload.js file.

// These are used for Electron (I think – not actually sure what for anymore):
const runActivity = document.getElementById('runBtn');
const exportActivity = document.getElementById('exportBtn');

//GLOBAL VARS

var settingsVisible = false
var prefsStore = {cols_min: 1, rows_min: 1} // for activity prefs
var configStore = {} // for app prefs
var configStoreRequestCount = 0
var pageLoaded = false
var lastExportedScormID = ''

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
    data = convertTableToTrimmedArray()
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

function exampleButton(number=0){
  var exampleText = 'example'
  var functionRef = 'showExample(prefsStore.sample_data)'
  var example = document.createElement('button')

  if (number > 0){
    exampleText += (' #' + number)
    functionRef = 'showExample(prefsStore.sample_datas['+(number-1)+'])'
  }

  example.innerHTML = exampleText
  example.setAttribute('onclick', functionRef)
  // example.setAttribute('data-category','all')
  return example    
}

function makeInfoHover(info){
  var infoContainer = document.createElement('div')
  var infoBox = document.createElement('div')
  var infoIcon = document.createElement('div')
  infoContainer.setAttribute('class','infoContainer')
  infoBox.setAttribute('class','infoBox')
  infoIcon.setAttribute('class','infoIcon')
  infoIcon.setAttribute('onmouseover','checkInfoBoxVisibility(this)')
  infoIcon.innerHTML = 'ℹ︎'
  infoBox.innerHTML = info
  infoBox.style.bottom = '100%'
  infoContainer.appendChild(infoBox)
  infoContainer.appendChild(infoIcon)  
  return infoContainer
}

function checkInfoBoxVisibility(infoIcon){
  var infoBox = infoIcon.parentElement.children[0]
  var settingsArea = document.getElementById('settingsArea')  

  infoBox.style = 'bottom: 100%' // return to default position before checking

  var infoBoxPos = infoBox.getBoundingClientRect()
  var settingsAreaPos = settingsArea.getBoundingClientRect()

  if ((infoBoxPos.right > (settingsAreaPos.right + 20))){ // 20 padding
    infoBox.style.right = '100%'
  }
  infoBoxPos = infoBox.getBoundingClientRect()
  settingsAreaPos = settingsArea.getBoundingClientRect()
  console.log('info' + infoBoxPos.top)
  console.log('settings' + (settingsAreaPos.top-20))
  if ((infoBoxPos.top > (settingsAreaPos.top - 20))){ // 20 padding
    infoBox.style.top = '100%'
    infoBox.style.bottom = null
  }

}

function makeSettings(settings){
  var settingsArea =  document.getElementById('settingsArea')
  var settingEls = new Array();
  var categories = new Array();
  // label type options default
  for (i=0; i<settings.length; i++){
    newSetting = document.createElement('div')
    newSetting.setAttribute('class', 'setting')
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
      } else if (settings[i].type == 'text' && settings[i].hasOwnProperty('max')){
        // max for a text input is interpreted as the maximum amount of text that can be inputted
        newInput.setAttribute('maxlength',settings[i].max)
        if (settings[i].max < 10){
          newInput.setAttribute('size',settings[i].max) // for text fields whose max is much shorter than the normal size of the box, set the size too
          if (settings[i].max < 4){ // for short text fields, it'll look better if they're centered
            newInput.style.textAlign = 'center'
            if (settings[i].max == 1){
              newInput.setAttribute('onclick','this.select()') // if it's just a single character, clicking on the box should select it
            }
        }
        }
      }
      // different order for label and input for checkbox copared to others
      if (settings[i].type == 'checkbox'){
        newSetting.appendChild(newInput)
        newSetting.appendChild(newInputLabel)
        // settingEls.push(newInput)
        // settingEls.push(newInputLabel)
      } else {
        newSetting.appendChild(newInputLabel)
        newSetting.appendChild(newInput)
        // settingEls.push(newInputLabel)
        // settingEls.push(newInput)
      }
      // add info hover icon
      if (settings[i].hasOwnProperty('info')){
        newSetting.appendChild(makeInfoHover(settings[i].info))
      }
    // selects are a bit different, so we'll make that separately
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
      // // add category (if it has one, otherwise set to "general")
      // if (settings[i].hasOwnProperty('category')){
      //  newSelectLabel.setAttribute('data-category',settings[i].category)
      //  newSelect.setAttribute('data-category',settings[i].category)
      //  currentCategory = settings[i].category
      // } else {
      //   newSelectLabel.setAttribute('data-category','general')
      //   newSelect.setAttribute('data-category','general')
      //   currentCategory = 'general'
      // }
      // settingEls.push(newSelectLabel)
      // settingEls.push(newSelect)
      newSetting.appendChild(newSelectLabel)
      newSetting.appendChild(newSelect)      
    }
    // add category (if it has one, otherwise set to "general")
    if (settings[i].hasOwnProperty('category')){
      currentCategory = settings[i].category
    } else {
      currentCategory = 'general'
    }
    newSetting.setAttribute('data-category',currentCategory)
    // add category to the list if we don't already have it
    if (!categories.includes(currentCategory)){
      categories.push(currentCategory)
    }
    // add to setting els array
    settingEls.push(newSetting)
    // add a line break with the same category as the element we just added, so it disappears with it when necessary
    // brEl = document.createElement('br')
    // brEl.setAttribute('data-category',currentCategory)
    // settingEls.push(brEl)
  }
  // so long as there's more than one category, add the category picker
  if (categories.length > 1){
    var categoryPicker = document.createElement('select')
    categoryPicker.id = 'categoryPicker'
    categoryPicker.setAttribute('onchange','changeActivitySettingsCategory(this.value)')
    // add 'all' option for categories
    allOption = document.createElement('option')
    allOption.value = 'all'
    allOption.innerHTML = 'all'
    categoryPicker.appendChild(allOption)
    // add all the other categories
    for (let i = 0; i < categories.length; i++){
      newOption = document.createElement('option')
      newOption.value = categories[i]
      newOption.innerHTML = categories[i]
      categoryPicker.appendChild(newOption)
    }    
    // add it to settings area
    settingsArea.appendChild(categoryPicker)
    // brEl = document.createElement('br')
    // settingsArea.appendChild(brEl)
  }
  // add all the settings to the inner div
  settingsAreaInner = document.createElement('div')
  settingsAreaInner.id = 'settingsAreaInner'
  for (i=0; i<settingEls.length; i++){
    settingsAreaInner.appendChild(settingEls[i])
  }
  // add columns if there is more than one setting
  settingsAreaInner.style.columns = determineColumnSettingsForSettings(settingEls.length)
  
  // add all the settings to the main div
  settingsArea.appendChild(settingsAreaInner)
  // so long as there was at least one setting, add a little hr
  if (settingEls.length > 0){
    var hrule = document.createElement('hr')
    settingsArea.appendChild(hrule)
  }    
  // select the first category (after all), so long as there's more than one
  if (categories.length > 1){
    changeActivitySettingsCategory(categories[0])
    categoryPicker.value = categories[0]
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

function changeActivitySettingsCategory(category){
  var settingsAreaInner =  document.getElementById('settingsAreaInner')
  numSettings = 0
  for (let i = 0; i<settingsAreaInner.children.length; i++){
    if(category == 'all' || settingsAreaInner.children[i].getAttribute('data-category') == category || settingsAreaInner.children[i].getAttribute('data-category') == 'all'){
      settingsAreaInner.children[i].classList.remove('hidden')
      numSettings++
    } else {
      settingsAreaInner.children[i].classList.add('hidden')
    }
  }
  settingsAreaInner.style.columns = determineColumnSettingsForSettings(numSettings)
}

function determineColumnSettingsForSettings(numSettings){
  if(numSettings == 1){
    return '1'
  } else if (numSettings == 2){
    return '2 auto'
  } else {
    return 'auto 20em'
  }
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
    showSettingsButton.classList.remove('up')
    showSettingsButton.classList.add('down')
    settingsVisible = false
    settingsArea.style.height = ""
    inputBox.style.height = ""
    // settingsArea.style.minHeight = ""
    settingsArea.style.padding = ""
  } else {
    showSettingsButton.classList.remove('down')
    showSettingsButton.classList.add('up')
    settingsVisible = true
    settingsArea.style.height = "220px"
    settingsArea.style.padding = "20px"
    inputBox.style.height = "calc(100% - 480px)"
    // settingsArea.style.minHeight = "100px"
  }
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
  dataAsArray = returnJSONorArray(data)
  convertArrayToTableData(dataAsArray)
})

ipcRenderer.on('getInputForExport', (event) => { // main.js requests the data
  sendInputForExport()
})

function sendInputForExport(){
  var data = new Object();
  const selector = document.getElementById('activitySlct')
  var activity = selector.value
  var source = selector.options[selector.selectedIndex].getAttribute('data-source')
  var input = convertTableToTrimmedArray()
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
  ipcRenderer.send('sentInputForExport', data)
}

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


