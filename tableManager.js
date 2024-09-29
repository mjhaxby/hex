
//GLOBAL VARS

var numRows = 0 // first one will be added
var numCols = 2
// var colWidth = 'half'
var selection = {col: [], row: []}
var lastSelection = {col: [], row: []}
var selectionProxy = new Proxy(selection, {
  set: function (target, key, value) {
      // console.log(`${key} selection set to ${value}`);
      target[key] = value;
      resortSelection(key)
      updateAppearanceForSelection(key, value)
      return true;
  }
});

function showRowControls(row){
  let rowEl = document.getElementById('row_'+row+'_controls')
  rowEl.style.opacity = 1
}

function hideRowControls(row){
  let rowEl = document.getElementById('row_'+row+'_controls')
  rowEl.style.opacity = ''
}

function showColControls(col){
  let addEl = document.getElementById('col_'+col+'_addBefore')
  let removeEl = document.getElementById('col_'+col+'_remove')
  addEl.style.opacity = 1
  removeEl.style.opacity = 1
}

function hideColControls(col){
  let addEl = document.getElementById('col_'+col+'_addBefore')
  let removeEl = document.getElementById('col_'+col+'_remove')
  addEl.style.opacity = ''
  removeEl.style.opacity = ''
}

function addRow(position){
  tableBody = document.getElementById('tableBody')
  // update all rows from position onwards (exclude final row, which contains the + buttons)
  for (let i = tableBody.children.length-2; i >= position; i--){ // go backwards or we'll run over ourselves
    renumberRow(i,i+1)
  }
  // add new row
  newRow = tableRow(position,numCols)
  tableBody.insertBefore(newRow,tableBody.childNodes[position+1])
  numRows++
  updateAppearanceForUnused()
}

function deleteRow(position){
  if (numRows > 1){
    tableBody = document.getElementById('tableBody')
    currentFocus = document.activeElement
    if (currentFocus.getAttribute('class') == 'inputCellText'){
      newFocusId = currentFocus.id.replace(/inputCellText_\d+_(\d+)/, 'inputCellText_'+(position-1)+'_$1')
      newFocus = document.getElementById(newFocusId)
      newFocus.focus()
    }
    tableBody.removeChild(tableBody.children[position])
    // update all rows from position onwards (exclude final row, which contains the + buttons)
    for (let i = position+1; i < tableBody.children.length; i++){
      renumberRow(i,i-1)
    }
    numRows--
  } else { // if there's only one row, just empty its contents
    rowEl = document.getElementById('row_'+position)
    for (let i=1; i<rowEl.children.length; i++){
      rowEl.children[i].children[0].value = ''
    }
  }
}

function deleteCol(position){
  if (numCols > 1){
    tableBody = document.getElementById('tableBody')
    // change focus if necessary
    currentFocus = document.activeElement
    focusRegex = new RegExp('inputCellText_\d+_'+position)
    if (focusRegex.test(currentFocus.id)){
      newFocusId = currentFocus.id.replace(/inputCellText_(\d+)_\d+/, 'inputCellText_$1_'+position-1)
      newFocus = document.getElementById(newFocusId)
      newFocus.focus()
    }
    // remove column and redo numberings on existing ones
    for (let i=0;i<=numRows+1;i++){
      tableBody.children[i].removeChild(tableBody.children[i].children[position])
      if (i>0 && i<=numRows){
        for (let j=position+1; j<=tableBody.children[i].children.length-1; j++){
          renumberCol(i,j,j-1)
        }
      }
    }
    // reduce number of columns count
    numCols--
    // recreate header row
    tableBody.removeChild(tableBody.children[0])
    headerRow(numCols)
  } else { // if there's only one column, just empty it's contents
    for (let i=0;i<=numRows;i++){
      tableBody.children[i].children[position].children[0].value = ''
    }
  }
}

function clearRow(position){
  var dataCells = document.querySelectorAll('input[data-cell-row="'+position+'"]')
  for (let i=0; i<dataCells.length; i++){
    clearCell(dataCells[i])
  }  
}

function clearCol(position){
  var dataCells = document.querySelectorAll('input[data-cell-col="'+position+'"]')
  for (let i=0; i<dataCells.length; i++){
    clearCell(dataCells[i])
  }
}

function clearTable(){
  var dataCells = document.querySelectorAll('.dataCell')
  for (let i=0; i<dataCells.length; i++){
    clearCell(dataCells[i])
  }
}

function clearCell(dataCell){
  dataCell.children[0].value = '' //inputCellText
  dataCell.children[2].innerHTML = '' //inputCellFile
  dataCell.children[2].classList.add('hidden')  //inputCellFile
  dataCell.classList.remove('withPreview')
  // also revert to normal view:
  dataCell.classList.remove('expanded')
  dataCell.children[0].classList.remove('hidden')
  dataCell.children[1].classList.add('hidden')
}

function clearUnusedRowsFromEnd(){
  for (let row=numRows; row>1; row--){ // go backwards, leave the first row
    if(isEmptyRow(row)){
      deleteRow(row)
    } else {
      return // stop after finding the first non-empty row
    }
  }
}

function clearUnusedColsFromEnd(){
  for (let col=numCols; col>1; col--){ // go backwards, leave the first row
    if(isEmptyCol(col)){
      deleteCol(col)
    } else {
      return // stop after finding the first non-empty row
    }
  }
}

