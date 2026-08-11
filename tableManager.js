// const { select } = require("async")
const uuid = self.crypto.randomUUID.bind(self.crypto)
// showdown.setOption('strikethrough',true)  
const markdownUtils = window.MarkdownUtils || null



class TableManager {

    constructor(id,options={textOnly:false,addRemoveCellsAllowed:true}){
        this.tableId = id
        // this.numRows = 0 // first one will be added // TO DO: count real rows
        // this.numCols = 2
        this.selection = {col: [], row: []}
        this.lastSelection = {col: [], row: []}
        this.textOnly = options.hasOwnProperty('textOnly') ? options.textOnly : false
        this.addRemoveCellsAllowed = options.hasOwnProperty('addRemoveCellsAllowed') ? options.addRemoveCellsAllowed : true
        
        this.tableElement = this.makeTableElement()
        this.tableBody = this.tableElement.querySelector('tbody')

        this.cellIDs = [] // 2D array of cellIDs, which are the unique identifiers for each cell that link the virtual table to the DOM elements (since the row and column numbers can change, we can't rely on those to find the right cell in the DOM after changes have been made, so we need a stable unique identifier for each cell that doesn't change when rows/cols are added/removed)
        // we also have seperate IDs to identify an entire row or column. These are unrelated to the cellIDs.
        this.colIDs = [uuid(), uuid()] // 1D array of all column IDs, we will need to start with two colIDs, the rest are added as columns are created
        // TO DO: start cols from, 0 and therefore remove first emptyy string
        this.rowIDs = [] // 1D array of all row IDs, which will be added as rows are created        

        this.undoStack = []
        this.redoStack = []

        this.detailEditor = !this.textOnly ? this.makeDetailEditor() : null
        this.wysiwyg = {}
        this.detailEditorCell = null

        // bind handlers so add/removeEventListener uses stable references
        this.handleKeyDownWithSelection = this.handleKeyDownWithSelection.bind(this)
        this.handleCopyWithSelection = this.handleCopyWithSelection.bind(this)
        this.handleCutWithSelection = this.handleCutWithSelection.bind(this)

        this.pendingCellEditCapture = null
        this.holdCellOriginalValue = null

        this.draggingTableRow = false

        this.selectionProxy = new Proxy(this.selection, {
            set: (target, key, value) => {
                target[key] = value;
                this.resortSelection(key)
                this.updateAppearanceForSelection(key, value)
                return true;
            }
        }); 
    }

    numRows(){
        return this.rowIDs.length
    }

    numCols(){
        return this.colIDs.length
    }

    numEnabledRows(){
        let count = 0
        let rows = this.get('rows')
        rows.forEach(row => {
            if (!row.classList.contains('disabled')){
                count++
            }
        })
        return count
    }

    // unfinished undo implementation
    do(what, args, type = 'doing'){ // typpe = doing, undoing, redoing
        let reverse = null
        switch(what){
            // BOOKMARK TO DO : FULLY TEST BELOW
            case 'addRow':                
                let newRowID = this.addRow((args && args.rowID) ? args.rowID : null)    
                reverse = {action: 'deleteRow', args: {rowID: newRowID}}           
                break;
            case 'deleteRow':
                let deletedRow = this.deleteRow(args.rowID, true) // to do: adapt delete row to return the an object containing the deleted row ID, the row's position, the cell IDs and the contents of the row
                reverse = {action: 'restoreRow', args: {row: deletedRow}}             
                break;
            // BOOKMARK TO DO : IMPLEMENT BELOW
            case 'deleteRows':
                let deletedRows = this.deleteRows(args.rowIDs, true)
                reverse = {action: 'restoreRows', args: {rows: deletedRows, from: 'deleteRows'}}
                break;
            case 'clearRow':
                let clearedRow = this.clearRow(args.rowID, true) // to do: adapt clearRow to return an object containing the cleared row ID, the cell IDs and the contents of the row
                reverse = {action: 'restoreRow', args: {row: clearedRow, from: 'clearRow'}}
                break;
            case 'clearRows':
                let clearedRows = this.clearRows(args.rowIDs, true) // to do: make clearRows function
                reverse = {action: 'restoreRows', args: {rows: clearedRows, from: 'clearRows'}}
                break;
            case 'restoreRow':
                this.insertRow(args.row) 
                reverse = {action: args.from, args: {rowID: args.row.rowID}}
                break;
            case 'restoreRows':
                args.rows.forEach(row => {
                    this.insertRow(row)
                });
                reverse = {action: args.from, args: {rowIDs: args.rows.map(row => row.rowID)}}
                break;
            case 'addCol':
                let newColID = this.addCol( (args && args.colID) ? args.colID : null)
                reverse = {action: 'deleteCol', args: {colID: newColID}}
                break;
            case 'deleteCol':
                let deletedCol = this.deleteCol(args.colID, true) // to do: adapt deleteCol to return an object containing the deleted col ID, the col's position, the cell IDs and the contents of the col
                reverse = {action: 'restoreCol', args: {col: deletedCol, from: 'deleteCol'}} // because both clear and delete are undone with the same action, we need to save what this was for the redo
                break;
            case 'deleteCols':
                let deletedCols = this.deleteCols(args.colIDs, true) // to do: make deleteCols function
                reverse = {action: 'restoreCols', args: {cols: deletedCols, from: 'deleteCols'}}

                break;
            case 'clearCol':
                let clearedCol = this.clearCol(args.colID, true) // to do: adapt clearCol to return an object containing the cleared col ID, the cell IDs and the contents of the col
                reverse = {action: 'restoreCol', args: {col: clearedCol, from: 'clearCol'}}
                break;
            case 'clearCols':
                let clearedCols = this.clearCols(args.colIDs, true) // to do: make clearCols function
                reverse = {action: 'restoreCols', args: {cols: clearedCols, from: 'clearCols'}}
                break;
            case 'restoreCol':
                this.insertCol(args.col)       
                reverse = {action: args.from, args: {colID: args.col.colID}} // if we're restoring a deleted column, then the reverse action is to delete the column again, and if we're restoring a cleared column, then the reverse action is to clear the column again
                break;
            case 'restoreCols':
                args.cols.forEach(col => {
                    this.insertCol(col)
                });         
                reverse = {action: args.from, args: {colIDs: args.cols.map(col => col.colID)}} // if we're restoring deleted columns, then the reverse action is to delete the columns again, and if we're restoring cleared columns, then the reverse action is to clear the columns again
                break; 
            case 'storeCellEdit':
                // nothing else happens here, we just store the previous values so we can undo
                reverse = {action: 'revertCell', args: {cellID: args.cellID, oValue: args.oValue, nValue: args.nValue}} // if we're storing a cell edit, then the reverse action is to revert the cell to its previous value (and we also save the new value just in case we need it for redo)
                break;
            case 'revertCell':
                this.revertCell(args.cellID, args.oValue)            
                reverse = {action: 'revertCell', args: {cellID: args.cellID, oValue: args.nValue, nValue: args.oValue}} // if we're reverting a cell, then the reverse action is to revert it again (back to the new value)
                break;
            case 'swapCols':
                this.swapCols(args.colID1, args.colID2) // to do: adapt swapCols to return the two colIDs that were swapped
                reverse = {action: 'swapCols', args: {colID1: args.colID2, colID2: args.colID1}} // swapping the colIDs will swap them back            
                break;
            case 'clearTable':
                let clearedTable = this.clearTable(true) 
                reverse = {action: 'restoreTable', args: {table: clearedTable}}
                break;
            case 'restoreTable':
                this.clearTable() 
                this.colIDs = [...args.table.colIDs] // to do: make sure we already have the right number of cols
                args.table.rows.forEach(row => {
                    this.insertRow(row)
                });
                reverse = {action: 'clearTable'}
            case 'storeTableState':
                reverse = {action: 'restoreTableState', args: {state: args.state}}
            // also: move row, move col, store table state (for big changes like import), restore table state            
        }
        if (type == 'doing'){
            this.redoStack = [] // clear redo stack whenever a new action is taken, unless redoing or undoing
            this.undoStack.push(reverse) // add the reverse of the action to the undo stack
        } else if (type == 'undoing'){            
            this.redoStack.push(reverse) // add the reverse of the undone action to the redo stack
        } else if (type == 'redoing'){
            this.undoStack.push(reverse) // add the redone action back to the undo stack
        }

        if (this.undoStack.length > 100){
            this.undoStack.shift() // limit undo stack to 100 actions
        }
    }

    undo(){
        let lastAction = this.undoStack.pop()
        if (lastAction){
            this.do(lastAction.action, lastAction.args, 'undoing')
        }
    }

    redo(){
        let lastUndoneAction = this.redoStack.pop()
        if (lastUndoneAction){
            this.do(lastUndoneAction.action, lastUndoneAction.args, 'redoing')
        }
    }
    

    get(what, val1, val2){
        // what = row, col, rowCells, colCells, cell, text, datetime, file, extension, rowCheck, imageSelector, colName, rowNumber, rowSelectArea, colSelectArea, textMirror, select
        let row, col
        if (what.match(/^row/)){
            row = val1            
        } else if (what.match(/^col/)){
            col = val1
        } else {
            row = val1
            col = val2
        }

        // console.log(`Getting ${what} for row ${row} and col ${col}`) // TO DO: remove

        switch(what){
            case 'rows':
                return Array.from(this.tableElement.querySelectorAll('.tableRow'))                            
            case 'row':
                // returns the whole row element
                return this.tableElement.querySelector(`tr[data-row="${this.rowIDs[row]}"]`)
            case 'col':
                // we can't actually return a column as a DOM element, so instead we'll just return the header
                let headerRow = document.getElementById(`${this.tableId}_headerRow`)
                return headerRow.querySelector(`[data-col="${this.colIDs[col]}"]`)
            case 'rowCells':
                // returns all data cells in the row
                return Array.from(this.tableElement.querySelectorAll(`.dataCell[data-row="${this.rowIDs[row]}"]`))
            case 'colCells':
                // returns all data cells in the column
                return Array.from(this.tableElement.querySelectorAll(`.dataCell[data-col="${this.colIDs[col]}"]`))
            case 'cell':
                return document.getElementById(`${this.tableId}_${this.cellIDs[row][col]}_dataCell`) 
            case 'text':
                return document.getElementById(`${this.tableId}_${this.cellIDs[row][col]}_inputCellText`)
            case 'date':
                return document.getElementById(`${this.tableId}_${this.cellIDs[row][col]}_inputCellDate`)
            case 'time':
                return document.getElementById(`${this.tableId}_${this.cellIDs[row][col]}_inputCellTime`)
            case 'datetime':
                return document.getElementById(`${this.tableId}_${this.cellIDs[row][col]}_inputCellDateTime`) // note, this is a container, doesn't hold the value
             case 'select':
                return document.getElementById(`${this.tableId}_${this.cellIDs[row][col]}_inputCellSelect`)
            case 'file':
                return document.getElementById(`${this.tableId}_${this.cellIDs[row][col]}_inputCellFile`)
            case 'extension':
                return document.getElementById(`${this.tableId}_${this.cellIDs[row][col]}_inputCellExtension`)
            case 'rowCheck':
                return document.getElementById(`${this.tableId}_${this.cellIDs[row][col]}_inputCellRowCheck`)
            case 'imageSelector':
                return document.getElementById(`${this.tableId}_${this.cellIDs[row][col]}_inputCellImageSelector`)
            case 'colName':
                return document.getElementById(`${this.tableId}_${this.colIDs[col]}_colName`)
            case 'rowNumber':
                return document.getElementById(`${this.tableId}_rowNum_${row}`)
            case 'rowSelectArea':
                return document.getElementById(`${this.tableId}_${row}_selectAreaRow`)
            case 'colSelectArea':
                return document.getElementById(`${this.tableId}_${col}_selectAreaCol`)
            case 'textMirror':
                return document.getElementById(`${this.tableId}_${this.cellIDs[row][col]}_inputCellTextMirror`)
            default:
                if (typeof row === 'number' && typeof col === 'number'){
                    console.warn('Get request type not recognised. Returning null.')
                    // return document.getElementById(`${this.tableId}_${this.cellIDs[row][col]}_dataCell`) 
                } else if (typeof row === 'number'){
                    console.warn('Get request type not recognised. Returning null.')
                    // return  Array.from(this.tableElement.querySelector(`tr[data-row="${this.rowIDs[row]}"]`))
                } else {
                    console.error('Get request type not recognised and insufficient information to return a default. Returning null.')
                }
        }
            
    }

    coordinatesOf(cellID){
        for (let row=0; row<this.cellIDs.length; row++){
            for (let col=0; col<this.cellIDs[row].length; col++){
                if (this.cellIDs[row][col] == cellID){
                    return {row: row, col: col}
                }
            }
        }
    }

    debugCheckCellIDs(){
        let allCells = this.tableElement.querySelectorAll('.dataCell')
        let noErrors = true
        allCells.forEach(cell => {
            let cellID = cell.dataset.cell
            let coords = this.coordinatesOf(cellID)
            let DOMcoords = {row: cell.parentNode.rowIndex-1, col: cell.cellIndex-1} // -1 to account for header row and column
            if (!coords){
                console.error(`Cell with ID ${cellID} not found in cellIDs table!`)
                noErrors = false
            } else {
                let cellAtCoords = this.get('cell', coords.row, coords.col)
                if (cellAtCoords.dataset.cell != cell.dataset.cell){
                    console.error(`Cell ID ${cellID} at coordinates row ${coords.row} and col ${coords.col+1} does not match cell with that ID in the DOM! (${cellAtCoords.dataset.cell})`)
                    noErrors = false
                }
                let cellAtDOMCoords = this.get('cell', DOMcoords.row, DOMcoords.col) 
                if (cellAtDOMCoords.dataset.cell != cell.dataset.cell){
                    console.error(`Cell ID ${cellID} at DOM coordinates row ${DOMcoords.row} and col ${DOMcoords.col+1} does not match cell with that ID in the DOM! (${cellAtDOMCoords.dataset.cell})`)
                    noErrors = false
                }
            } 
        })
        if (noErrors){
            console.log('All cellIDs match between cellIDs table and DOM!')
        }
    }

