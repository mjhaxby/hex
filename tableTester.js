class TableTester extends TableManager {
    testAll(){
        console.log('Starting table tests...')
        this.testIds()
        this.testAddRow()
        this.testDeleteRow()
        this.testAddCol()
        this.testDeleteCol()
        this.testIds()
        this.testPasteData()
        this.testClearTable(true)
        this.testIds(true) // deep test to also check IDs on input elements
        console.log('Table tests completed')
    }

    testAddRow(){
        let existingNumRows = this.numRows()
        console.log('Testing addRow...')        
        this.addRow()
        if (this.numRows() != existingNumRows + 1){
            console.warn('addRow test failed: expected ' + (existingNumRows + 1) + ' rows but got ' + this.numRows())
        } else {
            console.log('addRow test passed')
        }
        existingNumRows = this.numRows()
        console.log('Testing do(addRow)')
        this.do('addRow')
        if (this.numRows() != existingNumRows + 1){
            console.warn('do(addRow) test failed: expected ' + (existingNumRows + 2) + ' rows but got ' + this.numRows())
        } else {
            console.log('do(addRow) test passed')

            console.log('Testing undo() after do(addRow)')
            this.undo()
            if (this.numRows() != existingNumRows){
                console.warn('undo() after do(addRow) test failed: expected ' + (existingNumRows) + ' rows but got ' + this.numRows())
            } else {
                console.log('undo() after do(addRow) test passed')

                console.log('Testing redo() after undo()')
                this.redo()
                if (this.numRows() != existingNumRows + 1){
                    console.warn('redo() after undo() test failed: expected ' + (existingNumRows + 1) + ' rows but got ' + this.numRows())
                } else {
                    console.log('redo() after undo() test passed')
                }
            }
        } 

        existingNumRows = this.numRows()
        console.log('Testing addRow button click...')
        let addRowButton = this.tableElement.querySelector('.addBottom.miniBtn')
        addRowButton.click()
        if (this.numRows() != existingNumRows + 1){
            console.warn('addRow button click test failed: expected ' + (existingNumRows + 1) + ' rows but got ' + this.numRows())
        } else {
            console.log('addRow button click test passed')
        }
             
    }

    testDeleteRow(){
        if (this.numRows() <= 5){
            let rowsToAdd = 6 - this.numRows()
            console.log('Adding ' + rowsToAdd + ' rows to ensure there are enough rows to test deleteRow...')
            for (let i = 0; i < rowsToAdd; i++){
                this.addRow()
            }
        }
        let existingNumRows = this.numRows()
        console.log('Testing deleteRow...')        
        this.deleteRow(this.rowIDs[0])
        if (this.numRows() != existingNumRows - 1){
            console.warn('deleteRow test failed: expected ' + (existingNumRows - 1) + ' rows but got ' + this.numRows())
        } else {
            console.log('deleteRow test passed')
        }
        console.log('Testing do(deleteRow)')
        existingNumRows = this.numRows()
        this.do('deleteRow', {rowID: this.rowIDs[0]})
        if (this.numRows() != existingNumRows - 1){
            console.warn('do(deleteRow) test failed: expected ' + (existingNumRows - 1) + ' rows but got ' + this.numRows())
        } else {
            console.log('do(deleteRow) test passed')

            console.log('Testing undo() after do(deleteRow)')
            this.undo()
            if (this.numRows() != existingNumRows){
                console.warn('undo() after do(deleteRow) test failed: expected ' + (existingNumRows) + ' rows but got ' + this.numRows())
            } else {
                console.log('undo() after do(deleteRow) test passed')

                console.log('Testing redo() after undo()')
                this.redo()
                if (this.numRows() != existingNumRows - 1){
                    console.warn('redo() after undo() test failed: expected ' + (existingNumRows - 1) + ' rows but got ' + this.numRows())
                } else {
                    console.log('redo() after undo() test passed')
                }
            }
        }

        existingNumRows = this.numRows()
        console.log('Testing deleteRow button click...')
        let deleteRowButton = this.tableElement.querySelector('.removeRow.miniBtn')
        deleteRowButton.click()
        if (this.numRows() != existingNumRows - 1){
            console.warn('deleteRow button click test failed: expected ' + (existingNumRows - 1) + ' rows but got ' + this.numRows())
        } else {
            console.log('deleteRow button click test passed')
        }
    }

    testAddCol(){
        let existingNumCols = this.numCols()
        console.log('Testing addCol...')        
        this.addCol()
        if (this.numCols() != existingNumCols + 1){
            console.warn('addCol test failed: expected ' + (existingNumCols + 1) + ' cols but got ' + this.numCols())
        } else {
            console.log('addCol test passed')
        }
        console.log('Testing do(addCol)')
        existingNumCols = this.numCols()
        this.do('addCol')
        if (this.numCols() != existingNumCols + 1){
            console.warn('do(addCol) test failed: expected ' + (existingNumCols + 1) + ' cols but got ' + this.numCols())
        } else {
            console.log('do(addCol) test passed')

            console.log('Testing undo() after do(addCol)')
            this.undo()
            if (this.numCols() != existingNumCols){
                console.warn('undo() after do(addCol) test failed: expected ' + (existingNumCols) + ' cols but got ' + this.numCols())
            } else {
                console.log('undo() after do(addCol) test passed')

                console.log('Testing redo() after undo()')
                this.redo()
                if (this.numCols() != existingNumCols + 1){
                    console.warn('redo() after undo() test failed: expected ' + (existingNumCols + 1) + ' cols but got ' + this.numCols())
                } else {
                    console.log('redo() after undo() test passed')
                }
            }
        }
        existingNumCols = this.numCols()
        console.log('Testing addCol button click...')
        let addColButton = this.tableElement.querySelector('.addRight.miniBtn')
        addColButton.click()
        if (this.numCols() != existingNumCols + 1){
            console.warn('addCol button click test failed: expected ' + (existingNumCols + 1) + ' cols but got ' + this.numCols())
        } else {
            console.log('addCol button click test passed')
        }
    }

    testDeleteCol(){
        if (this.numCols() <= 5){
            let colsToAdd = 6 - this.numCols()
            console.log('Adding ' + colsToAdd + ' cols to ensure there are enough cols to test deleteCol...')
            for (let i = 0; i < colsToAdd; i++){
                this.addCol()
            }
        }
        let existingNumCols = this.numCols()
        console.log('Testing deleteCol...')        
        this.deleteCol(this.colIDs[0])
        if (this.numCols() != existingNumCols - 1){
            console.warn('deleteCol test failed: expected ' + (existingNumCols - 1) + ' cols but got ' + this.numCols())
        } else {
            console.log('deleteCol test passed')
        }
        console.log('Testing do(deleteCol)')
        existingNumCols = this.numCols()
        this.do('deleteCol', {colID: this.colIDs[0
]})
        if (this.numCols() != existingNumCols - 1){
            console.warn('do(deleteCol) test failed: expected ' + (existingNumCols - 1) + ' cols but got ' + this.numCols())
        } else {
            console.log('do(deleteCol) test passed')

            console.log('Testing undo() after do(deleteCol)')
            this.undo()
            if (this.numCols() != existingNumCols){
                console.warn('undo() after do(deleteCol) test failed: expected ' + (existingNumCols) + ' cols but got ' + this.numCols())
            } else {
                console.log('undo() after do(deleteCol) test passed')

                console.log('Testing redo() after undo()')
                this.redo()
                if (this.numCols() != existingNumCols - 1){
                    console.warn('redo() after undo() test failed: expected ' + (existingNumCols - 1) + ' cols but got ' + this.numCols())
                } else {
                    console.log('redo() after undo() test passed')
                }
            }
        }

        existingNumCols = this.numCols()
        console.log('Testing deleteCol button click...')
        let deleteColButton = this.tableElement.querySelector('.removeCol.miniBtn')
        deleteColButton.click()
        if (this.numCols() != existingNumCols - 1){
            console.warn('deleteCol button click test failed: expected ' + (existingNumCols - 1) + ' cols but got ' + this.numCols())
        } else {
            console.log('deleteCol button click test passed')
        }
    }        

    testPasteData(){
        console.log('Similating testing pasteData... ⚠️ Note that this doesn\'t actually test the paste event itself but fakes it.')
        const data = [['one','two','three'],['four','five','six'],['seven','eight','nine']]
        let clipboardText = JSON.stringify(data)
        let targetCell = this.tableElement.querySelector('.inputCellText')
        targetCell.focus()
        this.pasteInData({clipboardData: {getData: () => clipboardText}, stopPropagation: () => {}, preventDefault: () => {}},0,0)

        let errors = false

        for (let i = 0; i < 3; i++){
            for (let j = 0; j < 3; j++){
                let cellInput = this.get('text',i,j)                                    
                if(cellInput){
                    if (cellInput.value != data[i][j].toString()){
                        console.warn(`pasteData test failed at row ${i} and col ${j}: expected "${data[i][j]}" but got "${cellInput.value}"`)
                        errors = true
                    }
                } else {
                    console.log('pasteData test failed: could not find input element for cell at row ' + i + ' and col ' + j)
                    errors = true
                }
            }                
        }
                        
        if (!errors){
            console.log('pasteData test passed')
        }

        
    }

    testInputData(){
        console.log('Testing inputting text data into a cell...')
        let targetCell = this.tableElement.querySelector('.inputCellText')
        targetCell.focus()
        let inputEvent = new Event('change', { bubbles: true })
        targetCell.value = 'test'
        targetCell.dispatchEvent(inputEvent)

        if (targetCell.value == 'test'){
            console.log('Input text data test passed')
        } else {
            console.warn('Input text data test failed: expected "test" but got "' + targetCell.value + '"')
        }

        console.log('Testing inputting datetime data into a cell...')
        targetCell = this.tableElement.querySelector('.withDateTime .inputCellDate')
        if (targetCell){
            targetCell.focus()
            inputEvent = new Event('change', { bubbles: true })
            targetCell.value = '1963-11-23'
            targetCell.dispatchEvent(inputEvent)
        
            if (targetCell.value == '1963-11-23'){
                console.log('Input date data test passed')
            } else {
                console.warn('Input date data test failed: expected "1963-11-23" but got "' + targetCell.value + '"')
            }
        } else {
            console.log('No date input cell available, skipping date input test')
        }

        targetCell = this.tableElement.querySelector('.withDateTime .inputCellTime')
        if (targetCell){
            targetCell.focus()
            inputEvent = new Event('change', { bubbles: true })
            targetCell.value = '19:00'
            targetCell.dispatchEvent(inputEvent)

            if (targetCell.value == '19:00'){
                console.log('Input time data test passed')
            } else {
                console.warn('Input time data test failed: expected "19:00" but got "' + targetCell.value + '"')
            }
        } else {
            console.log('No time input cell available, skipping time input test')
        }

        console.log('Testing inputting select data into a cell...')
        targetCell = this.tableElement.querySelector('.withSelect .inputCellSelect')
        if (targetCell){
            targetCell.focus()
            inputEvent = new Event('change', { bubbles: true })
            let secondOption = targetCell.querySelector('option:nth-child(2)') // select second option (assuming there is at least 2 options)
            if (secondOption){
                targetCell.value = secondOption.value
                targetCell.dispatchEvent(inputEvent)

                if (targetCell.value == 'Option 2'){
                    console.log('Input select data test passed')
                } else {
                    console.warn('Input select data test failed: expected "Option 2" but got "' + targetCell.value + '"')
                }
            } else {
                console.log('No second option available in select input cell, skipping select input test')
            }
        } else {
            console.log('No select input cell available, skipping select input test')
        }

        // to do: file test
    }

    testClearTable(restore = false){
        if(this.isEmpty()){
            // make sure table has some data to clear (and restore)
            this.convertArrayToTableData([['one','two','three'],['four','five','six'],['seven','eight','nine']])
        }
        console.log('Testing clearTable with do...')
        this.do('clearTable')
        if (this.isEmpty()){
            console.log('clearTable with do test passed')
        } else {
            console.warn('clearTable with do test failed')
        }        
        if (restore){
            console.log('Testing undo() after clearTable to restore table...')
            this.undo()
            if (!this.isEmpty()){
                console.log('undo() after clearTable test passed')

                console.log('Testing redo() after undo() to clear table again...')
                this.redo()
                if (this.isEmpty()){
                    console.log('redo() after undo() test passed')
                } else {
                    console.warn('redo() after undo() test failed: table is not empty after redo')
                }

            } else {
                console.warn('undo() after clearTable test failed: table is still empty after undo')
            }
        }    
    }    


    testIds(deep=false){
        console.log('Checking that table.rowIDs, table.colIDs and table.cellIDs are consistent with the table elements...')
        let rowElements = Array.from(this.tableElement.querySelectorAll('.tableRow'))
        rowElements.forEach((rowElement, rowIndex) => {
            let rowID = rowElement.getAttribute('data-row')
            if (rowID != this.rowIDs[rowIndex]){
                console.warn('Row ID mismatch at index ' + rowIndex + ': expected ' + this.rowIDs[rowIndex] + ' but got ' + rowID)
            }
            rowElement.querySelectorAll('.dataCell').forEach((cellElement, cellIndex) => {
                let rowID = cellElement.getAttribute('data-row')
                let colID = cellElement.getAttribute('data-col')
                let cellID = cellElement.getAttribute('data-cell')
                if (colID != this.colIDs[cellIndex]){
                    console.warn('Column ID mismatch at index ' + cellIndex + ': expected ' + this.colIDs[cellIndex] + ' but got ' + colID)
                }
                if (cellID != this.cellIDs[rowIndex][cellIndex]){
                    console.warn('Cell ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.cellIDs[rowIndex][cellIndex] + ' but got ' + cellID)
                }
                if (rowID != this.rowIDs[rowIndex]){
                    console.warn('Cell row ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.rowIDs[rowIndex] + ' but got ' + rowID)
                }
                
                if(deep){

                console.log('Checking input element IDs for cell at row ' + rowIndex + ' and column ' + cellIndex + '...')
                
                let textElement = cellElement.querySelector('.inputCellText')
                let dateElement = cellElement.querySelector('.inputCellDate')
                let timeElement = cellElement.querySelector('.inputCellTime')
                let selectElement = cellElement.querySelector('.inputCellSelect')
                let fileElement = cellElement.querySelector('.inputCellFile')

                if (textElement){
                    let textRowID = textElement.getAttribute('data-row')
                    let textColID = textElement.getAttribute('data-col')
                    let textCellID = textElement.getAttribute('data-cell')
                    if (textRowID != this.rowIDs[rowIndex]){
                        console.warn('Text element row ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.rowIDs[rowIndex] + ' but got ' + textRowID)
                    }
                    if (textColID != this.colIDs[cellIndex]){
                        console.warn('Text element column ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.colIDs[cellIndex] + ' but got ' + textColID)
                    }
                    if (textCellID != this.cellIDs[rowIndex][cellIndex]){
                        console.warn('Text element cell ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.cellIDs[rowIndex][cellIndex] + ' but got ' + textCellID)
                    }
                }

                 if (dateElement){
                    let dateRowID = dateElement.getAttribute('data-row')
                    let dateColID = dateElement.getAttribute('data-col')
                    let dateCellID = dateElement.getAttribute('data-cell')
                    if (dateRowID != this.rowIDs[rowIndex]){
                        console.warn('Date element row ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.rowIDs[rowIndex] + ' but got ' + dateRowID)
                    }
                    if (dateColID != this.colIDs[cellIndex]){
                        console.warn('Date element column ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.colIDs[cellIndex] + ' but got ' + dateColID)
                    }   
                    if (dateCellID != this.cellIDs[rowIndex][cellIndex]){
                        console.warn('Date element cell ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.cellIDs[rowIndex][cellIndex] + ' but got ' + dateCellID)
                    }
                }

                if (timeElement){
                    let timeRowID = timeElement.getAttribute('data-row')
                    let timeColID = timeElement.getAttribute('data-col')
                    let timeCellID = timeElement.getAttribute('data-cell')
                    if (timeRowID != this.rowIDs[rowIndex]){
                        console.warn('Time element row ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.rowIDs[rowIndex] + ' but got ' + timeRowID)
                    }
                    if (timeColID != this.colIDs[cellIndex]){
                        console.warn('Time element column ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.colIDs[cellIndex] + ' but got ' + timeColID)
                    }   
                    if (timeCellID != this.cellIDs[rowIndex][cellIndex]){
                        console.warn('Time element cell ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.cellIDs[rowIndex][cellIndex] + ' but got ' + timeCellID)
                    }
                }

                if (selectElement){
                    let selectRowID = selectElement.getAttribute('data-row')
                    let selectColID = selectElement.getAttribute('data-col')
                    let selectCellID = selectElement.getAttribute('data-cell')
                    if (selectRowID != this.rowIDs[rowIndex]){
                        console.warn('Select element row ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.rowIDs[rowIndex] + ' but got ' + selectRowID)
                    }
                    if (selectColID != this.colIDs[cellIndex]){
                        console.warn('Select element column ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.colIDs[cellIndex] + ' but got ' + selectColID)
                    }   
                    if (selectCellID != this.cellIDs[rowIndex][cellIndex]){
                        console.warn('Select element cell ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.cellIDs[rowIndex][cellIndex] + ' but got ' + selectCellID)
                    }
                 }

                 if (fileElement){
                    let fileRowID = fileElement.getAttribute('data-row')
                    let fileColID = fileElement.getAttribute('data-col')
                    let fileCellID = fileElement.getAttribute('data-cell')
                    if (fileRowID != this.rowIDs[rowIndex]){
                        console.warn('File element row ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.rowIDs[rowIndex] + ' but got ' + fileRowID)
                    }
                    if (fileColID != this.colIDs[cellIndex]){
                        console.warn('File element column ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.colIDs[cellIndex] + ' but got ' + fileColID)
                    }   
                    if (fileCellID != this.cellIDs[rowIndex][cellIndex]){
                        console.warn('File element cell ID mismatch at row ' + rowIndex + ' and column ' + cellIndex + ': expected ' + this.cellIDs[rowIndex][cellIndex] + ' but got ' + fileCellID)
                    }
                 }
                }
            })
        })
        console.log('ID consistency check completed')
    }
}