function renumberRow(oldNum,newNum){
  // might be better to simplify this by replacing each row with a duplicate of itself containing the same values (i.e. edit inputCellText function etc. to take an optional value variable, which defaults to empty)

  row = document.getElementById('row_'+oldNum)
  rowNum = document.getElementById('rowNum_'+oldNum)
  rowNum.innerHTML = newNum
  rowNum.id = 'rowNum_'+newNum
  colHead = document.getElementById('row_'+oldNum+'_0')
  // colHead.setAttribute('onmouseover','showRowControls('+newNum+')')
  // colHead.setAttribute('onmouseout','hideRowControls('+newNum+')')
  colHead.id = 'row_'+newNum+'_0'
  document.getElementById('row_'+oldNum+'_controls').id = 'row_'+newNum+'_controls'
  addAbove = document.getElementById('row_'+oldNum+'_addAbove')
  addAbove.setAttribute('onclick', 'addRow('+newNum+')')
  addAbove.id = 'row_'+newNum+'_addAbove'
  removeRow = document.getElementById('row_'+oldNum+'_remove')
  removeRow.setAttribute('onclick','deleteRow('+newNum+')')
  removeRow.id = 'row_'+newNum+'_remove'
  selectArea = document.getElementById('selectAreaRow_'+oldNum)
  selectArea.setAttribute('onmouseup','selectRow(event, '+newNum+')')
  selectArea.id = 'selectAreaRow_'+newNum

  // update the TDs
  for(let i=1; i<row.children.length; i++){
    row.children[i].id = 'dataCell_' + newNum + '_' + i
    // row.children[i].children[0].setAttribute('onkeydown', 'inputCellTextKey(event, '+newNum+', '+i+')')
    // row.children[i].children[0].setAttribute('onpaste','pasteInData(event, '+newNum+', '+i+')')
    row.children[i].children[0].setAttribute('data-row', newNum)
    if (row.children[i].children.length > 1){
      row.children[i].children[0].id = 'inputCellText_' + newNum + '_' + i
      row.children[i].children[1].id = 'inputCellExtension_' + newNum + '_' + i
      row.children[i].children[1].children[0].id = 'inputCellTextMirror_' + newNum + '_' + i
      row.children[i].children[1].children[1].id = 'inputCellImageSelector_' + newNum + '_' + i
      row.children[i].children[2].id = 'inputCellFile_' + newNum + '_' + i

    }
  }
  row.id = 'row_'+newNum
}

function renumberCol(row,oldNum,newNum){
  updateCell = document.getElementById('dataCell_'+row+'_'+oldNum)
  updateCell.setAttribute('id','dataCell_'+row+'_'+newNum)
  updateCell.children[0].setAttribute('id','inputCellText_'+row+'_'+newNum)
  updateCell.children[0].setAttribute('data-col', newNum)
  updateCell.children[1].setAttribute('id',`inputCellExtension_${row}_${newNum}`)
  updateCell.children[1].children[0].setAttribute('id',`inputCellTextMirror_${row}_${newNum}`)
  updateCell.children[1].children[1].setAttribute('id',`inputCellImageSelector_${row}_${newNum}`)
  updateCell.children[2].setAttribute('id',`inputCellFile_${row}_${newNum}`)
  // updateCell.children[0].setAttribute('onkeydown','inputCellTextKey(event, '+row+', '+newNum+')')
  // updateCell.children[0].setAttribute('onpaste','pasteInData(event, '+row+', '+newNum+')')
}

function addCol(position) {

  numCols++

  tableBody = document.getElementById('tableBody')
  firstRow = document.getElementById('headerRow')
  lastRow = document.getElementById('lastRow')

  newHeader = colControlsCell(position)

  // remake the col controls after the new column
  for (let i=numCols-1; i>=position; i--){
    firstRow.replaceChild(colControlsCell(i+1),firstRow.children[i])
  }

  // add new col controls in header row
  firstRow.insertBefore(newHeader,firstRow.children[position])

  // add new add button at bottom
  lastRow.insertBefore(addRowCell(),lastRow.children[position])

  for (let i=1;i<=numRows;i++){
    // update all existing cells in every row, from every column after new one
    for (let j=numCols-1; j>=position; j--){ // go backwards so we don't run into ourselves
      renumberCol(i,j,j+1)
    }
    // add new column
    newCell = tableData(i,position)
    tableBody.children[i].insertBefore(newCell,tableBody.children[i].childNodes[position])
  }
  updateAppearanceForUnused()
}

function tableRow(row, cols){
  newRow = document.createElement('tr')
  newRow.id = 'row_'+row
  newRow.appendChild(rowControlsCell(row))
  for(let col=1; col<=cols; col++){
    newRow.appendChild(tableData(row, col))
  }
  newRow.appendChild(addColCell())
  return newRow
}

function addRowCell(){
  var newAddBottom = document.createElement('td')
  newAddBottom.innerHTML = '<div class="addBottom miniBtn" onclick="addRow(numRows+1)">+</div>'
  return newAddBottom
}

function addColCell(){
  var result = document.createElement('td')
  result.setAttribute('class', 'addCol')
  result.innerHTML = result.innerHTML + '<div class="addRight miniBtn" onclick="addCol(numCols+1)">+</div>'
  return result
}

function headerRow(cols){
  var tableBody = document.getElementById('tableBody')
  var firstRow = document.createElement('tr')
  firstRow.setAttribute('id','headerRow')
  firstRow.innerHTML = '<th class="numCol"></th>'
  for (let i=1;i<=cols;i++){
    firstRow.appendChild(colControlsCell(i))
  }
  var blankAddCol = document.createElement('th')
  blankAddCol.setAttribute('class','addCol')
  firstRow.appendChild(blankAddCol)
  tableBody.insertBefore(firstRow,tableBody.childNodes[1])
}

function colControlsCell(col){
  var result = document.createElement('th')
  result.setAttribute('id','col_0_'+col)
  // result.setAttribute('onmouseover','showColControls('+col+')')
  // result.setAttribute('onmouseout','hideColControls('+col+')')
  result.innerHTML = colControls(col)
  return result
}

function colControls(col){
  var colName = establishColName(col)
  var newColControl = ''
  if (col != 1){
    newColControl += swapButton(col)
  }
  newColControl += '<div id="col_'+col+'_addBefore" class="addBefore miniBtn" onclick="addCol('+col+')">+</div>'
  newColControl += '<div id="colName_'+col+'" class="colName">'+colName+'</div>'
  newColControl += '<div id="col_'+col+'_remove" class="removeCol miniBtn" onclick="deleteCol('+col+')">-</div>'
  newColControl += '<div id="selectAreaCol_'+col+'" class="selectAreaCol" title="'+colName+'" onmouseup="selectCol(event, '+col+')">&nbsp;</div>'
  newColControl += '<button class="inputCellMore" onclick="toggleCellExtensionCol('+col+')">⋮</button>'
  return newColControl
}

function swapButton(col){
  var result = '<button class="swapBtn miniBtn" onclick="swapData('+(col-1)+','+col+')"><img class="swapIcon" src="swap.svg"></img></button>'
  return result
}