    makeTableElement(){
        let table = newElement('table',{id: this.tableId, class: 'hex-table'},newElement('tbody',{id: this.tableId+'_tableBody'},newElement('tr',{id: this.tableId+'_lastRow'},[
            newElement('th',{class: 'numCol'}),
            this.addRemoveCellsAllowed ? this.addRowCell() : null,
            this.addRemoveCellsAllowed ? this.addRowCell() : null 
        ])))

        return table
    }

    // this currently isn't being used (handled by css)
    showRowControls(row){
        let rowEl = this.get('row', row)
        let controls = rowEl.querySelector('.row-controls')
        controls.style.opacity = 1
    }

    // this currently isn't being used (handled by css)
    hideRowControls(row){
        let rowEl = this.get('row', row).querySelector('.row-controls')
        rowEl.style.opacity = ''
    }

    // this currently isn't being used (handled by css)
    showColControls(col){
        // let addEl = this.tableElement.querySelector('#'+this.tableId+'_col_'+col+'_addBefore')
        let addEl = this.get('col', col).querySelector('.addBefore')
        let removeEl = this.get('col', col).querySelector('.remove')
        addEl.style.opacity = 1
        removeEl.style.opacity = 1
    }

    // this currently isn't being used (handled by css)
    hideColControls(col){
        let addEl = this.tableElement.querySelector('#'+this.tableId+'_col_'+col+'_addBefore')
        let removeEl = this.tableElement.querySelector('#'+this.tableId+'_col_'+col+'_remove')
        addEl.style.opacity = ''
        removeEl.style.opacity = ''
    }

    addRow(rowID, newRowID = uuid(), cellIDs = null){
        let position = rowID ? this.rowIDs.indexOf(rowID) : this.numRows() // if no rowID provided, add to the end
        if(position == -1){ position = this.numRows() } // if rowID provided but not found, add to the end        
        let tableBody = document.getElementById(this.tableId+'_tableBody')        

        // add new row to table
        let newRow = this.tableRow(position,this.numCols(), newRowID, cellIDs)         
        console.log(`Adding row at position ${position} with ID ${newRow.id}. Number of childnodes on tableBody: ${tableBody.childNodes.length}`) // TO DO: remove        
        tableBody.insertBefore(newRow,tableBody.childNodes[position+1]) // +1 to account for header row
        // this.numRows++

        // expand if everything else on the column is expanded
        if (this.numRows() > 1){
            this.checkForExpanded(newRow)
        }

        this.redoRowNumbers()

        this.updateAppearanceForUnused()            
        return newRowID
    }

    insertRow(args){ // inserts an existing row, requires rowID, (new) rowIndex, cellIDs and cellData for the row
        // note this is only designed to work if the number of columns is the same between the table and the inserted row
        // if you want to reuse this for something else other than restoring in an undo action, then you will need to add in any missing columns first
        // AND (if newCols > oldCols) also add in any missing cellIDs to args.cellIDs
        let positionID = args.rowIndex != null ? this.rowIDs[args.rowIndex] : null
        // add new row to table if it's not already there
        // (this way we can restore both deleted and cleared rows with the same function, since both of them require restoring the row data)
        if (positionID != args.rowID){
            this.addRow(positionID, args.rowID, args.cellIDs) 
        }
        
        // if (args.cellIDs && args.cellIDs.length == this.numCols()){ 
        //     this.cellIDs[args.rowIndex] = args.cellIDs // replace cellIDs with the old ones from the deleted row
        // }
        if (args.rowData){
            let cells = this.get('rowCells', args.rowIndex)
            cells.forEach((cell, index) => {
                let cellData = args.rowData[index]
                let text = cell.querySelector('.inputCellText')
                let date = cell.querySelector('.inputCellDate')
                let time = cell.querySelector('.inputCellTime')
                let file = cell.querySelector('.inputCellFile') 
                let select = cell.querySelector('.inputCellSelect')               
                if (text) text.value = cellData.text
                if (date) date.value = cellData.date
                if (time) time.value = cellData.time
                if (file) file.value = cellData.file
                if (select) select.value = cellData.select
            })
        }
    }

    toggleEnableRow(rowCheck){
        let value = rowCheck.checked        
        let rowEl = rowCheck.closest('.tableRow')
        if (value){
            rowEl.classList.remove('disabled')
        } else {
            rowEl.classList.add('disabled')
        }            
    }

    checkForExpanded(rowEl){
        let rowCells = Array.from(rowEl.querySelectorAll('.dataCell'))
        rowCells.forEach(rowCell => {
            let col = this.colIDs.indexOf(rowCell.dataset.col)
            for(let row=0; row<this.numRows(); row++){
                let cell = this.get('cell', row, col)
                if (!cell.classList.contains('expanded') && cell.id != rowCell.id){
                    return
                }
            }
            this.toggleCellExtension(rowCell, true)
        })        
    }

    deleteRow(rowID, saveForUndo = false){

        console.log(`Deleting row with ID ${rowID}. Number of childnodes on tableBody: ${document.getElementById(this.tableId+'_tableBody').childNodes.length}`) // TO DO: remove

        const position = rowID ? this.rowIDs.indexOf(rowID) : this.numRows()-1 // if no rowID provided, delete the last row

        const deletedRowData = saveForUndo ? {rowID: rowID, cellIDs: this.cellIDs[position], rowIndex: position, rowData: this.getRowData(position)} : null // to use for undo

        if (!this.addRemoveCellsAllowed){
            return // do nothing if add/remove cells disabled
        }

        if (this.numRows() > 1){
            let tableBody = document.getElementById(this.tableId+'_tableBody')
            let currentFocus = document.activeElement
            if (currentFocus.getAttribute('class') == 'inputCellText'){
                let currentCellID = currentFocus.dataset.cell
                let currentCoordinates = this.coordinatesOf(currentCellID)
                let newFocus = this.get('text', position >= 1 ? position-1 : 0, currentCoordinates.col) // TO DO: adapt if text is not in this column (might be worth making a seperate focus function)
                if(newFocus) newFocus.focus()
            }
            tableBody.removeChild(tableBody.children[position+1]) // +1 to account for header row

            this.rowIDs.splice(position, 1) // remove row from virtual table
            this.cellIDs.splice(position, 1) // remove row from cellIDs table

            this.redoRowNumbers()

            // this.numRows--
        } else { // if there's only one row, just empty its contents
            this.clearRow(this.rowIDs[position])
        }

        this.updateAppearanceForUnused()

        return deletedRowData
    }

    deleteRows(rowIDs, saveForUndo = false){
        let deletedRowsData = []
        for (let i = rowIDs.length-1; i >= 0; i--){ // go backwards so when we delete a row it doesn't change the numbering
                deletedRowsData.push(this.deleteRow(rowIDs[i], saveForUndo))
            }        
        return deletedRowsData;
    }

    deleteCol(colID, saveForUndo = false){

        console.log(`Deleting column with ID ${colID}. Number of childnodes on tableBody: ${document.getElementById(this.tableId+'_tableBody').childNodes.length}`) // TO DO: remove

        const position = colID ? this.colIDs.indexOf(colID) : this.numCols()-1 // if no colID provided, delete the last column

        const deletedColData = saveForUndo ? {colID: this.colIDs[position], cellIDs: this.cellIDs.map(row => row[position]), colIndex: position, colData: this.getColData(position)} : null // to use for undo

        if (!this.addRemoveCellsAllowed){
            return // do nothing if add/remove cells disabled
        }

        if (this.numCols() > 1){
            let tableBody = document.getElementById(this.tableId+'_tableBody')
            // change focus if necessary
            let currentFocus = document.activeElement
            if (currentFocus.dataset.col == this.colIDs[position]){

            // let focusRegex = new RegExp('inputCellText_\\d+_'+position)
            // if (currentFocus && focusRegex.test(currentFocus.id)){
                let currentCoordinates = this.coordinatesOf(currentFocus.dataset.cell)                     
                let newFocus = this.get('text', currentCoordinates.row, position-1) // TO DO: adapt if text is not in this column (might be worth making a seperate focus function)
                if(newFocus) newFocus.focus()
            }
            // remove column cells, including header and add button 
            for (let i=0;i<=this.numRows()+1;i++){
                if (tableBody.children[i].children.length >= position + 1){ // check the element exists (if there's no add button, it won't)
                    tableBody.children[i].removeChild(tableBody.children[i].children[position+1]) // remove cells from DOM, +1 to account for first column
                }
                if (i < this.numRows()){ // skipping the last one, which is the add row
                    this.cellIDs[i].splice(position, 1) // remove cell from cellIDs table         
                }
            }
            this.colIDs.splice(position, 1) // remove column from colIDs table
            // reduce number of columns count
            // this.numCols--
            // recreate header row
            tableBody.removeChild(tableBody.children[0])
            this.headerRow(this.numCols())
        } else { // if there's only one column, just empty it's contents
            this.clearCol(this.colIDs[position])
        }

        this.updateAppearanceForUnused()

        return deletedColData
    }

    deleteCols(colIDs, saveForUndo = false){
        let deletedColsData = []
        for (let i = colIDs.length-1; i >= 0; i--){ // go backwards so when we delete a column it doesn't change the numbering
            deletedColsData.push(this.deleteCol(colIDs[i], saveForUndo))
        }
        return deletedColsData;
    }

    clearRow(rowID,saveForUndo = false){
        const position = this.rowIDs.indexOf(rowID)
        var dataCells = this.get('rowCells', position)
        var clearedRowData = saveForUndo ? {rowID: rowID, cellIDs: this.cellIDs[position], rowIndex: position, rowData: this.getRowData(position)} : null // to use for undo
        for (let i=0; i<dataCells.length; i++){
            this.clearCell(dataCells[i])
        }  
        return clearedRowData
    }

    clearRows(rowIDs, saveForUndo = false){
        let clearedRowsData = []
        for (let i=rowIDs.length-1; i>=0; i--){
            clearedRowsData.unshift(this.clearRow(rowIDs[i], saveForUndo))
        }
        return saveForUndo ? clearedRowsData : null;
    }


    clearCol(colID, saveForUndo = false){
        const position = this.colIDs.indexOf(colID)
        var dataCells = this.get('colCells', position)
        var clearedColData = saveForUndo ? {colID: colID, cellIDs: this.cellIDs.map(row => row[position]), colIndex: position, colData: this.getColData(position)} : null // to use for undo
        for (let i=0; i<dataCells.length; i++){
            this.clearCell(dataCells[i])
        }
        return clearedColData;
    }

    clearCols(colIDs, saveForUndo = false){
        let clearedColsData = []
        for (let i=colIDs.length-1; i>=0; i--){
            clearedColsData.unshift(this.clearCol(colIDs[i], saveForUndo))
        }
        return saveForUndo ? clearedColsData : null;
    }

    clearTable(saveForUndo = false){        
        let clearedTableData = {rows: this.clearRows(this.rowIDs, saveForUndo), colIDs: [...this.colIDs]} // to use for undo, we need to save the colIDs as well in case columns were cleared instead of deleted, otherwise we won't know which columns to restore the data to
        return clearedTableData;
    }

    clearCell(dataCell, saveForUndo = false){
        let text = dataCell.querySelector('.inputCellText')
        let date = dataCell.querySelector('.inputCellDate')
        let time = dataCell.querySelector('.inputCellTime')
        let file = dataCell.querySelector('.inputCellFile')

        let clearedCellData = saveForUndo ? {text: text ? text.value : null, date: date ? date.value : null, time: time ? time.value : null, file: file ? file.innerHTML : null} : null // to use for undo

        text.value = '' //inputCellText
        if (date) date.value = '' //inputCellDate
        if (time) time.value = '' //inputCellTime

        if (file) {
            file.innerHTML = '' //inputCellFile
            // file.classList.add('hidden')  //inputCellFile
        }
        dataCell.classList.remove('withPreview')
        // also revert to normal view:
        dataCell.classList.remove('expanded')

        return clearedCellData
    }

    clearUnusedRowsFromEnd(noUndo = false){
        for (let row=this.numRows()-1; row>1; row--){ // go backwards, leave the first row
            if(this.isEmptyRow(row)){
                this.deleteRow(this.rowIDs[row],true)
            } else {
                return // stop after finding the first non-empty row
            }
        }
    }

    clearUnusedColsFromEnd(noUndo = false){
        for (let col=this.numCols()-1; col>1; col--){ // go backwards, leave the first row
            if(this.isEmptyCol(col)){
                this.deleteCol(this.colIDs[col],true)
            } else {
                return // stop after finding the first non-empty row
            }
        }
    }

    storeTableState(){
        let rows = []
        for (let row=0; row<this.numRows(); row++){
            let rowData = this.getRowData(row)
            rows.push({rowID: this.rowIDs[row], cellIDs: this.cellIDs[row], rowData: rowData})
        }        
        let tableState = {rows: rows, colIDs: [...this.colIDs]}
        this.do('storeTableState', {state: tableState})
    }

    redoRowNumbers(){
        let rows = this.get('rows')
        rows.forEach((row, index) => {
            let rowNum = row.querySelector('.rowNumber')
            if (rowNum){
                rowNum.innerHTML = index + 1
            }
        })
    }

    addCol(colID, newColID = uuid(), cellIDs = null){ 

        let position = colID ? this.colIDs.indexOf(colID) : this.numCols()
        if (position == -1){ position = this.numCols() } // if colID provided but not found, add to the end

        // this.numCols++
        this.colIDs.splice(position, 0, newColID || uuid())

        let tableBody = document.getElementById(this.tableId+'_tableBody')
        let firstRow = document.getElementById(this.tableId+'_headerRow')
        let lastRow = document.getElementById(this.tableId+'_lastRow')

        let newHeader = this.colControlsCell(position)

        // remake the col controls after the new column
        for (let i=this.numCols()-1; i>position; i--){
            firstRow.replaceChild(this.colControlsCell(i),firstRow.children[i])
        }

        // add new col controls in header row
        console.log(`Adding column at position ${position}. Number of childnodes on tableBody: ${tableBody.childNodes.length}`) // TO DO: remove
        firstRow.insertBefore(newHeader,firstRow.children[position+1]) // +1 to account for first column

        // add new add button at bottom
        if(this.addRemoveCellsAllowed){
            console.log(`Adding add column button at position ${position}. Number of childnodes on tableBody: ${tableBody.childNodes.length}`) // TO DO: remove            
            lastRow.insertBefore(this.addRowCell(),lastRow.children[position+1])
        }

        for (let i=0;i<this.numRows();i++){
            // add new column
            let newCell = this.tableData(i,position, cellIDs ? cellIDs[i] : null)
            console.log(`Adding cell at row ${i} and column ${position}. Number of childnodes on tableBody: ${tableBody.childNodes.length}`) // TO DO: remove
            tableBody.children[i+1].insertBefore(newCell,tableBody.children[i+1].childNodes[position+1]) // +1 to account for header row and first column
        }
        this.updateAppearanceForUnused()

        return newColID
    }

