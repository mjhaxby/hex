var filesIn
var profilesOut


function pageLoad(){
    filesIn = document.getElementById("filesIn");
    profilesOut = document.getElementById("profilesOut");
}

function openFiles(){
    ipcRenderer.send('openFilesForBulk');
}

function removeFile(){    
    var selectedFiles = getSelectedFiles();
    ipcRenderer.send('removeFileFromBulk', selectedFiles);
}

function addCurrentProfile(){
    ipcRenderer.send('addCurrentProfileToBulk');
}

function addProfileFromFile(){
    ipcRenderer.send('openProfileFromFile');
}

function removeProfile(){
    var selectedProfiles = getSelectedProfiles();
    ipcRenderer.send('removeProfileFromBulk', selectedProfiles);
}

function bulkExport(option="hext"){ // hext, html or scorm
    const ignoreProfiles = document.getElementById("ignoreProfiles").checked
    const selectedFiles = getSelectedFiles();
    const selectedProfiles = ignoreProfiles ? [] : getSelectedProfiles();
    ipcRenderer.send('bulkExport', selectedFiles, selectedProfiles, option );
}

function listFiles(files, column="in"){
    let container = column == "in" ? filesIn : profilesOut

    Array.from(container.children).forEach(child => {
        let path = child.dataset.path
        if(!files.some(file => file.path == path)){
            // if the file is no longer in the array, remove it from the list
            container.removeChild(child)
        } else {
            files = files.filter(file => file.path != path) // remove the file from the array so we don't add it again
            return
        }
    });

    // now add any new files that are not already in the list
    files.forEach(file => {
        let checkbox = newElement("input", { type: "checkbox", checked: true, value: file.path })
        let label = newElement("label", {}, file.name)
        let div = newElement("div", {dataPath: file.path}, [checkbox, label])
        container.appendChild(div)
    });
}

function removeFileFromList(files, column="in"){
// no longer necessary? listFiles should do everything we need
}

function getSelectedFiles(){
    return Array.from(filesIn.querySelectorAll("input[type='checkbox']:checked")).map(checkbox => checkbox.value)
}

function getSelectedProfiles(){
    return Array.from(profilesOut.querySelectorAll("input[type='checkbox']:checked")).map(checkbox => checkbox.value)
}

ipcRenderer.on('updateFilesIn', (event, files) => {
    listFiles(files, "in");    
});

ipcRenderer.on('updateProfilesOut', (event, profiles) => {
    listFiles(profiles, "out");    
});