function establishColName(col){
  var name = col.toString(); // default
  if (prefsStore.hasOwnProperty('cols') && prefsStore.cols[col-1]){
    name = prefsStore.cols[col-1].title;
    if (name == '====' && col > 1){ // special code to repeat the last column name (col > 1 as a precaution in case someone sets the first to ====)
      name = prefsStore.cols[prefsStore.cols.length-2].title // use name from one before
    }
    if (prefsStore.hasOwnProperty('cols_min') && col > prefsStore.cols_min){
      name = '(' + name + ')'
    }
  } else if (prefsStore.hasOwnProperty('cols') && prefsStore.cols[prefsStore.cols.length-1].title == '====' && col > 1){ // special code to repeat the last column name (col > 1 as a precaution in case someone sets the first to ====)
    name = '(' + prefsStore.cols[prefsStore.cols.length-2].title + ')' // use name from one before
  }
  return name
}

function rowControlsCell(row){
  var result = document.createElement('th')
  result.setAttribute('class', 'rowHeader')
  result.setAttribute('id', 'row_'+row+'_0')
  // result.setAttribute('onmouseover','showRowControls('+row+')')
  // result.setAttribute('onmouseout', 'hideRowControls('+row+')')
  result.innerHTML = rowControls(row)
  return result
}

function rowControls(row){
  var newRowControl = '<div id="rowNum_'+row+'" class="rowNumber">'+row+'</div>'
  newRowControl += '<span id="row_'+row+'_controls" class="rowControls">'
  newRowControl += '<div id="row_'+row+'_addAbove" class="addAbove miniBtn" onclick="addRow('+row+')">+</div>'
  newRowControl += '<br>'
  newRowControl += '<div  id="row_'+row+'_remove" class="removeRow miniBtn" onclick="deleteRow('+row+')">-</div>'
  newRowControl += '</span>'
  newRowControl += '<div id="selectAreaRow_'+row+'" class="selectAreaRow" onmouseup="selectRow(event, '+row+')">&nbsp;</div>'
  return newRowControl
}

function tableData(row, col){
  var result = newElement('td',{id: 'dataCell_'+row+'_'+col, class: 'dataCell', dataCellRow: row, dataCellCol: col, ondrop:"dropHandler(this, event)", ondragover: 'dragOverHandler(this, event)', ondragleave: 'dragLeaveHandler(this, event)'})
  result.appendChild(inputCellText(row, col))
  result.appendChild(inputCellExtension(row,col))
  result.appendChild(inputCellFile(row,col))
  result.appendChild(inputCellMore(row, col))
  // result.appendChild(inputCellDragPlaceholder())
  return result
}

function inputCellText(row, col){
  let result = newElement('input', properties = {    
    id:`inputCellText_${row}_${col}`,
    dataRow: row,
    dataCol: col,
    class: 'inputCellText',
    type: 'text',
    onkeydown: 'inputCellTextKey(event, parseInt(this.getAttribute(\'data-row\')), parseInt(this.getAttribute(\'data-col\')))',
    onchange: 'updateHoverAndView(this)',
    onpaste: 'pasteInData(event,parseInt(this.getAttribute(\'data-row\')),parseInt(this.getAttribute(\'data-col\')))'
  })
  // old version:
  // var result = '<input id="inputCellText_'+row+'_'+col+'" data-row='+row+' data-col='+col+' class="inputCellText" type="text" onkeydown="inputCellTextKey(event, parseInt(this.getAttribute(\'data-row\')), parseInt(this.getAttribute(\'data-col\')))" onchange="updateHoverAndView(this)" onpaste="pasteInData(event,parseInt(this.getAttribute(\'data-row\')), parseInt(this.getAttribute(\'data-col\')))">';
  return result;
}

function inputCellFile(row,col){
  let result = newElement('div',properties = {
    id:`inputCellFile_${row}_${col}`,
    class: 'inputCellFile hidden'
  })
  if(!colAcceptsDataType(col,'image')){
    result.classList.add('disabled')
  }
  return result
}

function inputCellMore(row, col){
  return newElement('button',{class: 'inputCellMore', onclick: 'toggleCellExtension(this.parentElement)'},'⋮')
}

function inputCellExtension(row,col){
  let result = newElement('div',{id: `inputCellExtension_${row}_${col}`, class:'inputCellExtension hidden'})
  result.appendChild(inputCellTextMirror(row,col))
  result.appendChild(inputCellImageSelector(row,col))
  return result
}

function dragPlaceholder(){
  return newElement('div',{id: 'dragPlaceHolder', class: 'dragPlaceholder hidden'},icons.image)
}

function inputCellTextMirror(row, col){
  return newElement('textarea',{id: `inputCellTextMirror_${row}_${col}`, class:'inputCellTextMirror',onchange:'updateTextFromMirror(this)',onkeydown:'adjustMirrorHeight(this)'})
}

function inputCellImageSelector(row,col){
  let result = newElement('button',{id: `inputCellImageSelector_${row}_${col}`, class:'inputCellImageSelector',onclick:'importImage(this.parentElement.parentElement)'},icons.image)
  if(!colAcceptsDataType(col,'image')){
    result.disabled = true
  }
  return result
}

// check data types for all columns, then enable or disable accordingly
// for now this only does anything for images
function checkDataTypeCols(){
  for (let r = 1; r <= numRows; r++){
    for (let c = 1; c <= numCols; c++){
      enableDisableImageElements(r,c)
    }
  }
}

// enable or disable image selector button and file holder according to activity prefs
function enableDisableImageElements(row,col){
  if (colAcceptsDataType(col,'image')){
    document.getElementById(`inputCellImageSelector_${row}_${col}`).disabled = false
    document.getElementById(`inputCellFile_${row}_${col}`).classList.remove('disabled')
  } else {
    document.getElementById(`inputCellImageSelector_${row}_${col}`).disabled = true
    document.getElementById(`inputCellFile_${row}_${col}`).classList.add('disabled')
  }
}

// check whether column accepts a data type
function colAcceptsDataType(col,types){
  if(typeof types == 'string'){
    types = [types]
  }
  let result = false
  types.forEach(type =>{
    if(prefsStore.hasOwnProperty('cols') && prefsStore.cols.length >= col && prefsStore.cols[col-1][type]){
      result = true
    } else {
      result = false
      return false
    }
  })
  return result
}