    insertCol(args){ // inserts an existing column, requires colID, (new) colIndex, cellIDs and cellData for the column
        // note this is only designed to work if the number of rows is the same between the table and the inserted column
        // if you want to reuse this for something else other than restoring in an undo action, then you will need to add in any missing rows first
        // AND (if newRows > oldRows) also add in any missing cellIDs to args.cellIDs
        let positionID = args.colIndex != null ? this.colIDs[args.colIndex] : null
        // add new column to table if it doesn't already exist (this way we can restore both deleted and cleared columns with the same function, since both of them require restoring the column data)
        if (positionID != args.colID){
            this.addCol(positionID, args.colID, args.cellIDs)
        }
        // if (args.cellIDs && args.cellIDs.length == this.numRows()){
        //     for (let i=0; i<this.numRows(); i++){
        //         this.cellIDs[i][args.colIndex] = args.cellIDs[i]                
        //     }
        // }
        if (args.colData){
            for (let i=0; i<this.numRows(); i++){
                let cellData = args.colData[i]
                let text = this.get('text', i, args.colIndex)
                let date = this.get('date', i, args.colIndex)
                let time = this.get('time', i, args.colIndex)
                let file = this.get('file', i, args.colIndex)
                let select = this.get('select', i, args.colIndex)
                if (text) text.value = cellData.text
                if (date) date.value = cellData.date
                if (time) time.value = cellData.time
                if (file) file.value = cellData.file
                if (select) select.value = cellData.select
            }
        }
    }


    tableRow(row, cols, rowID, cellIDs = null){


        // add row to virtual tables
        this.rowIDs.splice(row, 0, rowID) 

        if(!this.cellIDs[row]){
            this.cellIDs[row] = []
        } else {
            this.cellIDs.splice(row, 0, []) // add new row to cellIDs table
        }
 
        // let newRow = newElement('tr', {id: this.tableId+'_row_'+row, class: 'tableRow', dataRow: rowID}, this.rowControlsCell(row))
        let newRow = newElement('tr', {id: rowID, class: 'tableRow', dataRow: rowID}, this.rowControlsCell(rowID))

        for(let col=0; col<cols; col++){
            let newCell = this.tableData(row, col, cellIDs ? cellIDs[col] : null)
            newRow.appendChild(newCell)
        }
        newRow.appendChild(this.addColCell())


        return newRow
    }

    getTableRowElement(row){
        return this.get('row', row)
    }

    addRowCell(){
        var result = document.createElement('td')
        let button = newElement('div', {class:"addBottom miniBtn"},'+') // to do: make button element
        button.onclick = () => this.do('addRow', {rowID: this.rowIDs[this.numRows()]}) // add after the last row
        result.appendChild(button)
        return result
    }

    addColCell(){
        let result = newElement('td',{class: 'addCol'})    
        let button = newElement('div', {class:"addRight miniBtn"},'+')
        button.onclick = () => this.do('addCol') 
        result.appendChild(button)
        return result
    }

    addNewColIDsToEnd(newNum){
        if (newNum > this.numCols()){
            for (let i=this.numCols(); i<=newNum; i++){
                this.colIDs.push(uuid())
            }
        }
    }

    headerRow(cols){
        var tableBody = document.getElementById(this.tableId+'_tableBody')
        var firstRow = document.createElement('tr')
        firstRow.setAttribute('id',this.tableId+'_headerRow')
        firstRow.innerHTML = '<th class="numCol"></th>'
        for (let i=0;i<cols;i++){
            firstRow.appendChild(this.colControlsCell(i))
        }
        var blankAddCol = document.createElement('th')
        blankAddCol.setAttribute('class','addCol')
        firstRow.appendChild(blankAddCol)
        tableBody.insertBefore(firstRow,tableBody.childNodes[0])
    }

    removeHeaderRow(){
        console.log(`Removing header row. Number of childnodes on tableBody: ${document.getElementById(this.tableId+'_tableBody').childNodes.length}`) 
        var tableBody = document.getElementById(this.tableId+'_tableBody')
        var headerRow = document.getElementById(this.tableId+'_headerRow')
        if (headerRow){
            tableBody.removeChild(headerRow)
        }
    }

    // BOOKMARK – UPDATED FOR GET UP TO HERE!

    colControlsCell(col){

        let colID = this.colIDs[col]
        
        let colNameStr = this.establishColName(col)
        let addBefore = newElement('div', {id: `${this.tableId}_${colID}_addBefore`, class: 'addBefore miniBtn'}, '+')
        let colName = newElement('div', {id: `${this.tableId}_${colID}_colName`, class: 'colName'}, colNameStr)
        let colRemove = newElement('div', {id: `${this.tableId}_${colID}_remove`, class: 'removeCol miniBtn'}, '-')
        let selectArea = newElement('div', {id: `${this.tableId}_${colID}_selectArea`, class: 'selectAreaCol', title: colNameStr}, '&nbsp;')
        let moreBtn = newElement('button', {class: 'inputCellMore cellBtn'}, '⋮')

 
        addBefore.onclick = () => table.do('addCol', {colID: colID})
        colRemove.onclick = () => table.do('deleteCol', {colID: colID})
        selectArea.onclick = (event) => this.selectCol(event, colID)
        moreBtn.onclick = () => this.toggleCellExtensionCol(colID)
        // moreBtn.ondrag = (event) => this.resizeCol(event, colID)

        let newColControl = newElement('th', {id: `${this.tableId}_${colID}_controls`, dataCol: colID, class: 'col-controls'}, [
            col > 0 ? this.swapButton(colID) : null,
            this.addRemoveCellsAllowed ? addBefore : null,
            colName,
            this.addRemoveCellsAllowed ? colRemove : null,
            selectArea,
            moreBtn
        ])

        return newColControl
    }

    swapButton(colID){        
        let result = newElement('button', {class: 'swapBtn miniBtn', dataCol: colID}, newElement('img',{class: 'swapIcon', src: 'swap.svg'}))
        result.onclick = () => this.swapData(result)
        return result
    }

    establishColName(col){
        var name = (col+1).toString(); // default
        if (prefsStore.hasOwnProperty('cols') && prefsStore.cols[col]){
            name = prefsStore.cols[col].title;
            if(col == prefsStore.cols.length-2 && prefsStore.cols.at(-1).title == '===='){ // if we're on the penultimate item and the next item is the copy code '===='      
                name = name.replaceAll('#', '1') // any instance of # should be the number 1
            }
            if (name == '====' && col > 0){ // special code to repeat the last column name (col > 1 as a precaution in case someone sets the first to ====)
                name = prefsStore.cols[prefsStore.cols.length-2].title.replaceAll('#','2') // use name from one before
            }
            if (prefsStore.hasOwnProperty('cols_min') && col+1 > prefsStore.cols_min){
                name = '(' + name + ')'
            }
        } else if (prefsStore.hasOwnProperty('cols') && prefsStore.cols[prefsStore.cols.length-1].title == '====' && col > 0){ // special code to repeat the last column name (col > 1 as a precaution in case someone sets the first to ====)
            let copyNumber = col-prefsStore.cols.length+3 // the nth time the copy has been used (including the original)
            name = '(' + prefsStore.cols[prefsStore.cols.length-2].title.replaceAll('#',copyNumber)  + ')' // use name from one before
        }
        return name
    }

    rowControlsCell(rowID){        
        let row = this.rowIDs.indexOf(rowID)
        let rowCheck = newElement('input', {type: 'checkbox', class: 'rowCheck miniBtn', checked: true, dataRow: rowID})
        let rowNum = newElement('div', {id: `${this.tableId}_${rowID}_rowNum`, class: 'rowNumber'}, row+1)

        let addAbove = newElement('div', {id: `${this.tableId}_${rowID}_addAbove`, class: 'addAbove miniBtn'}, '+')
        let removeRow = newElement('div', {id: `${this.tableId}_${rowID}_remove`, class: 'removeRow miniBtn'}, '-')     

        addAbove.onclick = () => this.do('addRow', {rowID: rowID})
        removeRow.onclick = () => this.do('deleteRow', {rowID: rowID})

        rowCheck.onchange = () => this.toggleEnableRow(rowCheck)

        let rowControlsSpan = newElement('span', {id: `${this.tableId}_${rowID}_controls`, class: 'row-controls'}, [
            addAbove,
            // newElement('br'),
            removeRow
        ])

        let selectArea = newElement('div', {id: `${this.tableId}_${rowID}_selectAreaRow`, class: 'selectAreaRow'}, '&nbsp;')
        selectArea.onclick = (event) => this.selectRow(event, rowID)

        let result = newElement('th',{class: 'rowHeader', id: `${this.tableId}_${rowID}_rowHeader`},[
            rowCheck,
            rowNum,
            rowControlsSpan,
            selectArea
        ])

        return result
    }

    tableData(row, col, newCellID = uuid()){      
        if (newCellID == null){
            newCellID = uuid()
        }  

        let colID = this.colIDs[col]      
        var result = newElement('td',{id: `${this.tableId}_${newCellID}_dataCell`, class: 'dataCell data', dataRow: this.rowIDs[row], dataCol: colID, dataCell: newCellID})
        result.addEventListener('drop', (event) => this.dropHandler(result, event))
        result.addEventListener('dragover', (event) => this.dragOverHandler(result, event))
        result.addEventListener('dragleave', (event) => this.dragLeaveHandler(result, event))
        result.appendChild(this.inputCellText(this.rowIDs[row], colID, newCellID))    
        if (!this.textOnly){
            result.appendChild(this.inputCellDateTime(this.rowIDs[row], colID, newCellID))
            result.appendChild(this.inputCellSelect(this.rowIDs[row], colID, newCellID, col)) // TO DO!
            result.appendChild(this.inputCellExtension(this.rowIDs[row], colID, newCellID))
            result.appendChild(this.inputCellFile(this.rowIDs[row], colID, newCellID))
            result.appendChild(this.inputDetailButton(this.rowIDs[row], colID, newCellID))
            result.appendChild(this.inputCellMore(this.rowIDs[row], colID, newCellID))
        }
        // result.appendChild(inputCellDragPlaceholder())

        if(this.colAcceptsDataType(col,'image')){
            result.classList.add('withImage')
        }

        if(!this.colAcceptsDataType(col,'text')){
            result.classList.add('noText')
        }

        if(this.colAcceptsDataType(col,'select')){
            result.classList.add('withSelect')
        }
        if(this.colAcceptsDataType(col,'datetime')){
            result.classList.add('withDateTime')
        }        

        if(this.colPrefersDetailButton(col)){
            result.classList.add('always-show-detailBtn')
        }

        // add cell to virtual table
        this.cellIDs[row].splice(col, 0, newCellID) // add new cell to cellIDs table

        return result
    }

    getDataCellElement(row,col){
        return document.getElementById(`${this.tableId}_${this.cellIDs[row][col]}_dataCell`)
    }

    inputDetailButton(rowID, colID, cellID){
        let button = newElement('button', {id: `${this.tableId}_${cellID}_detailButton`, tabindex:'-1', class: 'inputCellDetail cellBtn'}, icons.expand)
        button.onclick = () => this.openDetailEditor(rowID, colID, cellID)
        return button
    }

    openDetailEditor(rowID, colID, cellID){
        let cell = document.getElementById(`${this.tableId}_${cellID}_dataCell`)
        let col = this.colIDs.indexOf(colID)
        let row = this.rowIDs.indexOf(rowID)
        let currentText = cell.querySelector('.inputCellText')
        let currentDate = cell.querySelector('.inputCellDate')
        let currentTime = cell.querySelector('.inputCellTime')
        let currentFile = cell.querySelector('.inputCellFile')        
        let currentSelect = cell.querySelector('.inputCellSelect')

        let detailEditor = this.detailEditor || this.makeDetailEditor()
        let detailEditorHeader = detailEditor.querySelector('.detailEditorHeader')        

        detailEditorHeader.innerHTML = `${row+1}: <span style="font-size: 1.2em">${(prefsStore && prefsStore.cols.length > col) ? (prefsStore.cols[col].title ? prefsStore.cols[col].title : prefsStore.cols[col]) : 'Column ' + (col+1)}</span>`

        this.tableElement.parentElement.classList.add('detail-mode') 
        this.setWysiwygContent(currentText.value)

        this.showFilesInDetail(detailEditor, currentFile)

        this.detailEditorCell = cellID

        if(!this.colAcceptsDataType(col, 'text')){
            detailEditor.classList.add('noText')
        } else {
            detailEditor.classList.remove('noText')
        }

        let detailEditorFile = detailEditor.querySelector('.inputCellFile')
        let detailEditorSelect = detailEditor.querySelector('.inputCellSelect')
        let detailEditorDate = detailEditor.querySelector('.inputCellDate')
        let detailEditorTime = detailEditor.querySelector('.inputCellTime')

        let imageSelector = detailEditor.querySelector('.inputCellImageSelector')
        if(imageSelector){
            if(this.colAcceptsDataType(col, 'image')){
                detailEditor.classList.add('withImage')
                imageSelector.disabled = false   
                if (detailEditorFile) detailEditorFile.classList.remove('disabled')
            } else {
                detailEditor.classList.remove('withImage')
                imageSelector.disabled = true
                if (detailEditorFile) detailEditorFile.classList.add('disabled')
            }
        }

        if (detailEditorSelect && this.colAcceptsDataType(col, 'select')){ 
            detailEditor.classList.add('withSelect')
            detailEditorSelect.innerHTML = currentSelect.innerHTML
            detailEditorSelect.value = currentSelect.value
            detailEditorSelect.onchange = () => currentSelect.value = detailEditorSelect.value            
        } else {
            detailEditor.classList.remove('withSelect')
        }

        if (detailEditorDate && this.colAcceptsDataType(col, 'datetime')){
            detailEditor.classList.add('withDateTime')
            if (currentDate.value){
                detailEditorDate.value = currentDate.value
            } else {
                detailEditorDate.value = ''
            }
            if (currentTime.value){
                detailEditorTime.value = currentTime.value
            } else {
                detailEditorTime.value = ''
            }
            detailEditorDate.onchange = () => currentDate.value = detailEditorDate.value
            detailEditorTime.onchange = () => currentTime.value = detailEditorTime.value
        } else {
            detailEditor.classList.remove('withDateTime')
        }

        if (row == 0){
            detailEditor.querySelector('.previous').disabled = true
        } else {
            detailEditor.querySelector('.previous').disabled = false
        }    
        if (row == this.numRows()-1){
            detailEditor.querySelector('.next').innerHTML = icons.add
        } else {
            detailEditor.querySelector('.next').innerHTML = icons.down
        }

        let previewRow = detailEditor.querySelector('.rowPreview')
        if (previewRow && previewRow.dataset.previewRow != rowID){ // only update the preview if it's not already showing the current row (to avoid unnecessary updates when opening and closing the detail editor on the same cell)
            this.populateRowPreview(row, col)
        } else {
            this.setCurrentColInRowPreview(col)
        }
    }

