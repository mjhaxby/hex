var hotPotsData

function importFromHotPotatoesMatch(file){
    const D_regex = /D = new Array\(\);(?:\s+D\[\d+\] = new Array\(\);\s+D\[\d+\]\[\d+\]='[^']*';\s+D\[\d+\]\[\d+\] = \d+;\s+D\[\d+\]\[\d+\] = \d+;)+\s+/m
    const F_regex = /F = new Array\(\);(?:\s+F\[\d+\] = new Array\(\);\s+F\[\d+\]\[\d+\]='[^']*';\s+F\[\d+\]\[\d+\] = \d+;)+\s+/m

    processedApostrophes = file.replace(/\\'/,'’')

    D_string = processedApostrophes.match(D_regex)[0]
    F_string = processedApostrophes.match(F_regex)[0]

    // D = parseArrayFromString(D_string)
    // F = parseArrayFromString(F_string)

    D = getArrayTextValues(D_string)
    F = getArrayTextValues(F_string)

    console.log(D)
    console.log(F)
    
    var output = []

    for (let i = 0; i < D.length; i++){
        output.push([D[i],F[i]])
    }

    console.log(output)
    navigator.clipboard.writeText(JSON.stringify(output))
    
}

// not using this in the end, but keeping it just incase
function parseArrayFromString(inputString) {
    // Initialize an empty array
    let newArray = [];
    var subArray = []

    // Split the input string by lines
    let lines = inputString.trim().split('\n');

    // Loop through each line
    for (let i = 1; i < lines.length; i++) {        
        // Extract values between single quotes using regex
        let match = lines[i].match(/'([^']*)'/g);
        // Extract numeric values
        let numericValue = lines[i].match(/= \d+/g);
        if (match && match.length > 0){ // line of type: D[7][0]='inversement';
            let decode = decodeHtmlEntities(match[0].slice(1, -1));  // Removing single quotes and parsing to UTF-8
            // Push values            
            subArray.push(decode); 
        } else if (numericValue && numericValue.length > 0) { // type of style: D[7][1] = 8;
            subArray.push(parseInt(numericValue[0].slice(2))) // Removing equals
        } else { // line of type D[19] = new Array(); (ignore this line, but append the subArray and start a new one)
            if (subArray.length > 0){
                newArray.push(subArray)
                subArray = []
            }
        }
    }

    newArray.push(subArray) // append the last subArray

    return newArray;
}

function getArrayTextValues(inputString) {
    // Initialize an empty array
    let newArray = [];

    // Split the input string by lines
    let lines = inputString.trim().split('\n');

    // Loop through each line
    for (let i = 1; i < lines.length; i++) {        
        // Extract values between single quotes using regex
        let match = lines[i].match(/'([^']*)'/g);
        if (match && match.length > 0){ // line of type: D[7][0]='inversement';
            let decode = decodeHtmlEntities(match[0].slice(1, -1));  // Removing single quotes and parsing to UTF-8
            // Push values            
            newArray.push(decode); 
        }
    }
    return newArray;
}

function decodeHtmlEntities(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

ipcRenderer.on('loadData', (event, data) => {
    console.log(data)
    hotPotsData = data
    importFromHotPotatoesMatch(hotPotsData)
  })

  function sendReadySignal(){
    console.log('sending signal')
    ipcRenderer.send('hotPotsReady','I am ready'); 
  }
  
  document.addEventListener('DOMContentLoaded',sendReadySignal())
  