function toggleCellExtension(cell,forceOpen=false,updateRowHeaders=true){
  let extension = cell.querySelector('.inputCellExtension')
  let text = cell.querySelector('.inputCellText')  
  if(forceOpen || extension.classList.contains('hidden')){
    cell.classList.add('expanded')
    extension.classList.remove('hidden')
    text.classList.add('hidden')
    // prepare mirror:    
    let mirror = extension.querySelector('.inputCellTextMirror')
    if (text.value == '' && cell.classList.contains('withPreview') && colAcceptsDataType(text.getAttribute('data-col'), 'image')){ // if no text, but there is an image, we won't bother with the mirror
      mirror.classList.add('hidden')
    } else {
      mirror.classList.remove('hidden')
      mirror.value = text.value.replaceAll('\\n','\n')
      adjustMirrorHeight(mirror)    
    }   
  } else {
    cell.classList.remove('expanded')
    extension.classList.add('hidden')
    text.classList.remove('hidden')
  }
  // if(updateRowHeaders){
  //   updateRowHeadersForExpanded()
  // }
}

function toggleCellExtensionCol(col){
  
  let forceOpen = false

  // if at least one cell extension in the column is closed, we'll show all of them
  for(let row=1; row<=numRows && !forceOpen; row++){
    let cell = document.getElementById(`dataCell_${row}_${col}`)
    if (!cell.classList.contains('expanded')){
      forceOpen = true
    }
  }
  
  for(let row=1; row<=numRows; row++){
    toggleCellExtension(document.getElementById(`dataCell_${row}_${col}`), forceOpen,false)
  }
  // updateRowHeadersForExpanded()
}

// function updateRowHeadersForExpanded(){
//   for(let row = 1; row < numRows; row++){
//     if(rowContainsExtension(row)){
//       document.getElementById(`row_${row}_0`).classList.add('withExpanded')
//     } else {
//       document.getElementById(`row_${row}_0`).classList.remove('withExpanded')
//     }
//   }
// }

// function rowContainsExtension(row){
//   for(let col = 1; col < numCols; col++){
//     if(document.getElementById(`dataCell_${row}_${col}`).classList.contains('expanded')){
//       return true
//     }
//   }
//   return false
// }

//// realised it wasn't necessary to do the rowHeader stuff. Leaving it here for now just in case!

function updateHoverAndView(el){
  el.setAttribute('title',el.value)
  if (el.classList.contains('invalid')){
    el.classList.remove('invalid')
  }
  if (el.classList.contains('hidden')){
    let mirror = document.getElementById(el.id.replace('Text','TextMirror'))
    mirror.value = el.value.replaceAll('\\n','\n')
  }
}

function updateTextFromMirror(el){
  let inputCellText = document.getElementById(el.id.replace('Mirror',''))
  inputCellText.value = el.value.replaceAll('\n','\\n')
  // also adjust the height
}

function adjustMirrorHeight(el){
  el.style.height = null
  el.style.height = (el.scrollHeight)+25+"px"
}

function selectCol(e, col){
  // console.log(e.getModifierState('Meta'))
  if (e.getModifierState('Meta') || e.getModifierState('Control')){ // add mode
    var cols = lastSelection.col
    if (!cols.includes(col)){
      cols.push(col)
      selectionProxy.col = cols
    } else { // if already selected, remove from selection
      indexOfCol = cols.indexOf(col)
      cols.splice(indexOfCol, 1)
      selectionProxy.col = cols
    }
    lastSelection = { ...selection};
  } else if (e.getModifierState('Shift')) { // add range mode
    // console.log('add range mode')
    if (col > lastSelection.col[0]){ // if it's higher than the first one
      var cols = [lastSelection.col[0]] // take first col as new array
      for (let i=cols[0]+1; i<=col; i++){ // from next col from first selected to col just selected now
        cols.push(i)
      }
    } else {
      var cols = [lastSelection.col[lastSelection.col.length-1]] // take highest col as new array
      for (let i=cols[0]; i>=col; i--){ // from highest col selected down to col just selected
        cols.push(i)
        // console.log('adding ' + i)
      }
    }
    selectionProxy.col = cols
    lastSelection = { ...selection};
  } else {
    if (lastSelection.col != col){
      selectionProxy.col = [col]
      lastSelection = { ...selection};
    } else {
      deselectCol(col) // deselect col when clicking a second time
    }
  }
  if (selection.col.length > 0){
    document.body.addEventListener('keydown', handleKeyDownWithSelection)
    document.body.addEventListener('copy', handleCopyWithSelection)
    document.body.addEventListener('cut', handleCutWithSelection)
  }
}

function deselectCol(col){
  var indexOfCol = selection.col.indexOf(col)
  selectionProxy.col.splice(indexOfCol, 1)
  lastSelection = { ...selection}
}

function selectRow(e, row){
  console.log(e.getModifierState('Meta'))
  if (e.getModifierState('Meta') || e.getModifierState('Control')){
    var rows = lastSelection.row
    if (!rows.includes(row)){
      rows.push(row)
      selectionProxy.row = rows
    } else { // if already selected, remove from selection
      indexOfRow = rows.indexOf(row)
      rows.splice(indexOfRow, 1)
      selectionProxy.row = rows
    }
    lastSelection = { ...selection};
  } else if (e.getModifierState('Shift')) { // add range mode // TO DO: At the moment this only works if you select a lower and then a higher row, not the other way around
    // console.log('add range mode')
    if (row > lastSelection.row[0]){ // if it's higher than the first one
      var rows = [lastSelection.row[0]] // take first row as new array
      for (let i=rows[0]+1; i<=row; i++){ // from next row from first selected to row just selected now
        rows.push(i)
      }
    } else {
      var rows = [lastSelection.row[lastSelection.row.length-1]] // take last row as new array
      for (let i=rows[0]; i>=row; i--){ // from highest row selected down to row just selected
        rows.push(i)
        // console.log('adding ' + i)
      }
    }
    selectionProxy.row = rows
    lastSelection = { ...selection};
  } else {
    if (lastSelection.row != row){
      selectionProxy.row = [row]
      lastSelection = { ...selection};
    } else {
      deselectRow(row) // deselect row when clicking a second time
    }
  }
  if (selection.row.length > 0){
    document.body.addEventListener('keydown', handleKeyDownWithSelection)
    document.body.addEventListener('copy', handleCopyWithSelection)
    document.body.addEventListener('cut', handleCutWithSelection)
  }
}