    showFilesInDetail(detailEditor, currentFile){
        let detailEditorFile = detailEditor.querySelector('.inputCellFile')
        if (detailEditorFile){
            if(currentFile && currentFile.innerHTML.trim() != ''){
                // detailEditorFile.classList.remove('hidden')
                detailEditorFile.innerHTML = currentFile.innerHTML
                detailEditor.classList.add('withPreview')
                detailEditorFile.onclick = () => this.showDeleteFileButton(detailEditorFile)
            } else {
                detailEditor.classList.remove('withPreview')
            }
        }        
    }    

    closeDetailEditor(){
        this.disconnectDetailEditorFromCell(false)
        this.tableElement.parentElement.classList.remove('detail-mode')    

        let preview = document.getElementById(`${this.tableId}_rowPreview`)
        if (preview){
            preview.innerHTML = '' // clear the preview when closing the detail editor
            preview.dataset.previewRow = -1 // reset the data attribute to indicate no row is being previewed
        }
    }

    disconnectDetailEditorFromCell(updatePreview = true){
                let cell = document.getElementById(`${this.tableId}_${this.detailEditorCell}_dataCell`)

        this.saveTextFromDetailEditor()

        this.detailEditorCell = null

        let fileContainer = this.detailEditor.querySelector('.inputCellFile')
        if(fileContainer){
            fileContainer.innerHTML = '' // clear the file container in the detail editor
        }


        if(cell.classList.contains('expanded')){
            this.updateMirrorFromText(cell) // if the cell is expanded, update the mirror element to match the new text (if we're just changing the text in the normal view, the mirror will update automatically on input, but if we're changing it in the detail editor, we need to manually update the mirror to match)
        }

        // update relevant preview item
        if (updatePreview) {
            this.updatePreviewForCell(cell)
        }

    }

    updatePreviewForCell(cell){
        let preview = document.getElementById(`${this.tableId}_rowPreview`)
        let previewItem = preview.querySelector(`#${this.tableId}_${cell.dataset.cell}_rowPreviewItem`)
        if (previewItem){
            let textEl = cell.querySelector('.inputCellText')
            if (textEl && textEl.value){
                let textPreview = previewItem.querySelector('.rowPreviewText')
                if (textPreview){
                    textPreview.innerHTML = textEl.value
                    textPreview.title = textEl.value
                } else {
                    textPreview = newElement('div', {class: 'rowPreviewText', title: textEl.value}, textEl.value)
                    previewItem.appendChild(textPreview)
                }
            } else {
                let textPreview = previewItem.querySelector('.rowPreviewText')
                if (textPreview){
                    previewItem.removeChild(textPreview)
                }
            }
            let fileEl = cell.querySelector('.inputCellFile')            
            if (fileEl && fileEl.innerHTML.trim() != ''){
                let filePreview = previewItem.querySelector('.dataImagePreview')
                if (filePreview){
                    filePreview.replaceWith(cloneElement(fileEl, {class: 'dataImagePreview rowImagePreview'}))
                } else {
                    filePreview = cloneElement(fileEl, {class: 'dataImagePreview rowImagePreview'})
                    previewItem.appendChild(filePreview)
                }
            } else {
                let filePreview = previewItem.querySelector('.dataImagePreview')
                if (filePreview){
                    previewItem.removeChild(filePreview)
                }
            }
            let selectEl = cell.querySelector('.inputCellSelect')
            if (selectEl && selectEl.value){
                let selectPreview = previewItem.querySelector('.rowPreviewSelect')
                if (selectPreview){
                    selectPreview.innerHTML = selectEl.options[selectEl.selectedIndex].text
                    selectPreview.title = selectEl.options[selectEl.selectedIndex].text
                } else {
                    selectPreview = newElement('div', {class: 'rowPreviewSelect', title: selectEl.options[selectEl.selectedIndex].text}, selectEl.options[selectEl.selectedIndex].text)
                    previewItem.appendChild(selectPreview)
                }
            } else {
                let selectPreview = previewItem.querySelector('.rowPreviewSelect')
                if (selectPreview){
                    previewItem.removeChild(selectPreview)
                }
            }
            let dateEl = cell.querySelector('.inputCellDate')
            let timeEl = cell.querySelector('.inputCellTime')
            if (dateEl && dateEl.value){
                let dateTimePreview = previewItem.querySelector('.rowPreviewDateTime')
                let dateTimeText = dateEl.value
                if (timeEl && timeEl.value){
                    dateTimeText += ' ' + timeEl.value
                }
                if (dateTimePreview){
                    dateTimePreview.innerHTML = dateTimeText
                    dateTimePreview.title = dateTimeText
                } else {
                    dateTimePreview = newElement('div', {class: 'rowPreviewDateTime', title: dateTimeText}, dateTimeText)
                    previewItem.appendChild(dateTimePreview)
                }
            } else {
                let dateTimePreview = previewItem.querySelector('.rowPreviewDateTime')
                if (dateTimePreview){
                    previewItem.removeChild(dateTimePreview)
                }
            }
        }

    }

    saveTextFromDetailEditor(){
        if(this.detailEditorCell == null) return

        let currentText = this.getWysiwygContent()        
        let cell = document.getElementById(`${this.tableId}_${this.detailEditorCell}_dataCell`)
        let textEl = cell.querySelector('.inputCellText')
        textEl.value = currentText
    }

    saveAndMoveDetailEditor(direction){
        let currentCellID = this.detailEditorCell
        let currentCell = this.coordinatesOf(currentCellID)
        let nextRow
        if (direction == 'next'){
            nextRow = currentCell.row + 1
            if (nextRow >= this.numRows()){
                this.addRow()
                // to do: change the icon to a plus when on the last row
            }
        } else {
            nextRow = currentCell.row - 1
            if (nextRow < 0){
                return // do nothing if we're already on the first row
                // to do: disable the previous button when on the first row
            }
        }
        let nextCellID = this.cellIDs[nextRow][currentCell.col]
        this.disconnectDetailEditorFromCell(false)
        this.openDetailEditor(this.rowIDs[nextRow], this.colIDs[currentCell.col], nextCellID)
    }

    // Another way of editing a cell with a wysiwyg editor
    makeDetailEditor(){                
        const header = newElement('h3', {class: 'detailEditorHeader'})
        const quill = newElement('div', {id: this.tableId+'_detailEditor_wysiwyg', class: 'detailEditorQuill'})
        const fileCell = this.inputCellFile('','','',true) 
        const dateTimeCell = this.inputCellDateTime('','','',true)
        const selectCell = this.inputCellSelect('','','',true)
        const previousButton = newElement('button', {id: this.tableId+'_detailEditor_previousButton', class: 'previous'}, icons.up) 
        const saveButton = newElement('button', {id: this.tableId+'_detailEditor_saveButton', class: 'save'},'OK') 
        const nextButton = newElement('button', {id: this.tableId+'_detailEditor_nextButton', class: 'next'}, icons.down) 

        saveButton.onclick = () => this.closeDetailEditor()
        nextButton.onclick = () => this.saveAndMoveDetailEditor('next')
        previousButton.onclick = () => this.saveAndMoveDetailEditor('previous')

        const buttonsDiv = newElement('div', {class: 'detailEditorButtons'}, [
            previousButton,
            saveButton,
            nextButton
        ])

        const detailEditorContent = newElement('div', {class: 'detailEditorContent'}, [
            header,
            quill,
            dateTimeCell,
            selectCell,
            newElement('div', {class: 'detailEditor_fileContainer'}, [
                fileCell
            ])            
        ])

        const preview = newElement('div', {id: `${this.tableId}_rowPreview`, class: 'rowPreview', dataPreviewRow: -1})

        const container = newElement('div', {id: this.tableId+'_detailEditor', class: 'detailEditor data'}, [
            detailEditorContent,
            buttonsDiv,
            preview
        ])        

        return container
    }        
    
    populateRowPreview(row, currentCol){
        let rowID = this.rowIDs[row]        

        let previewItems = this.cellIDs[row].map((cellID, col) => this.rowPreviewItem(cellID, row, col, col == currentCol ? 'current' : col < currentCol ? 'before' : 'after')) // generate a preview item for each cell in the row, with a class to indicate if it's before, after or the current column

        let preview = document.getElementById(`${this.tableId}_rowPreview`)
        preview.innerHTML = '' // clear the preview
        previewItems.forEach(item => preview.appendChild(item))
        preview.dataset.previewRow = rowID // set the data attribute to the current rowID, this way we know if it needs populating when opening        
    }

    setCurrentColInRowPreview(col){
        let preview = document.getElementById(`${this.tableId}_rowPreview`)
        let previewItems = preview.querySelectorAll('.rowPreviewItem')
        previewItems.forEach((item, index) => {
            item.classList.remove('before', 'after', 'current')
            if (index == col){
                item.classList.add('current')
            } else if (index < col){
                item.classList.add('before')
            } else {
                item.classList.add('after')
            }
        })
    }

    rowPreviewItem(cellID, row, col, position){
        let textEl = this.get('text', row, col)
        let fileEl = this.get('file', row, col)
        let dateEl = this.get('date', row, col)
        let timeEl = this.get('time', row, col)
        let selectEl = this.get('select', row, col)
        const previewItem = newElement('div', {id: `${this.tableId}_${cellID}_rowPreviewItem`, class: `rowPreviewItem ${position}`},
            newElement('h4', {class: 'rowPreviewLabel'}, this.establishColName(col))
        )        
        
        if (textEl.value && this.colAcceptsDataType(col, 'text')){
            let textPreview = newElement('div', {class: 'rowPreviewText', title: textEl.value}, textEl.value)
            previewItem.appendChild(textPreview)
        }
        if (fileEl && fileEl.firstChild && this.colAcceptsDataType(col, 'image')){ // if there's a file in the cell
            let filePreview = fileEl.firstChild.cloneNode(true) // clone the file element to show in the preview (so we don't move it out of the cell)
            filePreview.classList.add('rowImagePreview') // add class for styling
            previewItem.appendChild(filePreview)
        }
        if(dateEl && dateEl.value && timeEl && timeEl.value && this.colAcceptsDataType(col, 'datetime')){
            let dateTimePreview = newElement('div', {class: 'rowPreviewDateTime'}, dateEl.value + ' ' + timeEl.value) // show date and time together in the preview
            previewItem.appendChild(dateTimePreview)
        }
        if(selectEl && selectEl.value && this.colAcceptsDataType(col, 'select')){
            let selectPreview = newElement('div', {class: 'rowPreviewSelect'}, selectEl.options[selectEl.selectedIndex].text) // show the text of the selected option, not the value
            previewItem.appendChild(selectPreview)
        }

        previewItem.onclick = () => {
            this.disconnectDetailEditorFromCell() // close the detail editor to prepare to open again
            this.openDetailEditor(this.rowIDs[row], this.colIDs[col], cellID)// open the detail editor for this cell when the preview item is clicked
        }
        
        return previewItem
    }

    initializeWysiwyg(initialContent){
        if (window.Quill){
            const options = {
                theme: 'snow',
                modules: {
                    toolbar: [
                        ['bold', 'italic', 'strike'],        // toggled buttons
                        ['blockquote', 'code-block', 'link'],

                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],

                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

                        ['clean'],
                    ]
                }
            }
            const quill = new Quill('#'+this.tableId+'_detailEditor_wysiwyg',options) 

            // Customize tooltip placeholder
            const theme = quill.theme;
            const input = theme.tooltip.root.querySelector('input[data-link]');
            input.dataset.link = 'https://mjhaxby.fr/hex/';

            quill.root.innerHTML = initialContent
            this.wysiwyg = quill
            let toolbar = this.detailEditor.querySelector('.ql-toolbar')
            if(toolbar){
                toolbar.appendChild(newElement('span', {class: 'ql-formats'}, this.inputCellImageSelector('','','',true)))
            }
            return this.wysiwyg
        } else {
            // if quill not available, just use a textarea (without wysiwyg features)
            let textarea = newElement('textarea', {id: this.tableId+'_detailEditor_wysiwyg'})
            textarea.value = initialContent
            this.wysiwyg = textarea
            return this.wysiwyg
        }
    }

    getWysiwygContent(){
        if (this.wysiwyg){
            if(window.Quill && markdownUtils){
                let html = this.wysiwyg.getSemanticHTML()
                // normal strikethrough 
                html = html
                    .replace(/<\s*s(\s|>)/gi, '<del$1')
                    .replace(/<\s*\/\s*s\s*>/gi, '</del>')
                    .replace(/<\s*pre(\s|>)/gi, '<code$1')
                    .replace(/<\s*\/\s*pre\s*>/gi, '</code>')
                    // .replace(/<\/p>\s*<p>/gi, '<br>') 
                    // .replace(/<p>/gi, '')
                html = this.normalizeQuillParagraphRuns(html, document)
                let md = markdownUtils.convertHTMLToMarkdown(html, document).trim()
                md = md.replaceAll(/\n/g, '\\n') 
                return md
            } else {
                return this.wysiwyg.value
            }
        }

    }

    // merges paragraphs and add line breaks instead
    normalizeQuillParagraphRuns(html, documentRef = document) {
		const container = documentRef.createElement('div')
		container.innerHTML = html

		const normalized = documentRef.createElement('div')
		let paragraphBuffer = []

		function flushParagraphBuffer() {
			if (paragraphBuffer.length === 0) return

			if (paragraphBuffer.length === 1) {
				normalized.appendChild(paragraphBuffer[0])
				paragraphBuffer = []
				return
			}

			const merged = documentRef.createElement('p')

			paragraphBuffer.forEach((p, index) => {
				while (p.firstChild) {
					merged.appendChild(p.firstChild)
				}

				if (index < paragraphBuffer.length - 1) {
					merged.appendChild(documentRef.createElement('br'))
				}
			})

			normalized.appendChild(merged)
			paragraphBuffer = []
		}

		Array.from(container.childNodes).forEach((node) => {
			if (
				node.nodeType === Node.ELEMENT_NODE &&
				node.tagName === 'P'
			) {
				paragraphBuffer.push(node)
			} else {
				flushParagraphBuffer()
				normalized.appendChild(node)
			}
		})

		flushParagraphBuffer()
		return normalized.innerHTML
	}

