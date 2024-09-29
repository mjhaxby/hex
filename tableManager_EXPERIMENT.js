const TableManager = function(){

  //GLOBAL VARS
  
  this.numRows = 0 // first one will be added
  this.numCols = 2
  // var colWidth = 'half'
  selection = {col: [], row: []}
  lastSelection = {col: [], row: []}
  selectionProxy = new Proxy(selection, {
    set: function (target, key, value) {
        // console.log(`${key} selection set to ${value}`);
        target[key] = value;
        resortSelection(key)
        updateAppearanceForSelection(key, value)
        return true;
    }
  });
  
  this.this.hideRowControls = function (row){
    let rowEl = document.getElementById('row_'+row+'_controls')
    rowEl.style.opacity = 1
  }
  
  hideRowControls = function (row){
    let rowEl = document.getElementById('row_'+row+'_controls')
    rowEl.style.opacity = ''
  }
  
  showColControls = function (col){
    let addEl = document.getElementById('col_'+col+'_addBefore')
    let removeEl = document.getElementById('col_'+col+'_remove')
    addEl.style.opacity = 1
    removeEl.style.opacity = 1
  }
  
  hideColControls = function (col){
    let addEl = document.getElementById('col_'+col+'_addBefore')
    let removeEl = document.getElementById('col_'+col+'_remove')
    addEl.style.opacity = ''
    removeEl.style.opacity = ''
  }
  
  this.addRow = function(position){
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
  
  deleteRow = function (position){
    if (numRows > 1){
      tableBody = document.getElementById('tableBody')
      currentFocus = document.activeElement
      if (currentFocus.getAttribute('class') == 'inputCell'){
        newFocusId = currentFocus.id.replace(/inputCell_\d+_(\d+)/, 'inputCell_'+(position-1)+'_$1')
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
  
  deleteCol = function (position){
    if (numCols > 1){
      tableBody = document.getElementById('tableBody')
      // change focus if necessary
      currentFocus = document.activeElement
      focusRegex = new RegExp('inputCell_\d+_'+position)
      if (focusRegex.test(currentFocus.id)){
        newFocusId = currentFocus.id.replace(/inputCell_(\d+)_\d+/, 'inputCell_$1_'+position-1)
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
      this.headerRow(numCols)
    } else { // if there's only one column, just empty it's contents
      for (let i=0;i<=numRows;i++){
        tableBody.children[i].children[position].children[0].value = ''
      }
    }
  }
  
  clearRow = function (position){
    var inputCells = document.querySelectorAll('input[data-row="'+position+'"]')
    for (let i=0; i<inputCells.length; i++){
      inputCells[i].value = ''
    }
  }
  
  clearCol = function (position){
    var inputCells = document.querySelectorAll('input[data-col="'+position+'"]')
    for (let i=0; i<inputCells.length; i++){
      inputCells[i].value = ''
    }
  }
  
  clearTable = function(){
    var inputCells = document.querySelectorAll('.inputCell')
    for (let i=0; i<inputCells.length; i++){
      inputCells[i].value = ''
    }
  }
  
  clearUnusedRowsFromEnd = function(){
    for (let row=numRows; row>1; row--){ // go backwards, leave the first row
      if(isEmptyRow(row)){
        deleteRow(row)
      } else {
        return // stop after finding the first non-empty row
      }
    }
  }
  
  clearUnusedColsFromEnd = function(){
    for (let col=numCols; col>1; col--){ // go backwards, leave the first row
      if(isEmptyCol(col)){
        deleteCol(col)
      } else {
        return // stop after finding the first non-empty row
      }
    }
  }
  
  renumberRow = function (oldNum,newNum){
    // might be better to simplify this by replacing each row with a duplicate of itself containing the same values (i.e. edit inputCell function etc. to take an optional value variable, which defaults to empty)
  
    row = document.getElementById('row_'+oldNum)
    rowNum = document.getElementById('rowNum_'+oldNum)
    rowNum.innerHTML = newNum
    rowNum.id = 'rowNum_'+newNum
    colHead = document.getElementById('row_'+oldNum+'_0')
    colHead.setAttribute('onmouseover','this.hideRowControls('+newNum+')')
    colHead.setAttribute('onmouseout','hideRowControls('+newNum+')')
    colHead.id = 'row_'+newNum+'_0'
    document.getElementById('row_'+oldNum+'_controls').id = 'row_'+newNum+'_controls'
    addAbove = document.getElementById('row_'+oldNum+'_addAbove')
    addAbove.setAttribute('onclick', 'this.addRow('+newNum+')')
    addAbove.id = 'row_'+newNum+'_addAbove'
    removeRow = document.getElementById('row_'+oldNum+'_remove')
    removeRow.setAttribute('onclick','deleteRow('+newNum+')')
    removeRow.id = 'row_'+newNum+'_remove'
    selectArea = document.getElementById('selectAreaRow_'+oldNum)
    selectArea.setAttribute('onmouseup','this.selectRow(event, '+newNum+')')
    selectArea.id = 'selectAreaRow_'+newNum
  
    // update the TDs
    for(let i=1; i<row.children.length; i++){
      row.children[i].id = 'dataCell_' + newNum + '_' + i
      // row.children[i].children[0].setAttribute('onkeydown', 'inputCellKey(event, '+newNum+', '+i+')')
      // row.children[i].children[0].setAttribute('onpaste','pasteInData(event, '+newNum+', '+i+')')
      row.children[i].children[0].setAttribute('data-row', newNum)
      row.children[i].children[0].id = 'inputCell_' + newNum + '_' + i
    }
    row.id = 'row_'+newNum
  }
  
  renumberCol = function (row,oldNum,newNum){
    updateCell = document.getElementById('dataCell_'+row+'_'+oldNum)
    updateCell.setAttribute('id','dataCell_'+row+'_'+newNum)
    updateCell.children[0].setAttribute('id','inputCell_'+row+'_'+newNum)
    updateCell.children[0].setAttribute('data-col', newNum)
    // updateCell.children[0].setAttribute('onkeydown','inputCellKey(event, '+row+', '+newNum+')')
    // updateCell.children[0].setAttribute('onpaste','pasteInData(event, '+row+', '+newNum+')')
  }
  
  this.addCol = function (position) {
  
    numCols++
  
    //we can maybe get rid of all this
    // if (numCols == 1){
    //   colWidth = 'whole'
    // } else if (numCols == 2){
    //   colWidth = 'half'
    // } else if (numCols == 3){
    //   colWidth = 'third'
    // } else {
    //   colWidth = 'quarter'
    // }
  
    // and this
    // allCells = document.getElementsByClassName('dataCell')
    // for (let i=0; i<allCells.length; i++){
    //   allCells[i].setAttribute('class', 'dataCell '+colWidth)
    //   allCells[i].setAttribute('class', 'dataCell '+colWidth)
    // }
  
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
    lastRow.insertBefore(this.addRowCell(),lastRow.children[position])
  
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
  
  tableRow = function (row, cols){
    newRow = document.createElement('tr')
    newRow.id = 'row_'+row
    newRow.appendChild(rowControlsCell(row))
    for(let col=1; col<=cols; col++){
      newRow.appendChild(tableData(row, col))
    }
    newRow.appendChild(this.addColCell())
    return newRow
  }
  
  this.addRowCell = function(){
    var newAddBottom = document.createElement('td')
    newAddBottom.innerHTML = '<div class="addBottom miniBtn" onclick="this.addRow(numRows+1)">+</div>'
    return newAddBottom
  }
  
  this.addColCell = function(){
    var result = document.createElement('td')
    result.setAttribute('class', 'this.addCol')
    result.innerHTML = result.innerHTML + '<div class="addRight miniBtn" onclick="this.addCol(numCols+1)">+</div>'
    return result
  }
  
  this.headerRow = function(cols){
    var tableBody = document.getElementById('tableBody')
    var firstRow = document.createElement('tr')
    firstRow.setAttribute('id','headerRow')
    firstRow.innerHTML = '<th class="numCol"></th>'
    for (let i=1;i<=cols;i++){
      firstRow.appendChild(colControlsCell(i))
    }
    var blankthis.addCol = document.createElement('th')
    blankthis.addCol.setAttribute('class','this.addCol')
    firstRow.appendChild(blankthis.addCol)
    tableBody.insertBefore(firstRow,tableBody.childNodes[1])
  }
  
  colControlsCell = function (col){
    var result = document.createElement('th')
    result.setAttribute('id','col_0_'+col)
    result.setAttribute('onmouseover','showColControls('+col+')')
    result.setAttribute('onmouseout','hideColControls('+col+')')
    result.innerHTML = colControls(col)
    return result
  }
  
  colControls = function (col){
    var colName = establishColName(col)
    var newColControl = ''
    if (col != 1){
      newColControl += swapButton(col)
    }
    newColControl += '<div id="col_'+col+'_addBefore" class="addBefore miniBtn" onclick="this.addCol('+col+')">+</div>'
    newColControl += '<div id="colName_'+col+'" class="colName">'+colName+'</div>'
    newColControl += '<div id="col_'+col+'_remove" class="removeCol miniBtn" onclick="deleteCol('+col+')">-</div>'
    newColControl += '<div id="selectAreaCol_'+col+'" class="selectAreaCol" title="'+colName+'" onmouseup="selectCol(event, '+col+')">&nbsp;</div>'
    return newColControl
  }
  
  swapButton = function (col){
    var result = '<button class="swapBtn miniBtn" onclick="this.swapData('+(col-1)+','+col+')"><img class="swapIcon" src="swap.svg"></img></button>'
    return result
  }
  
  establishColName = function (col){
    var name = col.toString(); // default
    if (prefsStore.hasOwnProperty('cols') && prefsStore.cols[col-1]){
      name = prefsStore.cols[col-1];
      if (name == '====' && col > 1){ // special code to repeat the last column name (col > 1 as a precaution in case someone sets the first to ====)
        name = prefsStore.cols[prefsStore.cols.length-2] // use name from one before
      }
      if (prefsStore.hasOwnProperty('cols_min') && col > prefsStore.cols_min){
        name = '(' + name + ')'
      }
    } else if (prefsStore.hasOwnProperty('cols') && prefsStore.cols[prefsStore.cols.length-1] == '====' && col > 1){ // special code to repeat the last column name (col > 1 as a precaution in case someone sets the first to ====)
      name = '(' + prefsStore.cols[prefsStore.cols.length-2] + ')' // use name from one before
    }
    return name
  }
  
  rowControlsCell = function (row){
    var result = document.createElement('th')
    result.setAttribute('class', 'colHeader')
    result.setAttribute('id', 'row_'+row+'_0')
    result.setAttribute('onmouseover','this.this.hideRowControls('+row+')')
    result.setAttribute('onmouseout', 'hideRowControls('+row+')')
    result.innerHTML = rowControls(row)
    return result
  }
  
  rowControls = function (row){
    var newRowControl = '<div id="rowNum_'+row+'" class="rowNumber">'+row+'</div>'
    newRowControl += '<span id="row_'+row+'_controls" class="rowControls">'
    newRowControl += '<div id="row_'+row+'_addAbove" class="addAbove miniBtn" onclick="this.addRow('+row+')">+</div>'
    newRowControl += '<br>'
    newRowControl += '<div  id="row_'+row+'_remove" class="removeRow miniBtn" onclick="deleteRow('+row+')">-</div>'
    newRowControl += '</span>'
    newRowControl += '<div id="selectAreaRow_'+row+'" class="selectAreaRow" onmouseup="this.selectRow(event, '+row+')">&nbsp;</div>'
    return newRowControl
  }
  
  tableData = function (row, col){
    var result = document.createElement('td')
    result.setAttribute('id', 'dataCell_'+row+'_'+col)
    // result.setAttribute('class', 'dataCell '+colWidth)
    result.setAttribute('class', 'dataCell')
    result.innerHTML = inputCell(row, col)
    return result
  }
  
  inputCell = function (row, col){
    var result = '<input id="inputCell_'+row+'_'+col+'" data-row='+row+' data-col='+col+' class="inputCell" type="text" onkeydown="inputCellKey(event, parseInt(getAttribute(\'data-row\')), parseInt(getAttribute(\'data-col\')))" onchange="updateHoverAndView(this)" onpaste="pasteInData(event,parseInt(getAttribute(\'data-row\')), parseInt(getAttribute(\'data-col\')))">';
    return result;
  }
  
  updateHoverAndView = function (el){
    el.setAttribute('title',el.value)
    if (el.classList.contains('invalid')){
      el.classList.remove('invalid')
    }
  }
  
  selectCol = function (e, col){
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
  
  deselectCol = function (col){
    var indexOfCol = selection.col.indexOf(col)
    selectionProxy.col.splice(indexOfCol, 1)
    lastSelection = { ...selection}
  }
  
  this.selectRow = function (e, row){
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
        dethis.selectRow(row) // deselect row when clicking a second time
      }
    }
    if (selection.row.length > 0){
      document.body.addEventListener('keydown', handleKeyDownWithSelection)
      document.body.addEventListener('copy', handleCopyWithSelection)
      document.body.addEventListener('cut', handleCutWithSelection)
    }
  }
  
  dethis.selectRow = function (row){
    var indexOfRow = selection.row.indexOf(row)
    selectionProxy.row.splice(indexOfRow, 1)
    lastSelection = { ...selection}
  }
  
  deselectAll = function(){
    selectionProxy.col = []
    selectionProxy.row = []
    // console.log('Deselect')
    document.body.removeEventListener('keydown', handleKeyDownWithSelection)
    document.body.removeEventListener('copy', handleCopyWithSelection)
    document.body.removeEventListener('cut', handleCutWithSelection)
  }
  
  handleKeyDownWithSelection = function (e){
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
  
  handleCopyWithSelection = function (e){
    e.preventDefault();
    var toCopy = ''
    if(selection.row.length > 0){
      for (let i=0; i<selection.row.length; i++){
        for (let col=1; col<=numCols; col++){
          toCopy += document.getElementById('inputCell_'+selection.row[i]+'_'+col).value + '\t'
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
          toCopy += document.getElementById('inputCell_'+row+'_'+selection.col[i]).value + '\t'
        }
        toCopy = toCopy.trim()
        toCopy += '\n'
      }
      toCopy = toCopy.trim()
      navigator.clipboard.writeText(toCopy);
      console.log('Copy '+toCopy)
    }
  }
  
  handleCutWithSelection = function (e){
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
  
  resortSelection = function (key){
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
  
  updateAppearanceForSelection = function (key,value){
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
            input = document.getElementById('inputCell_'+j+'_'+value[i])
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
            input = document.getElementById('inputCell_'+value[i]+'_'+j)
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
  
  updateAppearanceForUnused = function(){
    let currentUnused = document.querySelectorAll('.unused')
    for (let i=0; i<currentUnused.length; i++){
      currentUnused[i].classList.remove('unused')
    }
    if (prefsStore.hasOwnProperty('cols_max') && numCols > prefsStore.cols_max){
      var colName
      var inputCell
      for (let col = prefsStore.cols_max+1; col<=numCols; col++){
        colName = document.getElementById('colName_'+col)
        colName.classList.add('unused')
        for (let row = 1; row <= numRows; row++){
          inputCell = document.getElementById('inputCell_'+row+'_'+col)
          inputCell.classList.add('unused')
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
          inputCell = document.getElementById('inputCell_'+row+'_'+col)
          inputCell.classList.add('unused')
        }
      }
    }
  }
  
  this.swapData = function (col1, col2){ // at the moment just for an array containing arrays of two, but should later develop this for more types
    for(let row=1; row<=numRows; row++){
      cell1 = document.getElementById('inputCell_'+row+'_'+col1)
      cell2 = document.getElementById('inputCell_'+row+'_'+col2)
      cell1Hold = cell1.value
      cell2Hold = cell2.value
      cell1.value = cell2Hold
      cell2.value = cell1Hold
    }
  }
  
  pasteInData = function (e, row, col){  
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
  
  returnJSONorArray = function (dataBlock){
    const regex = /\[?\["([^"]*(?:"[^"]*)*)"(?:,\s*)*\]\]?/;
    const isJson = regex.test(dataBlock.trim())
  
    // if the data pasted is in JSON format, parse it
    if (isJson){
      try {
        dataAsArray = JSON.parse(dataBlock.trim())
      }
      catch { // if that fails, assume it is tabbed
        dataAsArray = convertTextBlockToArray(dataBlock)
      }
    } else { // if it's not JSON format, assume it is tabbed
      dataAsArray = convertTextBlockToArray(dataBlock)
    }
  
    return dataAsArray
  }
  
  inputCellKey = function (e, row, col){
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
          newFocusId = 'inputCell_'+(row+1)+'_'+colToChoose
          newFocus = document.getElementById(newFocusId)
          newFocus.focus()
        } else if (e.key == 'Enter' || e.key == 'Tab') {
          this.addRow(row+1) // add row after
          newFocusId = 'inputCell_'+(row+1)+'_1' // always go back to first col with enter
          newFocus = document.getElementById(newFocusId)
          newFocus.focus()
        }
      } else if (e.key == 'ArrowUp' && row > 1){
          newFocusId = 'inputCell_'+(row-1)+'_'+col
          newFocus = document.getElementById(newFocusId)
          newFocus.focus()
      } else if (e.key == 'ArrowLeft' && col > 1 && charPos == 0){
          e.preventDefault();
          newFocusId = 'inputCell_'+row+'_'+(col-1)
          newFocus = document.getElementById(newFocusId)
          newFocus.focus()
      } else if (e.key == 'ArrowRight' && col < numCols && charPos == strLength) {
          e.preventDefault();
          newFocusId = 'inputCell_'+row+'_'+(col+1)
          newFocus = document.getElementById(newFocusId)
          newFocus.focus()
      } else if (e.key == 'Tab' && e.getModifierState('Alt')){
        e.preventDefault();
        if (e.getModifierState('Shift')){
          deleteCol(col) // only if empty??
          newFocusId = 'inputCell_'+row+'_'+(col-1)
          newFocus = document.getElementById(newFocusId)
          newFocus.focus()
        } else {
          this.addCol(col+1)
          newFocusId = 'inputCell_'+row+'_'+(col+1)
          // console.log(newFocusId)
          newFocus = document.getElementById(newFocusId)
          newFocus.focus()
        }
      }
    }
  }
  
  convertArrayToTableData = function (array, startRow = 1, startCol = 1){
    var inputCell
    for (let row=startRow; row<(startRow+array.length); row++){
      if (!document.getElementById('row_'+row)){ // if there isn't a row
        this.addRow(row) // add one
      }
      for (let col=startCol; col<(startCol+array[row-startRow].length); col++){
        if (!document.getElementById('dataCell_'+row+'_'+col)){ // if there isn't a col
          this.addCol(col) // add one
        }
        // put the data in the inputCell
        inputCell = document.getElementById('inputCell_'+row+'_'+col)
        inputCell.value = array[row-startRow][col-startCol]
        updateHoverAndView(inputCell) // onchange won't be fired, so we'll do it manually here
      }
    }
  }
  
  convertTableDataToArray = function (startRow = 1, startCol = 1, endRow = numRows, endCol = numCols, santizeHTML=false){
    var rowsArray = []
    var colsArray = []
    for (let row=startRow; row<=endRow; row++){
      colsArray = []
      for (let col=startCol; col<=endCol; col++){
        let cell = document.getElementById('inputCell_'+row+'_'+col).value
  
        if (santizeHTML){
          cell = cell.replaceAll('<','&lt;').replaceAll('>','&gt;')
        }
  
        colsArray.push(cell)
      }
      rowsArray.push(colsArray)
    }
    return rowsArray
  }
  
  convertTableToTrimmedArray = function (santizeHTML=false){
    var isNotEmptyRow = false
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
     inputArray = convertTableDataToArray(1,1,endRow,endCol,true)
  
     // get rid of trailing empty rows (don't bother with the first row, so as to not risk passing something empty)
     for (let row = inputArray.length-1; row>0; row--){
       isNotEmptyRow = false
       for (let col = inputArray[row].length-1; col>=0; col--){
         if (inputArray[row][col] != ''){
           isNotEmptyRow = true
         }
       }
       if (isNotEmptyRow){
         row = 0 // as soon as we've found a non-empty row, stop looking
       } else {
         inputArray.pop(); // we should always be on the last row, so delete it if it's empty
       }
     }
     return inputArray;
  }
  
  // TO DO: move the "checking" parts of this function to a new function - this one will later just be used for exporting to clipboard or text
  convertTableDataToBlock = function(){
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
        textBlock += document.getElementById('inputCell_'+row+'_'+col).value
        textBlock += '\t'
      }
      textBlock = textBlock.trim()
      textBlock += '\n'
    }
    return textBlock.trim()
  }
  
  convertTableDataToJSONString = function(){
    let obj = convertTableDataToArray()
    return JSON.stringify(obj)
  }
  
  convertTextBlockToArray = function (textBlock){  //previous known as inputToArray
    var data = [];
    let textBlockSplit = textBlock.split(/\r?\n/);
    for (i=0;i<textBlockSplit.length;i++){
      data.push(textBlockSplit[i].split(/\t/))
    }
    return data
  }
  
  determineFurthestCol = function(){
    for (let i=numCols; i>=1; i--){
      if (!isEmptyCol(i)){
        return i
      }
    }
    return 0
  }
  
  determineFurthestRow = function(){
    for (let i=numRows; i>=1; i--){
      if (!isEmptyRow(i)){
        return i
      }
    }
    return 0
  }
  
  
  isEmptyRow = function (row){
    for(let i=1; i<=numCols; i++){
      var inputCell = document.getElementById('inputCell_'+row+'_'+i)
      if (inputCell.value != ''){
        return false
      }
    }
    return true
  }
  
  isEmptyCol = function (col){
    for(let i=1; i<=numRows; i++){
      var inputCell = document.getElementById('inputCell_'+i+'_'+col)
      if (inputCell.value != ''){
        return false
      }
    }
    return true
  }
  
  rowContainsEmptyCell = function (row){
    for(let i=1; i<=numCols; i++){
      var inputCell = document.getElementById('inputCell_'+row+'_'+i)
      if (inputCell.value = ''){
        return true
      }
    }
    return false
  }
  
  colContainsEmptyCell = function (col){
    for(let i=1; i<=numRows; i++){
      var inputCell = document.getElementById('inputCell_'+i+'_'+col)
      if (inputCell.value = ''){
        return true
      }
    }
    return false
  }
  
  tableIsEmpty = function(){
    var inputCells = document.querySelectorAll('.inputCell')
    for(let i=0; i<inputCells.length;i++){
      if (inputCells[i].value != ''){
        return false
      }
    }
    return true // if it's not returned false at any point, it must be true
  }

}  