function deselectRow(row){
  var indexOfRow = selection.row.indexOf(row)
  selectionProxy.row.splice(indexOfRow, 1)
  lastSelection = { ...selection}
}

function deselectAll(){
  selectionProxy.col = []
  selectionProxy.row = []
  // console.log('Deselect')
  document.body.removeEventListener('keydown', handleKeyDownWithSelection)
  document.body.removeEventListener('copy', handleCopyWithSelection)
  document.body.removeEventListener('cut', handleCutWithSelection)
}

function handleKeyDownWithSelection(e){
  // console.log(e.getModifierState('Control'))
  if (e.key == 'Delete' || (e.key == 'Backspace' && (e.getModifierState('Control') || e.getModifierState('Meta')))){
    if (selection.row.length > 0){
      rowsToDel = selection.row
      for (let i = rowsToDel.length-1; i >= 0; i--){ // go backwards so when we delete a row it doesn't change the numbering
        deleteRow(rowsToDel[i])
      }
      deselectAll()
      lastSelection = { ...selection};

    } else if (selection.col.length > 0){
      colsToDel = selection.col
      for (let i = colsToDel.length-1; i >= 0; i--){
        deleteCol(colsToDel[i])
      }
      deselectAll()
      lastSelection = { ...selection};
    }
  } else if (e.key == 'Backspace'){
    if (selection.row.length > 0){
      for (let i = 0; i < selection.row.length; i++){
        clearRow(selection.row[i])
      }
    } else if  (selection.col.length > 0){
      for (let i = 0; i < selection.col.length; i++){
        clearCol(selection.col[i])
      }
    }
  } //else if (e.key == 'KeyC' && (e.getModifierState('Control') || (e.getModifierState(''))))
}

function handleCopyWithSelection(e){
  e.preventDefault();
  var toCopy = ''
  if(selection.row.length > 0){
    for (let i=0; i<selection.row.length; i++){
      for (let col=1; col<=numCols; col++){
        toCopy += document.getElementById('inputCellText_'+selection.row[i]+'_'+col).value + '\t'
      }
      toCopy = toCopy.trim()
      toCopy += '\n'
    }
    toCopy = toCopy.trim()
    navigator.clipboard.writeText(toCopy);
    console.log('Copy '+toCopy)
  } else if (selection.col.length > 0){
    for (let row=1; row<=numRows; row++){
      for (let i=0; i<selection.col.length; i++){
        toCopy += document.getElementById('inputCellText_'+row+'_'+selection.col[i]).value + '\t'
      }
      toCopy = toCopy.trim()
      toCopy += '\n'
    }
    toCopy = toCopy.trim()
    navigator.clipboard.writeText(toCopy);
    console.log('Copy '+toCopy)
  }
}

function handleCutWithSelection(e){
  handleCopyWithSelection(e);
  if(selection.row.length > 0){
    for (let row=selection.row[0]; row<=selection.row.slice(-1); row++){
      clearRow(row)
    }
  } else if (selection.col.length > 0){
    for (let row=selection.col[0]; row<=selection.col.slice(-1); col++){
      clearCol(col)
    }
  }
}

function resortSelection(key){
  if (key == 'col' && selection.col.length > 0){
    selection.col = selection.col.sort(function(a, b) {
      return a - b; // need this bit or it will sort 10 before 9 (i.e. fail to sort integers above 9)
    });
  } else if (key == 'row' && selection.row.length > 0){
    selection.row == selection.row.sort(function(a, b) {
      return a - b; // need this bit or it will sort 10 before 9 (i.e. fail to sort integers above 9)
    });
  }
}

function updateAppearanceForSelection(key,value){
  if (value.length > 0){
    var cell
    var selectArea
    if (key == 'col'){
      for (let i=0; i<value.length; i++){
        // header = document.getElementById('col_0_'+value[i])
        // header.classList.add('selected')
        var selectArea = document.getElementById('selectAreaCol_'+value[i])
        selectArea.classList.add('selected')
        for (let j=1; j<=numRows; j++){
          cell = document.getElementById('dataCell_'+j+'_'+value[i])
          input = document.getElementById('inputCellText_'+j+'_'+value[i])
          cell.classList.add('selected')
          input.classList.add('selected')
        }
      }
    } else if (key == 'row') {
      for (let i=0; i<value.length; i++){
        var selectArea = document.getElementById('selectAreaRow_'+value[i])
        selectArea.classList.add('selected')
        // header = document.getElementById('row_'+value[i]+'_0')
        // header.classList.add('selected')
        for (let j=1; j<=numCols; j++){
          cell = document.getElementById('dataCell_'+value[i]+'_'+j)
          input = document.getElementById('inputCellText_'+value[i]+'_'+j)
          cell.classList.add('selected')
          input.classList.add('selected')
        }
      }
    }
  } else {
    selectedElements = document.querySelectorAll('.selected')
    for (let i=0; i<selectedElements.length; i++){
      selectedElements[i].classList.remove('selected')
    }
  }
}

function updateAppearanceForUnused(){
  let currentUnused = document.querySelectorAll('.unused')
  for (let i=0; i<currentUnused.length; i++){
    currentUnused[i].classList.remove('unused')
  }
  if (prefsStore.hasOwnProperty('cols_max') && numCols > prefsStore.cols_max){
    var colName
    var inputCellText
    for (let col = prefsStore.cols_max+1; col<=numCols; col++){
      colName = document.getElementById('colName_'+col)
      colName.classList.add('unused')
      for (let row = 1; row <= numRows; row++){
        inputCellText = document.getElementById('inputCellText_'+row+'_'+col)
        inputCellText.classList.add('unused')
      }
    }
  }
  if (prefsStore.hasOwnProperty('rows_max') && numRows > prefsStore.rows_max){
    var rowNumber
    var inputBox
    for (let row = prefsStore.rows_max+1; row<=numRows; row++){
      rowNumber = document.getElementById('rowNum_'+row)
      rowNumber.classList.add('unused')
      for (let col = 1; col <= numCols; col++){
        inputCellText = document.getElementById('inputCellText_'+row+'_'+col)
        inputCellText.classList.add('unused')
      }
    }
  }
}