setWysiwygContent(content) {
    if (!this.wysiwyg) return;

    // Quill path: Markdown -> HTML (Showdown) -> Delta (Quill clipboard) -> editor
    if (window.Quill && this.wysiwyg.clipboard) {
        const markdown = content ?? '';

        if (markdownUtils) {
            let html = markdownUtils.convertMarkdownToHTMLWithLineBreaks(markdown, true)

            // Quill 2 supports object form: { html, text }
            const delta = this.wysiwyg.clipboard.convert({ html });
            this.wysiwyg.setContents(delta, 'api');
        } else {
            // Fallback if Showdown is unavailable
            this.wysiwyg.setText(markdown, 'api');
        }

        return;
    }

    // Non-Quill fallback (textarea path)
    if (this.wysiwyg && typeof this.wysiwyg.value !== 'undefined') {
        this.wysiwyg.value = content ?? '';
    }

}
    // cellPreview(row, col){
    //     let cellID = this.cellIDs[row][col]
    //     let colID = this.colIDs[col]
    //     let textEl = this.get('text', row, col)
    //     let fileEl = this.get('file', row, col)
    //     let dateEl = this.get('date', row, col)
    //     let timeEl = this.get('time', row, col)
    //     let selectEl = this.get('select', row, col)

    //     const preview = newElement('div', {id: `${this.tableId}_${cellID}_cellPreview`, class: 'cellPreview'})

    //     if (textEl.value && this.colAcceptsDataType(this.colIDs.indexOf(colID), 'text')){
    //         let textPreview = newElement('div', {class: 'cellPreviewText'}, textEl.value)
    //         preview.appendChild(textPreview)
    //     }
    //     if (fileEl && fileEl.firstChild && this.colAcceptsDataType(col, 'image')){ // if there's a file in the cell
    //         let filePreview = fileEl.firstChild.cloneNode(true) // clone the file element to show in the preview (so we don't move it out of the cell)
    //         filePreview.classList.add('cellImagePreview') // add class for styling
    //         preview.appendChild(filePreview)
    //     }

    //     if(selectEl && selectEl.value && this.colAcceptsDataType(col, 'select')){
    //         let selectPreview = newElement('div', {class: 'cellPreviewSelect'}, selectEl.options[selectEl.selectedIndex].text) // show the text of the selected option, not the value
    //         preview.appendChild(selectPreview)
    //     }

    //     return preview
    // }

    // handler for focus on cell, to store the original value for undo purposes
    handleCellInputFocus(event, cellID, rowID, colID, type = 'text'){
        // Replace any pending one-shot capture from a previously focused input
            if (this.pendingCellEditCapture && this.pendingCellEditCapture.abort) {
                this.pendingCellEditCapture.abort();
            }

            const el = event.currentTarget;
            this.holdCellOriginalValue = el.value;
            const controller = new AbortController();
            this.pendingCellEditCapture = controller;

            // Fires once, after the first real input event (for text) or change event (for select, date, time)
            if (type != 'file'){
                el.addEventListener('change', () => {
                    let oValueObject = {}
                    let nValueObject = {}
                    oValueObject[type] = this.holdCellOriginalValue // Store the original value in an object, with the type as the key ('text', 'select', 'date', 'time', 'file'). 
                    nValueObject[type] = el.value // Store the new value in a similar object.

                    // This could be modified later to allow for multiple types to be stored at once (pass an array of types as the type?).
                    if (el.value !== this.holdCellOriginalValue) {
                        this.do('storeCellEdit', { cellID: cellID, oValue: oValueObject, nValue: nValueObject });
                    }
    
                    if (this.pendingCellEditCapture === controller) {
                        this.pendingCellEditCapture = null;
                    }
                }, { once: true, signal: controller.signal });

                el.addEventListener('blur', () => {
                    if (this.pendingCellEditCapture === controller) {
                        controller.abort();
                        this.pendingCellEditCapture = null;
                    }
                }, { once: true, signal: controller.signal });
            } else {
                // to do: (or do nothing for file? we just need to run storeCellEdit when a file is added or removed)
            }


        }

    // inputCellText element
    inputCellText(rowID, colID, cellID){
        let result = newElement('input', {
            id:`${this.tableId}_${cellID}_inputCellText`,
            dataRow: rowID,
            dataCol: colID,
            class: 'inputCellText',
            type: 'text',
            dataCell: cellID
        })

        result.addEventListener('keydown', (event) => {
            this.inputCellTextKey(event, cellID, rowID, colID)
        })

        result.addEventListener('change', (event) => {
            this.updateHoverAndView(event.currentTarget)
        })

        result.addEventListener('paste', (event) => {
            this.pasteInData(event, rowID, colID)
        })

        result.addEventListener('focus', (event) => {         
            this.handleCellInputFocus(event, cellID, rowID, colID, 'text')            
        })

        // if (!this.colAcceptsDataType(this.colIDs.indexOf(colID), 'text')){
        //     result.classList.add('hidden')
        // }
        return result
    }    

    getTableCellTextElement(row,col){
        return document.getElementById(`${this.tableId}_${this.cellIDs[row][col]}_inputCellText`)
    }

    // inputCellDateTime element
    inputCellDateTime(rowID, colID, cellID){
        let date = newElement('input', {
            id: `${this.tableId}_${cellID}_inputCellDate`,
            dataRow: rowID,
            dataCol: colID,
            dataCell: cellID,
            class: 'inputCellDate',
            type: 'date',    
        })
        let time = newElement('input', {
            id: `${this.tableId}_${cellID}_inputCellTime`,
            dataRow: rowID,
            dataCol: colID,
            dataCell: cellID,
            class: 'inputCellTime',
            type: 'time',    
        })       
        let result = newElement('div',{id: `${this.tableId}_${cellID}_inputCellDateTime`, class: 'inputCellDateTime'}, [date, time]) 
        date.addEventListener('change', (event) => {
            this.adjustDateTime(event.currentTarget)         
        })
        time.addEventListener('change', (event) => {
            this.adjustDateTime(event.currentTarget)         
        })
        date.addEventListener('focus', (event) => {
            this.handleCellInputFocus(event, cellID, rowID, colID, 'date')
        })
        time.addEventListener('focus', (event) => {
            this.handleCellInputFocus(event, cellID, rowID, colID, 'time')
        })
        // if(!this.colAcceptsDataType(this.colIDs.indexOf(colID),'datetime')){
        //     result.classList.add('hidden')
        // }
        return result
    }

    inputCellSelect(rowID, colID, cellID, col){
        let select = newElement('select', {
            id: `${this.tableId}_${cellID}_inputCellSelect`,
            dataRow: rowID,
            dataCol: colID,
            dataCell: cellID,
            class: 'inputCellSelect'
        })
        select.addEventListener('focus', (event) => {
            this.handleCellInputFocus(event, cellID, rowID, colID, 'select')
        })
        if (prefsStore.hasOwnProperty('cols') && prefsStore.cols[col] && prefsStore.cols[col].select && prefsStore.cols[col].hasOwnProperty('options')){
            for (let i = 0; i < prefsStore.cols[col].options.length; i++){
                let option = prefsStore.cols[col].options[i]
                let optionValue = (prefsStore.cols[col].optionValues && prefsStore.cols[col].optionValues.length > i && prefsStore.cols[col].optionValues[i]) ? prefsStore.cols[col].optionValues[i] : option // if optionValues provided, use that for the value, otherwise use the option text as the value
                let optionEl = newElement('option', {value: optionValue}, option)
                select.appendChild(optionEl)
            }
        }
        // if(!this.colAcceptsDataType(this.colIDs.indexOf(colID),'select')){
        //     select.classList.add('hidden')
        // }
        
        return select
    }


    // inputCellFile element
    inputCellFile(rowID, colID, cellID){
        let result = newElement('div',{
            id: `${this.tableId}_${cellID}_inputCellFile`,
            class: 'inputCellFile',
            // onmouseenter: 'showInputCellFileOnTop(this)',
            // onmouseleave: 'hideInputCellFileOnTop(this)',
            dataRow: rowID,
            dataCol: colID,
            dataCell: cellID
        })
        if(!this.colAcceptsDataType(this.colIDs.indexOf(colID),'image')){
            result.classList.add('disabled')
        }
        return result
    }

    getTableCellFileElement(row,col){
        let cellID = this.cellIDs[row][col]
        return document.getElementById(`${this.tableId}_${cellID}_inputCellFile`)
    }

    inputCellMore(){
        let el = newElement('button',{class: 'inputCellMore cellBtn', tabindex: -1},'⋮')
        el.addEventListener('click', (event) => {
            event.stopPropagation() // prevent triggering cell selection
            this.toggleCellExtension(event.currentTarget.parentElement)
        })
        return el
    }

    inputCellExtension(row,col, cellID){
        let result = newElement('div',{id: `${this.tableId}_${cellID}_inputCellExtension`, class:'inputCellExtension'})
        result.appendChild(this.inputCellTextMirror(row,col, cellID))
        result.appendChild(this.inputCellImageSelector(row,col, cellID))
        return result
    }

    dragPlaceholder(){
        return newElement('div',{id: `${this.tableId}_dragPlaceHolder`, class: 'dragPlaceholder hidden'},icons.image)
    }

    inputCellTextMirror(row, col, cellID){
        let mirror = newElement('textarea',{id: `${this.tableId}_${cellID}_inputCellTextMirror`, class:'inputCellTextMirror'})
        mirror.addEventListener('keydown', (event) => {
            this.adjustMirrorHeight(event.currentTarget)
        })
        mirror.addEventListener('change', (event) => {
            this.updateTextFromMirror(event.currentTarget)
        })
        return mirror
    }

    inputCellImageSelector(rowID, colID, cellID){    
        let result = newElement('button',{id: `${this.tableId}_${cellID}_inputCellImageSelector`, class:'inputCellImageSelector cellBtn'},icons.image)
        result.addEventListener('click', (event) => {
            this.triggerImportImage(result.closest('.data'))
        })
        if(!this.colAcceptsDataType(this.colIDs.indexOf(colID),'image')){
            result.disabled = true
        }
        return result
    }

    triggerImportImage(dataCell){      
        // treat this as focusing the input and store the original value for undo purposes.  
        this.handleCellInputFocus({currentTarget: dataCell.querySelector('.inputCellImageSelector')}, cellID, dataCell.dataset.row, dataCell.dataset.col, 'file')
        // handled in index.js
        importImage(dataCell)
    }

    // check data types for all columns, then enable or disable accordingly
    checkDataTypeCols(){
        for (let r = 0; r < this.numRows(); r++){
            for (let c = 0; c < this.numCols(); c++){
                this.showHideTextInputElements(r,c)
                this.enableDisableImageElements(r,c)
                this.showHideDateTimeElements(r,c)
                this.showHideSelectInputElements(r,c)
                this.showHideDetailButton(r,c)
            }
        }
    }

    // enable or disable image selector button and file holder according to activity prefs
    enableDisableImageElements(row,col){
        let cellID = this.cellIDs[row][col]
        let cell = this.get('cell', row, col)
        let selector = cell.querySelector('.inputCellImageSelector')
        let fileEl = cell.querySelector('.inputCellFile')

        if (this.colAcceptsDataType(col,'image')){
            if (selector) selector.disabled = false            
            if (fileEl) fileEl.classList.remove('disabled')
            cell.classList.add('withImage')
        } else {            
            if (selector) selector.disabled = true
            if (fileEl) fileEl.classList.add('disabled')
            cell.classList.remove('withImage')
        }
    }

    showHideDateTimeElements(row,col){
        // let cellID = this.cellIDs[row][col]
        // let el = this.get('datetime', row, col)
        let cell = this.get('cell', row, col)
        if (!cell) return
        if (this.colAcceptsDataType(col,'datetime')){
            cell.classList.add('withDateTime')
            // el.classList.remove('hidden')
        } else {
            cell.classList.remove('withDateTime')
            // el.classList.add('hidden')
        }
    }

    showHideTextInputElements(row,col){
        // let cellID = this.cellIDs[row][col]
        // let text = this.get('text', row, col)
        // let textMirror = this.get('textMirror', row, col)
        // if (!text) return

        let cell = this.get('cell', row, col)

        if (cell && this.colAcceptsDataType(col,'text')){
            cell.classList.remove('noText')
        } else {
            cell.classList.add('noText')
        }        
    }

    showHideSelectInputElements(row,col){
        let cell = this.get('cell', row, col)

        if (this.colAcceptsDataType(col,'select')){
            cell.classList.add('withSelect')
        } else {
            cell.classList.remove('withSelect')
        }
    }

    showHideDetailButton(row,col){
        let cell = this.get('cell', row, col)
        if(cell){
            if(this.colPrefersDetailButton(col)){
                cell.classList.add('always-show-detailBtn')
            } else {
                cell.classList.remove('always-show-detailBtn')
            }
        }        
    }

    adjustDateTime(el){
        if(el.classList.contains('inputCellDate')){
            let timeEl = el.parentElement.querySelector('.inputCellTime')
            if (timeEl && timeEl.value == ''){
                timeEl.value = '00:00' // set to midnight if no time, but date set
            }
        } else if (el.classList.contains('inputCellTime')){
            let dateEl = el.parentElement.querySelector('.inputCellDate')
            if(el.value == ''){
                if (dateEl && dateEl.value != ''){
                    el.value = '00:00' // set to midnight if no time, but date set
                }
            } else {
                if (dateEl && dateEl.value == ''){
                dateEl.value = new Date().toISOString().slice(0,10) // set to today's date if no date
            }  
            }                      
        }
    }

    getCellDateTimeValue(row,col){
        let date = this.get('date', row, col)
        let time = this.get('time', row, col)

        if (date && date.value == '' && time && time.value == ''){ // if there's a time but no date, we'll assume they meant today's date
            return ''
        }

        if(date && time){
            // if there's a date but no time, we'll assume they meant midnight, but if there's a time but no date, we'll assume they meant today's date 
            let dateValue = date ? (/\d\d\d\d-\d\d-\d\d/.test(date.value) ? date.value : Date.now().toISOString().slice(0,10)) : ''
            let timeValue = time ? (/\d\d:\d\d/.test(time.value) ? time.value : '00:00') : ''

            let dateTimeValue = dateValue + 'T' + timeValue
            return dateTimeValue.length > 1 ? dateTimeValue : '' // if both are empty, return empty string, otherwise return the combined value
        }
        
        return ''
    }

    getCellSelectValue(row,col){
        let select = this.get('select', row, col)
        if (select){
            return select.value
        }
        return ''
    }

    // check whether column accepts a data type
    colAcceptsDataType(col,types){  
        if(typeof types == 'string'){
            types = [types.toLowerCase()] // if passed a string, put it into array (lowercase)
        } else {
            types = types.map(type => type.toLowerCase()) // (otherwise just check that all types in the array are lowercase)
        }
        let result = false
        types.forEach(type =>{
            if(type == 'text'){ // text is treated specially
                if(!prefsStore.hasOwnProperty('cols') || prefsStore.cols.length <= col || ((prefsStore.hasOwnProperty('cols') && prefsStore.cols.length > col && !prefsStore.cols[col].hasOwnProperty('text'))) ||  // text is assumed accepted… (no columns are specified, or no columns and specified and we're within range)
                   (prefsStore.hasOwnProperty('cols') && prefsStore.cols.length > col && prefsStore.cols[col].hasOwnProperty('text') &&  prefsStore.cols[col].text == true)){ //  unless explicitly stated (columns and specified, no specification of text or text is explicitly marked true)      
                    result = true
                    return true
                } else {
                    result = false
                    return false
                }
            } else if (prefsStore.hasOwnProperty('cols') && prefsStore.cols.length > col && prefsStore.cols[col][type]){ // all others checked against rules
                result = true
                return true
            } else {      
                result = false
                return false
            }
        })
        return result
    }

    colPrefersDetailButton(col){
        if (prefsStore.hasOwnProperty('cols') && prefsStore.cols.length > col && prefsStore.cols[col].hasOwnProperty('defaultShowDetailButton') && prefsStore.cols[col].defaultShowDetailButton == true){
            return true
        }
        return false
    }

    toggleCellExtension(cell,forceOpen=false,updateRowHeaders=true){
        if(forceOpen || !cell.classList.contains('expanded')){
            cell.classList.add('expanded')
            // extension.classList.remove('hidden')
            // text.classList.add('hidden')
            // prepare mirror:    
            this.updateMirrorFromText(cell)
        } else {
            cell.classList.remove('expanded')
            // extension.classList.add('hidden')
            // text.classList.remove('hidden')
        }
        // if(updateRowHeaders){
        //   updateRowHeadersForExpanded()
        // }
    }

    toggleCellExtensionCol(colID){
        let forceOpen = false
        let col = this.colIDs.indexOf(colID)

        // if at least one cell extension in the column is closed, we'll show all of them
        for(let row=0; row<this.numRows() && !forceOpen; row++){
            let cell = this.getDataCellElement(row,col)
            if (!cell.classList.contains('expanded')){
                forceOpen = true
            }
        }

        for(let row=0; row<this.numRows(); row++){
            this.toggleCellExtension(this.getDataCellElement(row,col), forceOpen,false)
        }
        // updateRowHeadersForExpanded()
    }

    updateHoverAndView(el){
        el.setAttribute('title',el.value)
        if (el.classList.contains('invalid')){
            el.classList.remove('invalid')
        }

        let cell = el.closest('.dataCell')
        if (cell.classList.contains('expanded')){ // if the cell is expanded, also update the mirror element to match the new text
            let mirror = document.getElementById(el.id.replace('Text','TextMirror'))
            if (mirror) mirror.value = el.value.replaceAll('\\n','\n')
        }
    }

    updateMirrorFromText(el){
        let extension = el.querySelector('.inputCellExtension')
        let text = el.querySelector('.inputCellText')  
        let mirror = extension.querySelector('.inputCellTextMirror')

        if (text.value == '' && el.classList.contains('withPreview') && (text.getAttribute('data-col'), 'image')){ // if no text, but there is an image, we won't bother with the mirror
            mirror.classList.add('hidden')
        } else {
            mirror.classList.remove('hidden')
            mirror.value = text.value.replaceAll('\\n','\n')
            this.adjustMirrorHeight(mirror)    
        }   
    }

    updateTextFromMirror(el){
        let inputCellText = document.getElementById(el.id.replace('Mirror',''))
        if(inputCellText) inputCellText.value = el.value.replaceAll('\n','\\n')
        // also adjust the height
    }

    adjustMirrorHeight(el){
        el.style.height = null
        el.style.height = (el.scrollHeight)+25+"px"
    }

    selectCol(e, colID){
        const col = this.colIDs.indexOf(colID)
        if(this.selection.row.length > 0) this.deselectAll() // if there are rows selected, we'll clear the selection first
        if (e.getModifierState('Meta') || e.getModifierState('Control')){ // add mode
            var cols = this.lastSelection.col
            if (!cols.includes(col)){
                cols.push(col)
                this.selectionProxy.col = cols
            } else { // if already selected, remove from selection
                let indexOfColInSelection = cols.indexOf(col)
                cols.splice(indexOfColInSelection, 1)
                this.selectionProxy.col = cols
            }
            this.lastSelection = { ...this.selection};
        } else if (e.getModifierState('Shift')) { // add range mode
            if (this.lastSelection.col.length>0){
                if (col > this.lastSelection.col[0]){ // if it's higher than the first one
                    var cols = [this.lastSelection.col[0]] // take first col as new array
                    for (let i=cols[0]+1; i<=col; i++){ // from next col from first selected to col just selected now
                        cols.push(i)
                    }
                } else {
                    var cols = [this.lastSelection.col[this.lastSelection.col.length-1]] // take highest col as new array
                    for (let i=cols[0]; i>=col; i--){ // from highest col selected down to col just selected
                        cols.push(i)
                    }
                }
            } else {
                var cols = [col]
            }
            this.selectionProxy.col = cols
            this.lastSelection = { ...this.selection};
        } else {
            if (this.lastSelection.col.length == 0 || this.lastSelection.col[0] != col){ // if it's not the same as the only one selected
                this.selectionProxy.col = [col]
                this.lastSelection = { ...this.selection};
            } else {
                this.deselectCol(col) // deselect col when clicking a second time
            }
        }
        if (this.selection.col.length > 0){
            document.body.addEventListener('keydown', this.handleKeyDownWithSelection)
            document.body.addEventListener('copy', this.handleCopyWithSelection)
            document.body.addEventListener('cut', this.handleCutWithSelection)
        }
    }

    deselectCol(col){
        var indexOfColInSelection = this.selection.col.indexOf(col)
        this.selectionProxy.col.splice(indexOfColInSelection, 1)
        this.lastSelection = { ...this.selection}
    }

    selectRow(e, rowID){
        const row = this.rowIDs.indexOf(rowID)
        if(this.selection.col.length > 0) this.deselectAll() // if there are columns selected, we'll clear the selection first
        if (e.getModifierState('Meta') || e.getModifierState('Control')){
            var rows = this.lastSelection.row
            if (!rows.includes(row)){
                rows.push(row)
                this.selectionProxy.row = rows
            } else { // if already selected, remove from selection
                let indexOfRowInSelection = rows.indexOf(row)
                rows.splice(indexOfRowInSelection, 1)
                this.selectionProxy.row = rows
            }
            this.lastSelection = { ...this.selection};
        } else if (e.getModifierState('Shift')) { // add range mode
            if (this.lastSelection.row.length>0){
                if (row > this.lastSelection.row[0]){ // if it's higher than the first one
                    var rows = [this.lastSelection.row[0]] // take first row as new array
                    for (let i=rows[0]+1; i<=row; i++){ // from next row from first selected to row just selected now
                        rows.push(i)
                    }
                } else {
                    var rows = [this.lastSelection.row[this.lastSelection.row.length-1]] // take last row as new array
                    for (let i=rows[0]; i>=row; i--){ // from highest row selected down to row just selected
                        rows.push(i)
                    }
                }
            } else {
                var rows = [row]
            }
            this.selectionProxy.row = rows
            this.lastSelection = { ...this.selection};
        } else {
            if (this.lastSelection.row.length == 0 || this.lastSelection.row[0] != row){ // if it's not the same as the only one selected
                this.selectionProxy.row = [row]
                this.lastSelection = { ...this.selection};
            } else {
                this.deselectRow(row) // deselect row when clicking a second time
            }
        }
        if (this.selection.row.length > 0){
            document.body.addEventListener('keydown', this.handleKeyDownWithSelection)
            document.body.addEventListener('copy', this.handleCopyWithSelection)
            document.body.addEventListener('cut', this.handleCutWithSelection)
        }
    }

    deselectRow(row){
        var indexOfRowInSelection = this.selection.row.indexOf(row)
        this.selectionProxy.row.splice(indexOfRowInSelection, 1)
        this.lastSelection = { ...this.selection}
    }

    deselectAll(){
        this.selectionProxy.col = []
        this.selectionProxy.row = []
        // console.log('Deselect')
        document.body.removeEventListener('keydown', this.handleKeyDownWithSelection)
        document.body.removeEventListener('copy', this.handleCopyWithSelection)
        document.body.removeEventListener('cut', this.handleCutWithSelection)
    }

    handleKeyDownWithSelection(e){
        if (this.addRemoveCellsAllowed && (e.key == 'Delete' || (e.key == 'Backspace' && (e.getModifierState('Control') || e.getModifierState('Meta'))))){
            if (this.selection.row.length > 0){
                let rowsToDel = this.selection.row
                // for (let i = rowsToDel.length-1; i >= 0; i--){ // go backwards so when we delete a row it doesn't change the numbering
                //     this.deleteRow(this.rowIDs[rowsToDel[i]])
                // }

                this.do('deleteRows', {rowIDs: rowsToDel.map(rowIndex => this.rowIDs[rowIndex])})

                this.deselectAll()
                this.lastSelection = { ...this.selection};
            } else if (this.selection.col.length > 0){
                let colsToDel = this.selection.col
                // for (let i = colsToDel.length-1; i >= 0; i--){
                //     this.deleteCol(this.colIDs[colsToDel[i]])
                // }
                this.do('deleteCols', {colIDs: colsToDel.map(colIndex => this.colIDs[colIndex])})
                this.deselectAll()
                this.lastSelection = { ...this.selection};
            }
        } else if (e.key == 'Backspace'){
            if (this.selection.row.length > 0){
                for (let i = 0; i < this.selection.row.length; i++){
                    this.do('clearRow', {rowID: this.rowIDs[this.selection.row[i]]})
                }
            } else if  (this.selection.col.length > 0){
                for (let i = 0; i < this.selection.col.length; i++){
                    this.do('clearCol', {colID: this.colIDs[this.selection.col[i]]})
                }
            }
        }
    }    

    handleCopyWithSelection(e){
        e.preventDefault();
        var toCopy = ''
        let cellsToCopy = []

        // first collect all the cells to copy into an array of arrays (rows and columns)
        // if a number of rows are selected, we'll copy all columns for those rows…
        if(this.selection.row.length > 0){
            for (let i=0; i<this.selection.row.length; i++){
                let row = []
                for (let col=0; col<this.numCols(); col++){
                    let cellToCopy = this.get('cell', this.selection.row[i], col)
                    row.push(cellToCopy)
                }                
                cellsToCopy.push(row)
            }
        // …if a number of columns are selected, we'll copy all rows for those columns
        } else if (this.selection.col.length > 0){
            for (let i=0; i<this.numRows(); i++){
                let row = []
                for (let col=0; col<this.selection.col.length; col++){
                    let cellToCopy = this.get('cell', i, this.selection.col[col])
                    row.push(cellToCopy)
                }                
                cellsToCopy.push(row)
            }
        }

        // now collect the actual data to copy
        cellsToCopy.forEach(row => {
            row.forEach(cellToCopy => {
                let text = cellToCopy.querySelector('.inputCellText')
                if(text){
                    toCopy += text.value // TO DO: skip if not text type? (I was going to do this with 'hidden' class, but it doens't take into account mirror usage)
                }
                // TO DO: make more intelligent so we can copy date and time to another column (can we copy JSON and plain text at the same time? or just copy plain text and let the user paste into a date/time column and it will parse it?)
                if(cellToCopy.classList.contains('withDateTime')){
                    let date = cellToCopy.querySelector('.inputCellDate')
                    let time = cellToCopy.querySelector('.inputCellTime')

                    if(date && date.value){
                        toCopy += ' ' + date.value
                    }
                    if(time && time.value){
                        toCopy += ' ' + time.value
                    }
                }
                if (cellToCopy.classList.contains('withSelect')){
                    let select = cellToCopy.querySelector('.inputCellSelect')
                    if(select && select.value){
                        toCopy += ' ' + select.value
                    }
                }
                if(row.length > 1){
                    // no point adding a tab if we only have one column, but if we have more than one column, we'll add a tab between them
                    toCopy += '\t'
                }
            })
            if(row.length > 1){
                // don't trim if there's only one column, because we need to keep spaces in the middle
                toCopy = toCopy.trim()
            }
            toCopy += '\n'
        })
        
        toCopy = toCopy.trim()
        navigator.clipboard.writeText(toCopy);
        console.log('Copy '+toCopy)
    }

    handleCutWithSelection(e){
        this.handleCopyWithSelection(e);
        if(this.selection.row.length > 0){
            for (let row=this.selection.row[0]; row<=this.selection.row.slice(-1); row++){
                this.do('clearRow', {rowID: this.rowIDs[row]})
            }
        } else if (this.selection.col.length > 0){
            for (let col=this.selection.col[0]; col<=this.selection.col.slice(-1); col++){
                this.do('clearCol', {colID: this.colIDs[col]})
            }
        }
    }

    resortSelection(key){
        if (key == 'col' && this.selection.col.length > 0){
            this.selection.col = this.selection.col.sort(function(a, b) {
                return a - b; // need this bit or it will sort 10 before 9 (i.e. fail to sort integers above 9)
            });
        } else if (key == 'row' && this.selection.row.length > 0){
            this.selection.row = this.selection.row.sort(function(a, b) {
                return a - b; // need this bit or it will sort 10 before 9 (i.e. fail to sort integers above 9)
            });
        }
    }

    updateAppearanceForSelection(key,value){
        if (value.length > 0){
            if (key == 'col'){
                for (let i=0; i<value.length; i++){
                    let selectArea = this.get(`colSelectArea`, value[i]) 
                    if(selectArea) selectArea.classList.add('selected')
                    for (let j=0; j<this.numRows(); j++){
                        let cell = this.get('cell', j, value[i])
                        if(cell) cell.classList.add('selected')
                    }
                }
            } else if (key == 'row') {
                for (let i=0; i<value.length; i++){
                    let selectArea = this.get(`rowSelectArea`, value[i])
                    if(selectArea) selectArea.classList.add('selected')
                    for (let j=0; j<this.numCols(); j++){
                        let cell = this.get('cell', value[i], j)
                        if(cell) cell.classList.add('selected')
                    }
                }
            }
        } else {
            let selectedElements = this.tableElement.querySelectorAll('.selected')
            for (let i=0; i<selectedElements.length; i++){
                selectedElements[i].classList.remove('selected')
            }
        }
    }

    updateAppearanceForUnused(){
        let currentUnused = this.tableElement.querySelectorAll('.unused')
        for (let i=0; i<currentUnused.length; i++){
            currentUnused[i].classList.remove('unused')
        }
        if (prefsStore.hasOwnProperty('cols_max') && this.numCols() > prefsStore.cols_max){
            let colName
            let dataCell
            for (let col = prefsStore.cols_max; col<this.numCols(); col++){
                colName = this.get('colName', col)
                if(colName) colName.classList.add('unused')
                for (let row = 0; row < this.numRows(); row++){
                    dataCell = this.get('dataCell', row, col)
                    if(dataCell) dataCell.classList.add('unused')
                }
            }
        }
        if (prefsStore.hasOwnProperty('rows_max') && this.numRows() > prefsStore.rows_max){
            let rowNumber
            let dataCell
            for (let row = prefsStore.rows_max; row<this.numRows(); row++){
                rowNumber = this.get('rowNumber', row)
                if(rowNumber) rowNumber.classList.add('unused')
                for (let col = 0; col < this.numCols(); col++){
                    dataCell = this.get('dataCell', row, col)
                    if(dataCell) dataCell.classList.add('unused')
                }
            }
        }
    }

    swapData(swapBtn){ 
        
        let col1_ID = swapBtn.dataset.col
        let col1 = this.colIDs.indexOf(col1_ID)
        let col2 = col1 - 1

        for (let row = 0; row < this.numRows(); row++) {

            // swap text values
            let text1 = this.get('text', row, col1)
            let text2 = this.get('text', row, col2)
            let text1Hold = text1.value
            let text2Hold = text2.value
            text1.value = text2Hold
            text2.value = text1Hold

            // swap datetime values
            let date1 = this.get('datetime', row, col1)
            let date2 = this.get('datetime', row, col2)
            let date1Hold = date1.value
            let date2Hold = date2.value
            date1.value = date2Hold
            date2.value = date1Hold

            // swap files
            let file1 = this.get('file', row, col1)
            let file2 = this.get('file', row, col2)
            let cell1 = this.get('cell', row, col1)
            let cell2 = this.get('cell', row, col2)
            let file1Hold = file1.innerHTML
            let file2Hold = file2.innerHTML
            let file1Hidden = file1.classList.contains('hidden') || file1.children.length == 0
            let file2Hidden = file2.classList.contains('hidden') || file2.children.length == 0
            file1.innerHTML = file2Hold
            file2.innerHTML = file1Hold
            if(file1Hidden){
                // file2.classList.add('hidden')
                cell2.classList.remove('withPreview')
            } else {
                // file2.classList.remove('hidden')
                cell2.classList.add('withPreview')
            }
            if(file2Hidden){
                // file1.classList.add('hidden')
                cell1.classList.remove('withPreview')
            } else {
                // file1.classList.remove('hidden')
                cell1.classList.add('withPreview')
            }
        }
    }

    // resizeCol(event, colID){
    //     event.preventDefault()
    //     let colIndex = this.colIDs.indexOf(colID)
    //     let startX = event.pageX
    //     let startWidth = this.get('col', colIndex).offsetWidth
    //     let col = this.get('col', colIndex)

    //     const onMouseMove = (e) => {
    //         let newWidth = startWidth + (e.pageX - startX)
    //         col.style.width = newWidth + 'px'
    //         console.log()
    //     }

    //     const dragEnd = () => {
    //         document.removeEventListener('mousemove', onMouseMove)
    //         document.removeEventListener('dragend', dragEnd)
    //     }

    //     document.addEventListener('mousemove', onMouseMove)
    //     document.addEventListener('dragend', dragEnd)
    // }

    revertCell(cellID, value){
        let cell = document.querySelector(`[data-cell="${cellID}"]`)
        if (cell){
            if (value.hasOwnProperty('text')){
                let textInput = cell.querySelector('.inputCellText')
                if (textInput){
                    textInput.value = value.text
                }
            }
            if (value.hasOwnProperty('file')){
                let fileHolder = cell.querySelector('.inputCellFile')
                if (fileHolder){
                    fileHolder.innerHTML = value.file
                    if (value.file == '' || fileHolder.children.length == 0){
                        fileHolder.classList.add('hidden')
                        cell.classList.remove('withPreview')
                    } else {
                        fileHolder.classList.remove('hidden')
                        cell.classList.add('withPreview')
                    }
                }
            }
            if (value.hasOwnProperty('date')){
                let dateInput = cell.querySelector('.inputCellDate')
                if (dateInput){
                    dateInput.value = value.date
                }
            }
             if (value.hasOwnProperty('time')){
                let timeInput = cell.querySelector('.inputCellTime')
                if (timeInput){
                    timeInput.value = value.time
                }
             }
             if (value.hasOwnProperty('select')){
                let selectInput = cell.querySelector('.inputCellSelect')
                if (selectInput){
                    selectInput.value = value.select
                }
             }
        }
    }

    addImageToCell(cellID,fileStoreItem){
        let row = this.cellIDs.findIndex(row => row.includes(cellID))
        let col = this.cellIDs[row].indexOf(cellID)    

        let fileHolder = this.get('file', row, col)
        if(fileStoreItem && !fileStoreItem.hasOwnProperty('content') && fileStoreItem.hasOwnProperty('data')){
            fileStoreItem.content = `data:image/${fileStoreItem.ext};base64, ${fileStoreItem.data}`
        } else if (fileStoreItem && fileStoreItem.hasOwnProperty('content')){
            fileStoreItem.data = fileStoreItem.content.split(',')[1] // get just the data in case we need it (notably for svg)
        } else {
            console.error('No content or data in fileStoreItem')
            return
        }
        if (fileHolder){
            let imagePreview = newElement(fileStoreItem.ext == 'svg' ? 'div' : 'img',{
                class: 'dataImagePreview',
                dataExt: fileStoreItem.ext,
                dataFileSize: fileStoreItem.fileSize,
                dataType: fileStoreItem.type
            })
            imagePreview.onclick = () => this.showDeleteFileButton(imagePreview.parentElement)  
            if (fileStoreItem.ext == 'svg'){
                // put SVG in, keep a copy in the div
                imagePreview.innerHTML = atob(fileStoreItem.data)
                imagePreview.setAttribute('data-src',fileStoreItem.content)
            } else {
                // for png etc. just use base64
                imagePreview.src = fileStoreItem.content
            }    
            if (fileStoreItem.hasOwnProperty('dimensions')){
                imagePreview.style.aspectRatio = fileStoreItem.dimensions.width + '/' + fileStoreItem.dimensions.height    
                imagePreview.setAttribute('data-width', fileStoreItem.dimensions.width)
                imagePreview.setAttribute('data-height', fileStoreItem.dimensions.height) 
            }

            let deleteBtn = newElement('button', {class: 'fileDeleteBtn hidden'},'×')
            deleteBtn.onclick = () => this.deleteFile(deleteBtn.parentElement)

            fileHolder.innerHTML = '' // remove any existing files
            fileHolder.appendChild(imagePreview)
            fileHolder.appendChild(deleteBtn)
            fileHolder.classList.remove('hidden') 
            fileHolder.parentElement.classList.add('withPreview')

            let inputCellTextMirror = this.get('textMirror', row, col)
            if (inputCellTextMirror && inputCellTextMirror.value == ''){
                inputCellTextMirror.classList.add('hidden')
            }
            
            let inputBox = document.getElementById('inputBox')
            if (inputBox && inputBox.classList.contains('detail-mode')){
                this.showFilesInDetail(document.getElementById(this.tableId+'_detailEditor'), fileHolder)
            }
        } else {
            console.error('File holder element missing')
        }
    }

    showDeleteFileButton(cell){
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

    deleteFile(inputFileCell){
        inputFileCell.innerHTML = ''
        inputFileCell.parentElement.classList.remove('withPreview')
        inputFileCell.classList.add('hidden')

        // in case the cell is extended, unhide the text mirror (if it was hidden)
        let mirror = inputFileCell.parentElement.querySelector('.inputCellTextMirror')
        if(mirror){
            mirror.classList.remove('hidden')
        }
    }

    dropHandler(cell, e){        
        e.preventDefault()

        let files = []
        let cellID = cell.dataset.cell

        if (e.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            [...e.dataTransfer.items].forEach((item, i) => {
                // If dropped items aren't files, reject them
                if (item.kind === "file") {
                    const file = item.getAsFile();
                    files.push(file)          
                }
            });
        } else {
            // Use DataTransfer interface to access the file(s)
            [...e.dataTransfer.files].forEach((file, i) => {
                files.push(file)
            });
        }

        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                if (files[i].type.includes('image')) {
                    const reader = new FileReader();

                    reader.onload = (evt) => {
                        var image = new Image();
                        image.src = evt.target.result;

                        const file = {
                            name: files[i].name,
                            type: files[i].type.split('/')[0], // we don't need the bit after the slash (e.g. image/png -> img)
                            ext: files[i].name.split('.').pop(), // get the extension from the filename
                            fileSize: files[i].size,
                            dimensions: {width: image.width, height: image.height},
                            content: evt.target.result, // Base64 or text content
                        };
                        this.addImageToCell(cellID, file)
                    };

                    reader.readAsDataURL(files[i]);
                }
            }
        }

        this.dragLeaveHandler(cell, e)
    }

    dragOverHandler(cell, e){

        if(this.draggingTableRow) return

        let placeHolder = document.getElementById(this.tableId+'_dragPlaceHolder')
        let cellPos = cell.getBoundingClientRect()
        placeHolder.style.top = `calc(${cellPos.top}px + 0.25em)`
        placeHolder.style.left = `calc(${cellPos.left}px + 0.25em)`
        placeHolder.style.height = `calc(${cellPos.height}px - 1.5em)`
        placeHolder.style.width = `calc(${cellPos.width}px - 1.5em)`
        placeHolder.classList.remove('hidden')
        document.body.appendChild(placeHolder)
    }

    dragLeaveHandler(cell, e){
        if (this.draggingTableRow) return

        let placeHolder = document.getElementById(this.tableId+'_dragPlaceHolder')
        placeHolder.classList.add('hidden')
    }

    pasteInData(e, rowID, colID){  
        let clipboardData = e ? e.clipboardData || window.clipboardData : window.clipboardData;
        let pastedData = clipboardData.getData('Text');
        var dataAsArray = returnJSONorArray(pastedData)
        let row = this.rowIDs.indexOf(rowID)
        let col = this.colIDs.indexOf(colID)

        // only continue pasting in data if there is more than one row and/or more than one column. Otherwise, paste as normal (text rather than data)
        if (dataAsArray.length > 1 || (dataAsArray.length > 0 && dataAsArray[0].length > 1)){
            e.stopPropagation();
            e.preventDefault();
            this.convertArrayToTableData(dataAsArray,row,col)
        }
    }

    inputCellTextKey(e, cellID, rowID, colID){
        var charPos = e.target.selectionStart;
        var strLength = e.target.value.length;
        var colToChoose = 1;        

        const row = parseInt(this.rowIDs.indexOf(rowID))
        const col = parseInt(this.colIDs.indexOf(colID))

        if (isNaN(row) || isNaN(col) || row < 0 || col < 0){
            console.error('Could not find row or column for cellID '+cellID)
            return
        }

        let newFocus = null

        if (!e.isComposing){　// don't do anything if we're composing (e.g in Japanese)
            if (e.key == 'Backspace' || e.key == 'Delete'){
                let rowEl = this.getTableRowElement(row)
                let allBlank = true
                for (let i=1; i<rowEl.children.length-1; i++){ // check all except last col (where plus button is)
                    if (rowEl.children[i].children[0].value != ''){
                        allBlank = false
                    }
                }
                if (allBlank){
                    e.preventDefault();
                    this.do('deleteRow', {rowID: this.rowIDs[row]})
                }
            } else if (e.key == 'Enter' || e.key == 'ArrowDown' || (e.key == 'Tab' && row == this.numRows() && col == this.numCols())){ // tab only when in the last cell
                e.preventDefault();
                if (row < this.numRows()){
                    if (e.key == 'Enter' || e.key == 'Tab'){
                        colToChoose = 0 // always go back to first col with enter or tab
                    } else {
                        colToChoose = col
                    }                    
                    newFocus = this.get('text', row+1, colToChoose)
                } else if ((e.key == 'Enter' || e.key == 'Tab') && this.addRemoveCellsAllowed) {
                    this.do('addRow')                
                    newFocus = this.get('text', row+1, 1)
                }
            } else if (e.key == 'ArrowUp' && row > 0){                
                newFocus = this.get('text', row-1, col)                
            } else if (e.key == 'ArrowLeft' && col > 0 && charPos == 0){
                e.preventDefault();                
                newFocus = this.get('text', row, col-1)
            } else if (e.key == 'ArrowRight' && col < this.numCols() && charPos == strLength) {
                e.preventDefault();
                newFocus = this.get('text', row, col+1)
            } else if (e.key == 'Tab' && e.getModifierState('Alt') && this.addAddRemoveCellsAllowed){ // alt+tab = add col
                e.preventDefault();
                if (e.getModifierState('Shift') && this.isEmptyCol(col)){ // alt+shift+tab = remove col if empty
                    this.deleteCol(this.colIDs[col]) // only if empty??
                    newFocus = this.get('text', row, col-1)
                } else {
                    this.addCol(colID)
                    newFocus = this.get('text', row, col+1)
                }
            }
        }

        if (newFocus){
            let newFocusCol = parseInt(this.colIDs.indexOf(newFocus.dataset.col))
            let newFocusRow = parseInt(this.rowIDs.indexOf(newFocus.dataset.row))
            if (newFocus.classList.contains('hidden')){ 
                if(this.colAcceptsDataType(newFocusCol, 'text')){ // if it accepts text, we'll show the mirror (if it's hidden) and focus on that
                    if (newFocus.parentElement.classList.contains('expanded')){
                        newFocus = newFocus.parentElement.querySelector('.inputCellTextMirror')
                    }
                } else {
                    if (this.colAcceptsDataType(newFocusCol, 'select')){
                        newFocus = this.get('select', newFocusRow, newFocusCol)                    
                    } else if (this.colAcceptsDataType(newFocusCol, 'datetime')){
                        newFocus = this.get('date', newFocusRow, newFocusCol)
                    } else if (this.colAcceptsDataType(newFocusCol, 'file')){
                        newFocus = this.get('file', newFocusRow, newFocusCol)
                    } 
                }
            }
            newFocus.focus()
        }
    }

    getFilesFromCell(row, col){
        let inputFileCell = this.get('file', row, col)
        if(!inputFileCell) return null
        let inputFile = inputFileCell.children[0]
        if(inputFileCell.classList.contains('disabled') || inputFileCell.classList.contains('hidden') || inputFileCell.children.length == 0){
            return null
        } else {
            let file = {}
            file.type = inputFile.getAttribute('data-type')
            file.ext = inputFile.getAttribute('data-ext')
            file.fileSize = inputFile.getAttribute('data-file-size')
            if (file.type == 'image'){
                file.dimensions = {height: inputFile.getAttribute('data-height'), width: inputFile.getAttribute('data-width')}
                if(file.ext == 'svg'){
                    file.data = inputFile.getAttribute('data-src').split(',')[1].trim() // get just the data (everything after comma) and trim to remove any whitespace
                } else {
                    file.data = inputFile.getAttribute('src').split(',')[1].trim() // get just the data (everything after comma) and trim to remove any whitespace
                }
            } else {
                console.log('Other file types not yet supported.')
            }

            let files = {}
            files[file.type] = file

            return files
        }
    }

    convertArrayToTableData(array, startRow = 0, startCol = 0){
        for (let row=startRow; row<(startRow+array.length); row++){
            if (this.numRows() <= row){ // if there isn't a row
                this.addRow() // add one
            }
            for (let col=startCol; col<(startCol+array[row-startRow].length); col++){
                if (this.numCols() <= col){ // if there isn't a col
                    this.addCol() // add one
                }
                // put the data in the inputCellText
                let inputCellText = this.get('text', row, col)

                if(typeof array[row-startRow][col-startCol] == 'string'){
                    inputCellText.value = array[row-startRow][col-startCol].replaceAll('\n','\\n')
                } else {
                    inputCellText.value = array[row-startRow][col-startCol].text.replaceAll('\n','\\n')
                    if (array[row-startRow][col-startCol].image && 
                        Object.keys(array[row-startRow][col-startCol].image).length > 0) {
                        this.addImageToCell(this.cellIDs[row][col], array[row-startRow][col-startCol].image) 
                    }
                    if (array[row-startRow][col-startCol].hasOwnProperty('datetime') && array[row-startRow][col-startCol].datetime){
                        let inputCellDate = this.get('date', row, col)                        
                        let inputCellTime = this.get('time', row, col)                        
                        if(inputCellDate && inputCellTime){
                            inputCellDate.value = array[row-startRow][col-startCol].datetime.split('T')[0]
                            inputCellTime.value = array[row-startRow][col-startCol].datetime.split('T')[1]
                        }
                    }
                }

                this.updateHoverAndView(inputCellText) // onchange won't be fired, so we'll do it manually here
            }
        }
    }

    // for internal handling only, not for output to activity
    getRowData(row){
        var rowData = []
        for (let col=0; col<this.numCols(); col++){
            rowData.push(this.getCellData(row, col))
        }
        return rowData
    }

    // for internal handling only, not for output to activity
    getColData(col){
        var colData = []
        for (let row=0; row<this.numRows(); row++){
            colData.push(this.getCellData(row, col))
        }
        return colData
    }

    // for internal handling only, not for output to activity
    getCellData(row, col){
        let cellTextElement = this.get('text', row, col)
        let cellValue = cellTextElement ? cellTextElement.value : ''
        let cellDateTimeElement = this.get('datetime', row, col)
        let cellDateTimeValue = this.getCellDateTimeValue(row, col)
        let fileValue = this.getFilesFromCell(row, col)

        return {text: cellValue, datetime: cellDateTimeValue, file: fileValue}
    }

    convertTableDataToArray(startRow = 0, startCol = 0, endRow = this.numRows()-1, endCol = this.numCols()-1, santizeHTML=false, includeAllDataTypes = true, skippedDisabled = false){
        var rowsArray = []
        var colsArray = []
        for (let row=startRow; row<=endRow; row++){
            if(!skippedDisabled || !this.isDisabledRow(row)){
                
                colsArray = []

                for (let col=startCol; col<=endCol; col++){
                    let cellElement = this.get('text', row, col)
                    let cellValue = cellElement ? cellElement.value : ''
                    let cell

                    if (santizeHTML){
                        cellValue = cellValue.replaceAll('<','&lt;').replaceAll('>','&gt;')
                    }

                    if(includeAllDataTypes && (this.colAcceptsDataType(col, ['image']) || this.colAcceptsDataType(col, ['sound']) || this.colAcceptsDataType(col, ['datetime']) || this.colAcceptsDataType(col, ['select']))){
                        cell = {text: cellValue}

                        let files = this.getFilesFromCell(row, col)
                        if(files){
                            for (const type in files) {
                                cell[type] = files[type]
                            }
                        }        
                        if (this.colAcceptsDataType(col, ['datetime'])){
                            cell.datetime = this.getCellDateTimeValue(row, col)
                        }
                        if (this.colAcceptsDataType(col, ['select'])){
                            cell.select = this.getCellSelectValue(row, col)
                        }
                    } else {
                        cell = cellValue
                    }

                    colsArray.push(cell)
                }
                rowsArray.push(colsArray)
            }
        }
        return rowsArray
    }

    convertTableToTrimmedArray(santizeHTML=false,includeAllDataTypes=false){
        var endRow = this.numRows()-1
        var endCol = this.numCols()-1
        var inputArray = []

        if (prefsStore.hasOwnProperty('rows_max') && prefsStore.rows_max < this.numRows()){
            endRow = prefsStore.rows_max-1
        }
        if (prefsStore.hasOwnProperty('cols_max') && prefsStore.cols_max < this.numCols()){
            endCol = prefsStore.cols_max-1
        }
        inputArray = this.convertTableDataToArray(0,0,endRow,endCol,true,includeAllDataTypes,true)

        // get rid of trailing empty rows (don't bother with the first row, so as to not risk passing something empty)
        for (let row = inputArray.length-1; row>=0; row--){     
            if (this.isNotEmptyRow(row,inputArray)){
                row = -1 // as soon as we've found a non-empty row, stop looking
            } else {
                inputArray.pop(); // we should always be on the last row, so delete it if it's empty
            }
        }
        return inputArray;
    }

    convertTableDataToBlock(){
        var furthestCol = this.determineFurthestCol()
        var furthestRow = this.determineFurthestRow()
        var textBlock = ''
        if (prefsStore.hasOwnProperty('cols_max') && furthestCol > prefsStore.cols_max){
            furthestCol = prefsStore.cols_max
        }
        if (prefsStore.hasOwnProperty('rows_max') && furthestRow > prefsStore.rows_max){
            furthestRow = prefsStore.rows_max
        }
        for (let row=0; row<<furthestRow; row++){
            for (let col=1; col<=furthestCol; col++){
                let cellElement = this.get('text', row, col)
                if (cellElement){
                    
                    textBlock += this.get('text', row, col).value // TO DO: skip if not text type? (I was going to do this with 'hidden' class, but it doens't take into account mirror usage)

                    let dateTimeElement = this.get('datetime', row, col)
                    if (!dateTimeElement.classList.contains('hidden')){
                        textBlock += this.getCellDateTimeValue(row,col)
                    }
                    
                }                
                textBlock += '\t'
            }
            textBlock = textBlock.trim()
            textBlock += '\n'
        }
        return textBlock.trim()
    }

    convertTableDataToJSONString(){
        let obj = this.convertTableDataToArray()
        return JSON.stringify(obj)
    }



    determineFurthestCol(){
        for (let i=this.numCols(); i>=1; i--){
            if (!this.isEmptyCol(i)){
                return i
            }
        }
        return 0
    }

    determineFurthestRow(){
        for (let i=this.numRows(); i>=1; i--){
            if (!this.isEmptyRow(i)){
                return i
            }
        }
        return 0
    }

    isEmptyRow(row){
        for(let i=0; i<this.numCols(); i++){
            if(this.isEmptyCell(row, i) == false){
                return false
            }
        }
        return true
    }

    isNotEmptyRow(row,inputArray = this.convertTableDataToArray()){ // to do: doesn't check for datetime (but could maybe do this with a modification to convertTableDataToArray)
        for (let col = inputArray[row].length-1; col>=0; col--){
            if ((typeof inputArray[row][col] == 'string' && inputArray[row][col] != '') || (typeof inputArray[row][col] == 'object' && (inputArray[row][col].text != '' || inputArray[row][col].hasOwnProperty('image')))){
                return true
            }
        }
        return false
    }

    isEmptyCol(col){
        if (col >= this.numCols()) return false // safeguard
        
        for(let i=0; i<this.numRows(); i++){
            if(this.isEmptyCell(i, col) == false){
                return false
            }
        }
        return true
    }

    isEmptyCell(row, col){
        var inputCellText = this.get('text', row, col)
        var inputCellFile = this.get('file', row, col)
        var inputCellDate = this.get('date', row, col)
        if (inputCellText && inputCellText.value != '') return false
        if (inputCellFile && !inputCellFile.classList.contains('hidden') && inputCellFile.children.length > 0) return false
        if (inputCellDate && inputCellDate.value != '') return false
        return true
    }

    isDisabledRow(row){
        let rowElement = this.getTableRowElement(row)
        if(rowElement && rowElement.classList.contains('disabled')){
            return true
        }
        return false
    }

    rowContainsEmptyCell(row){
        if (row >= this.numRows()) return false // safeguard

        for(let i=0; i<this.numCols(); i++){
            var inputCellText = this.get('text', row, i)
            var inputCellFile = this.get('file', row, i)
            var inputCellDate = this.get('date', row, i)
            if ((inputCellText && inputCellText.value == '')  && (inputCellFile && inputCellFile.classList.contains('hidden' ) && inputCellFile.children.length == 0)  && (inputCellDate && inputCellDate.value == '')){
                return true
            }
        }
        return false
    }

    colContainsEmptyCell(col){
        for(let i=0; i<this.numRows(); i++){
            var inputCellText = this.get('text', i, col)
            var inputCellFile = this.get('file', i, col)
            var inputCellDate = this.get('date', i, col)
            if ((inputCellText && inputCellText.value == '')  && (inputCellFile && inputCellFile.classList.contains('hidden' ) && inputCellFile.children.length == 0)  && (inputCellDate && inputCellDate.value == '')){
                return true
            }
        }
        return false
    }

    isEmpty(){
        var inputCellTexts = this.tableElement.querySelectorAll('.inputCellText')
        for(let i=0; i<inputCellTexts.length;i++){
            if (inputCellTexts[i].value != ''){
                return false
            }
        }
        var inputCellFiles = this.tableElement.querySelectorAll('.inputCellFile')
        for(let i=0; i<inputCellFiles.length;i++){
            if (!inputCellFiles[i].classList.contains('hidden') && inputCellFiles[i].children.length > 0){
                return false
            }
        }
        var inputCellDates = this.tableElement.querySelectorAll('.inputCellDates')
        for(let i=0; i<inputCellDates.length;i++){
            if (inputCellDates[i].value != ''){
                return false
            }
        }
        return true // if it's not returned false at any point, it must be true
    }

    renumberRows(animate=true){
        let rowNumbers = this.tableElement.querySelectorAll('.rowNumber')
        for(let i=0; i<rowNumbers.length; i++){
            let oldText = rowNumbers[i].textContent
            let newText = i + 1
            if(animate){
                if (oldText != newText){
                    rowNumbers[i].classList.add('renumbered')
                    setTimeout(() => {
                        rowNumbers[i].textContent = newText
                    }, 250)
                    setTimeout(() => {
                        rowNumbers[i].classList.remove('renumbered')
                    }, 500)
                }
            } else {
                rowNumbers[i].textContent = newText
            }
        }
    }

    enableTableRowSorting(){
        if (!window.Sortable){
            console.warn('SortableJS not found, cannot enable row sorting')
            return
        }

        let sortable = Sortable.create(this.tableElement.querySelector('tbody'), {
            draggable: '.tableRow',
            handle: '.rowHeader',
            onStart: (e) => {
                this.draggingTableRow = true
            },
            onEnd: (e) => {
                let oldIndex = e.oldIndex -1
                let newIndex = e.newIndex -1 // -1 on both to account for header row (which isn't in the rowIDs array)
                this.rowIDs.splice(newIndex, 0, this.rowIDs.splice(oldIndex, 1)[0]) // move the rowID in the array to match the new order of the rows
                this.cellIDs.splice(newIndex, 0, this.cellIDs.splice(oldIndex, 1)[0]) // move the cellIDs in the array to match the new order of the rows
                this.draggingTableRow = false
                this.renumberRows()
            }
        })

        this.tableElement.classList.add('sortable')

        return sortable
    }

}