function swapData(col1, col2) {
  for (let row = 1; row <= numRows; row++) {

    // swap text values
    let cell1 = document.getElementById('inputCellText_' + row + '_' + col1)
    let cell2 = document.getElementById('inputCellText_' + row + '_' + col2)
    let cell1Hold = cell1.value
    let cell2Hold = cell2.value
    cell1.value = cell2Hold
    cell2.value = cell1Hold

    // swap files
    let file1 = document.getElementById('inputCellFile_' + row + '_' + col1)
    let file2 = document.getElementById('inputCellFile_' + row + '_' + col2)
    let file1Hold = file1.innerHTML
    let file2Hold = file2.innerHTML
    let file1Hidden = file1.classList.contains('hidden')
    let file2Hidden = file2.classList.contains('hidden')
    file1.innerHTML = file2Hold
    file2.innerHTML = file1Hold
    if(file1Hidden){
      file2.classList.add('hidden')
      document.getElementById('dataCell_' + row + '_' + col2).classList.remove('withPreview')
    } else {
      file2.classList.remove('hidden')
      document.getElementById('dataCell_' + row + '_' + col2).classList.add('withPreview')
    }
    if(file2Hidden){
      file1.classList.add('hidden')
      document.getElementById('dataCell_' + row + '_' + col1).classList.remove('withPreview')
    } else {
      file1.classList.remove('hidden')
      document.getElementById('dataCell_' + row + '_' + col1).classList.add('withPreview')
    }

    //swap attributes for td (notably .withPreview)
    // let td1 = document.getElementById('dataCell_' + row + '_' + col1)
    // let td2 = document.getElementById('dataCell_' + row + '_' + col2)
    // let td1Class = td1.getAttribute('class') // disabled, hidden etc.
    // let td2Class = td2.getAttribute('class')
    // td1.setAttribute('class', td2Class)
    // td2.setAttribute('class', td1Class)

  }
}

function addImageToCell(cellID,fileStoreItem){
  let fileHolder = document.getElementById(cellID).querySelector('.inputCellFile')
  if (fileHolder){
    let imagePreview = newElement(fileStoreItem.ext == 'svg' ? 'div' : 'img',{
      class: 'dataImagePreview',
      onclick: 'showDeleteFileButton(this.parentElement)',
      dataExt: fileStoreItem.ext,
      dataFileSize: fileStoreItem.fileSize,
      dataType: fileStoreItem.type
    })
    if (fileStoreItem.ext == 'svg'){
      // put SVG in, keep a copy in the div
      imagePreview.innerHTML = atob(fileStoreItem.data)
      imagePreview.setAttribute('data-src',`data:image/${fileStoreItem.ext};base64, ${fileStoreItem.data}`)
      // fileHolder.innerHTML = `<div class='dataImagePreview' data-src="data:image/${fileStoreItem.ext};base64, ${fileStoreItem.data}" onclick="showDelete(this.parentElement)">${atob(fileStoreItem.data)}</div>`
      } else {
        // for png etc. just use base64
        imagePreview.src = `data:image/${fileStoreItem.ext};base64, ${fileStoreItem.data}`
        // fileHolder.innerHTML = `<img class='dataImagePreview' src="data:image/${fileStoreItem.ext};base64, ${fileStoreItem.data}"></img>`
      }    
      imagePreview.style.aspectRatio = fileStoreItem.dimensions.width + '/' + fileStoreItem.dimensions.height    
    if (fileStoreItem.hasOwnProperty('dimensions')){
      imagePreview.setAttribute('data-width', fileStoreItem.dimensions.width)
      imagePreview.setAttribute('data-height', fileStoreItem.dimensions.width) 
    }
    
    let deleteBtn = newElement('button', {class: 'fileDeleteBtn hidden', onclick: 'deleteFile(this.parentElement)'},'×')

    fileHolder.innerHTML = '' // remove any existing files
    fileHolder.appendChild(imagePreview)
    fileHolder.appendChild(deleteBtn)
    fileHolder.classList.remove('hidden') 
    fileHolder.parentElement.classList.add('withPreview')

    let inputCellTextMirror = document.getElementById(cellID).querySelector('.inputCellTextMirror')
    if (inputCellTextMirror && inputCellTextMirror.value == ''){
      inputCellTextMirror.classList.add('hidden')
    }
  }
}

function showDeleteFileButton(cell){
  let btn = cell.querySelector('.fileDeleteBtn')

  if (btn.classList.contains('hidden')){
      // hide again when clicking anywhere   
    setTimeout(function(){    
      document.body.addEventListener('click',function(){
        btn.classList.add('hidden')
      },{once: true}) 
    },10) 
  }

  btn.classList.remove('hidden')
}

function deleteFile(inputFileCell){
  inputFileCell.innerHTML = ''
  inputFileCell.parentElement.classList.remove('withPreview')
  inputFileCell.classList.add('hidden')

  // in case the cell is extended, unhide the text mirror (if it was hidden)
  let mirror = inputFileCell.parentElement.querySelector('.inputCellTextMirror')
  if(mirror){
    mirror.classList.remove('hidden')
  }
}

function dropHandler(cell, e){
  e.preventDefault()
  console.log(e)
  console.log(cell)

  let files = []

  if (e.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    [...e.dataTransfer.items].forEach((item, i) => {
      // If dropped items aren't files, reject them
      if (item.kind === "file") {
        const file = item.getAsFile();
        console.log(`… file[${i}].name = ${file.name}`);      
        files.push(file)          
      }
    });
  } else {
    // Use DataTransfer interface to access the file(s)
    [...e.dataTransfer.files].forEach((file, i) => {
      console.log(`… file[${i}].name = ${file.name}`);
      files.push(file)
    });
  }

  // TO DO: import multiple images
  if(files[0].type.includes('image')){
    importImage(cell,files[0].path)
  }

  dragLeaveHandler(cell, e)
}

function dragOverHandler(cell, e){
  let placeHolder = document.getElementById('dragPlaceHolder')
  let cellPos = cell.getBoundingClientRect()
  placeHolder.style.top = `calc(${cellPos.top}px + 0.25em)`
  placeHolder.style.left = `calc(${cellPos.left}px + 0.25em)`
  placeHolder.style.height = `calc(${cellPos.height}px - 1.5em)`
  placeHolder.style.width = `calc(${cellPos.width}px - 1.5em)`
  placeHolder.classList.remove('hidden')
  document.body.appendChild(placeHolder)
}

function dragLeaveHandler(cell, e){
  let placeHolder = document.getElementById('dragPlaceHolder')
  placeHolder.classList.add('hidden')
}

function pasteInData(e, row, col){  
  let clipboardData = e.clipboardData || window.clipboardData;
  let pastedData = clipboardData.getData('Text');
  var dataAsArray = returnJSONorArray(pastedData)

  // only continue pasting in data if there is more than one row and/or more than one column. Otherwise, paste as normal (text rather than data)
  // - this allows users to paste a few characters into a cell without replacing that entire cell
  if (dataAsArray.length > 1 || (dataAsArray.length > 0 && dataAsArray[0].length > 1)){
    e.stopPropagation();
    e.preventDefault();
    convertArrayToTableData(dataAsArray,row,col)
  }
  // could use e.target or e.srcElement to get row and col instead (something to think about…)
}

function returnJSONorArray(dataBlock){

  // try to parse as JSON, otherwise assume it's tabbed
  try {
    dataAsArray = JSON.parse(dataBlock.trim())
  }
  catch { // if that fails, assume it is tabbed
    dataAsArray = convertTextBlockToArray(dataBlock)
  }

  return dataAsArray
}

function isJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

function inputCellTextKey(e, row, col){
  // console.log('key press ' + e.key + ' at ' + row + ', ' + col)
  var charPos = e.target.selectionStart;
  var strLength = e.target.value.length;
  var colToChoose = 1;
  if (!e.isComposing){　// don't do anything if we're composing (e.g in Japanese)
    if (e.key == 'Backspace' || e.key == 'Delete'){
      rowEl = document.getElementById('row_'+row)
      allBlank = true
      for (let i=1; i<rowEl.children.length-1; i++){ // check all except last col (where plus button is)
        if (rowEl.children[i].children[0].value != ''){
          allBlank = false
        }
      }
      if (allBlank){
        e.preventDefault();
        deleteRow(row)
      }
    } else if (e.key == 'Enter' || e.key == 'ArrowDown' || (e.key == 'Tab' && row == numRows && col == numCols)){ // tab only when in the last cell
      e.preventDefault();
      if (row < numRows){
        if (e.key == 'Enter' || e.key == 'Tab'){
          colToChoose = 1 // always go back to first col with enter or tab
        } else {
          colToChoose = col
        }
        newFocusId = 'inputCellText_'+(row+1)+'_'+colToChoose
        newFocus = document.getElementById(newFocusId)
        newFocus.focus()
      } else if (e.key == 'Enter' || e.key == 'Tab') {
        addRow(row+1) // add row after
        newFocusId = 'inputCellText_'+(row+1)+'_1' // always go back to first col with enter
        newFocus = document.getElementById(newFocusId)
        newFocus.focus()
      }
    } else if (e.key == 'ArrowUp' && row > 1){
        newFocusId = 'inputCellText_'+(row-1)+'_'+col
        newFocus = document.getElementById(newFocusId)
        newFocus.focus()
    } else if (e.key == 'ArrowLeft' && col > 1 && charPos == 0){
        e.preventDefault();
        newFocusId = 'inputCellText_'+row+'_'+(col-1)
        newFocus = document.getElementById(newFocusId)
        newFocus.focus()
    } else if (e.key == 'ArrowRight' && col < numCols && charPos == strLength) {
        e.preventDefault();
        newFocusId = 'inputCellText_'+row+'_'+(col+1)
        newFocus = document.getElementById(newFocusId)
        newFocus.focus()
    } else if (e.key == 'Tab' && e.getModifierState('Alt')){
      e.preventDefault();
      if (e.getModifierState('Shift')){
        deleteCol(col) // only if empty??
        newFocusId = 'inputCellText_'+row+'_'+(col-1)
        newFocus = document.getElementById(newFocusId)
        newFocus.focus()
      } else {
        addCol(col+1)
        newFocusId = 'inputCellText_'+row+'_'+(col+1)
        // console.log(newFocusId)
        newFocus = document.getElementById(newFocusId)
        newFocus.focus()
      }
    }
  }
}

function getFilesFromCell(row, col){
  let inputFileCell = document.getElementById(`inputCellFile_${row}_${col}`)
  let inputFile = inputFileCell.children[0]
  if(inputFileCell.classList.contains('disabled') || inputFileCell.classList.contains('hidden')){
    return null
  } else {
    let file = {}
    file.type = inputFile.getAttribute('data-type')
    file.ext = inputFile.getAttribute('data-ext')
    file.fileSize = inputFile.getAttribute('data-file-size')
    if (file.type == 'image'){
      file.dimensions = {height: inputFile.getAttribute('data-height'), width: inputFile.getAttribute('data-width')}
      if(file.ext == 'svg'){
        file.data = inputFile.getAttribute('data-src').replace('data:image/svg;base64, ','')
      } else {
        file.data = inputFile.getAttribute('src').replace(`data:image/${file.ext};base64, `,'')
      }
    } else {
      console.log('Other file types not yet supported.')
  }

  // at the moment this just exports one type, so it will need to be expanded

  let files = {}
  files[file.type] = file

  return files

  }
}

function convertArrayToTableData(array, startRow = 1, startCol = 1){
  var inputCellText
  for (let row=startRow; row<(startRow+array.length); row++){
    if (!document.getElementById('row_'+row)){ // if there isn't a row
      addRow(row) // add one
    }
    for (let col=startCol; col<(startCol+array[row-startRow].length); col++){
      if (!document.getElementById('dataCell_'+row+'_'+col)){ // if there isn't a col
        addCol(col) // add one
      }
      // put the data in the inputCellText
      inputCellText = document.getElementById('inputCellText_'+row+'_'+col)
      if(typeof array[row-startRow][col-startCol] == 'string'){
        inputCellText.value = array[row-startRow][col-startCol]
      } else {
        inputCellText.value = array[row-startRow][col-startCol].text
        if (array[row-startRow][col-startCol].hasOwnProperty('image')){
          addImageToCell('dataCell_'+row+'_'+col,array[row-startRow][col-startCol].image) 
        }
      }
      
      updateHoverAndView(inputCellText) // onchange won't be fired, so we'll do it manually here
    }
  }
}

function convertTableDataToArray(startRow = 1, startCol = 1, endRow = numRows, endCol = numCols, santizeHTML=false, includeFiles = true){
  var rowsArray = []
  var colsArray = []
  for (let row=startRow; row<=endRow; row++){
    colsArray = []
    for (let col=startCol; col<=endCol; col++){
      let cell = document.getElementById('inputCellText_'+row+'_'+col).value

      if (santizeHTML){
        cell = cell.replaceAll('<','&lt;').replaceAll('>','&gt;')
      }

      // transform cell from string to object if we're expecting files alongside text
      if(includeFiles && (colAcceptsDataType(col, ['image'] || colAcceptsDataType(col, ['sound'])))){ // add new file types here if relevant
        cell = {text: cell}
        // add properties for all relevant file types (these will be left null if no file has been added)
        for (const type in prefsStore.cols[col]) {
          if (prefsStore.cols[col][type] && type != 'text' && type != 'title') { // skip text (already added) and title (not necessary)
            cell[type] = null;
          }
        }
        // get files and fill in cell object
        let files = getFilesFromCell(row, col)
        if(files){
          for (const type in files) {
            cell[type] = files[type]
          }
        }        
      }

      colsArray.push(cell)
    }
    rowsArray.push(colsArray)
  }
  return rowsArray
}

function convertTableToTrimmedArray(santizeHTML=false,includeFiles=false){
  var endRow = numRows
  var endCol = numCols
  var inputArray = []

  // get data from table, excluding later rows and cols if there's a max
  if (prefsStore.hasOwnProperty('rows_max') && prefsStore.rows_max < numRows){
    endRow = prefsStore.rows_max
  }
  if (prefsStore.hasOwnProperty('cols_max') && prefsStore.cols_max < numCols){
    endCol = prefsStore.cols_max
  }
   inputArray = convertTableDataToArray(1,1,endRow,endCol,true,includeFiles)

   // get rid of trailing empty rows (don't bother with the first row, so as to not risk passing something empty)
   for (let row = inputArray.length-1; row>0; row--){     
     if (isNotEmptyRow(row,inputArray)){
       row = 0 // as soon as we've found a non-empty row, stop looking
     } else {
       inputArray.pop(); // we should always be on the last row, so delete it if it's empty
     }
   }
   return inputArray;
}

// TO DO: move the "checking" parts of this function to a new function - this one will later just be used for exporting to clipboard or text
function convertTableDataToBlock(){
  var furthestCol = determineFurthestCol()
  var furthestRow = determineFurthestRow()
  var textBlock = ''
  if (prefsStore.hasOwnProperty('cols_max') && furthestCol > prefsStore.cols_max){
    furthestCol = prefsStore.cols_max
  }
  if (prefsStore.hasOwnProperty('rows_max') && furthestRow > prefsStore.rows_max){
    furthestRow = prefsStore.rows_max
  }
  for (let row=1; row<=furthestRow; row++){
    for (let col=1; col<=furthestCol; col++){
      textBlock += document.getElementById('inputCellText_'+row+'_'+col).value
      textBlock += '\t'
    }
    textBlock = textBlock.trim()
    textBlock += '\n'
  }
  return textBlock.trim()
}

function convertTableDataToJSONString(){
  let obj = convertTableDataToArray()
  return JSON.stringify(obj)
}

function convertTextBlockToArray(textBlock){  //previous known as inputToArray
  var data = [];
  let textBlockSplit = textBlock.split(/\r?\n/);
  for (i=0;i<textBlockSplit.length;i++){
    data.push(textBlockSplit[i].split(/\t/))
  }
  return data
}

function determineFurthestCol(){
  for (let i=numCols; i>=1; i--){
    if (!isEmptyCol(i)){
      return i
    }
  }
  return 0
}

function determineFurthestRow(){
  for (let i=numRows; i>=1; i--){
    if (!isEmptyRow(i)){
      return i
    }
  }
  return 0
}


function isEmptyRow(row){
  for(let i=1; i<=numCols; i++){
    var inputCellText = document.getElementById('inputCellText_'+row+'_'+i)
    var inputCellFile = document.getElementById('inputCellFile_'+row+'_'+i)
    if (inputCellText.value != '' || !inputCellFile.classList.contains('hidden')){
      return false
    }
  }
  return true
}

function isNotEmptyRow(row,inputArray = convertTableDataToArray()){
     for (let col = inputArray[row].length-1; col>=0; col--){
       if ((typeof inputArray[row][col] == 'string' && inputArray[row][col] != '') || (typeof inputArray[row][col] == 'object' && (inputArray[row][col].text != '' || inputArray[row][col].hasOwnProperty('image')))){
         return true
       }
     }
     return false
}

function isEmptyCol(col){
  for(let i=1; i<=numRows; i++){
    var inputCellText = document.getElementById('inputCellText_'+i+'_'+col)
    var inputCellFile = document.getElementById('inputCellFile_'+i+'_'+col)
    if (inputCellText.value != '' || !inputCellFile.classList.contains('hidden')){
      return false
    }
  }
  return true
}

function rowContainsEmptyCell(row){
  for(let i=1; i<=numCols; i++){
    var inputCellText = document.getElementById('inputCellText_'+row+'_'+i)
    if (inputCellText.value = ''){
      return true
    }
  }
  return false
}

function colContainsEmptyCell(col){
  for(let i=1; i<=numRows; i++){
    var inputCellText = document.getElementById('inputCellText_'+i+'_'+col)
    if (inputCellText.value = ''){
      return true
    }
  }
  return false
}

function tableIsEmpty(){
  var inputCellTexts = document.querySelectorAll('.inputCellText')
  for(let i=0; i<inputCellTexts.length;i++){
    if (inputCellTexts[i].value != ''){
      return false
    }
  }
  var inputCellFiles = document.querySelectorAll('.inputCellFile')
  for(let i=0; i<inputCellFiles.length;i++){
    if (!inputCellFiles[i].classList.contains('hidden')){
      return false
    }
  }
  return true // if it's not returned false at any point, it must be true
}




/// For general use (not part of the table manager - move to a different file??)

function newElement(tag, properties = {}, innerHTML = '') {
  let el = document.createElement(tag)
  for (const property in properties) {
      let propertyName = property.replaceAll(/([A-Z])/g, '-$1').toLowerCase() // change camel case to - seperation
      el.setAttribute(propertyName, properties[property])
  }
  if (typeof innerHTML == 'string') {
      el.innerHTML = innerHTML
  } else {
      el.appendChild(innerHTML)
  }
  return el
}