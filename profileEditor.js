// GLOBAL VARS

var numActivityProfiles = 0
var profileStore = {name: '', activities: []}
var activitySettingControlsStore = {}

// PAGE FUNCTIONS

document.addEventListener('DOMContentLoaded',pageLoad)

window.addEventListener( 'beforeunload', function(event){ 
    getProfile().then( result => {
        ipcRenderer.send('updateProfile', result)
    })
    
} )

function pageLoad(){
    console.log('page loaded')
    ipcRenderer.send('profileEditorReady')
}

// function prepareActivitiesInProfile(profiles){
//     numActivityProfiles = profiles.length
//     profiles.forEach(profile => {
//         getActivitySettings(profile.activity, profile.source)
//     })
// }

function getActivitySettings(activity,source){
    ipcRenderer.send('readActivitySettings',activity,source)
}

// run this activity with each set of settings saved in the profile file
function addActivityProfile(settings, activity, source, settingsArea, settingControls){

    makeSettings(settingControls,activity,source,settingsArea)
    addProfileButtons(activity,source,settingsArea)
    setSettings(settings, settingControls, true, activity, source, settingsArea)
    
    // TO DO: add extra buttons
}

function addProfileButtons(activity,source,settingsArea){
    applyProfileBtn = document.createElement('button')
    deleteProfileBtn = document.createElement('button')
    applyProfileBtn.innerHTML = 'Apply to selected activity'
    deleteProfileBtn.innerHTML = 'Remove from profile'
    applyProfileBtn.setAttribute('onclick','applyProfile(\''+activity+'\', \''+source+'\')')
    deleteProfileBtn.setAttribute('onclick','removeFromProfile(\''+activity+'\', \''+source+'\')')
    
    settingsArea.appendChild(applyProfileBtn)
    settingsArea.append(' ')
    settingsArea.appendChild(deleteProfileBtn)
}

function applyProfile(activity, source){
// TO DO: Attempt to apply the settings to the current activity. Will only apply those that exist/are valid.
    getProfile().then( result => {
        ipcRenderer.send('updateProfile', result)
        ipcRenderer.send('applyActivityProfile',activity,source)
    })
    
}

function removeFromProfile(activity, source){
    let index = profileStore.activities.findIndex(activityProfile => activityProfile.activity === activity && activityProfile.source === source)
    profileStore.activities.splice(index,1)
    let settingsArea = document.getElementById('settingsArea_'+source+'_'+activity)
    let settingsHeader = document.getElementById('settings_'+source+'_'+activity)
    settingsArea.remove()
    settingsHeader.remove()
    // Following isn't really necessary
    // delete activitySettingControlsStore[source + '_' + activity]

    getProfile().then( result => {
        ipcRenderer.send('updateProfile', result)
    })
}

function displayProfile(){

    document.body.innerHTML = ''

    // add profile name box
    var profileName = document.createElement('input')
    profileName.setAttribute('id','profileName')
    profileName.setAttribute('type','text')
    profileName.placeholder = ('New profile')
    if (profileStore.name != ''){
        profileName.value = profileStore.name
    }
    document.body.appendChild(profileName)
    
    console.log(activitySettingControlsStore)

    // add each activity profile as an expandable settings area
    profileStore.activities.forEach(activityProfile => { 
        console.log(activityProfile)
        let settingControls = activitySettingControlsStore[activityProfile.source + '_' + activityProfile.activity] 
        addNewProfileSection(activityProfile, settingControls)
    })
}

function addNewProfileSection(activityProf, settingsControls){
    // activitiesInOpenProfile.push(activityProf.activity)
    var heading = document.createElement('h2')
    heading.setAttribute('id','settings_'+activityProf.source+'_'+activityProf.activity)
    heading.setAttribute('onclick','showSettings("'+activityProf.source+'", "'+activityProf.activity+'")')
    heading.innerHTML = '<i class="arrow down showSettingsButton" id="showSettingsButton_'+activityProf.source+'_'+activityProf.activity+'"></i></img> ' + activityProf.activity.replaceAll('_',' ') + ' settings'
    document.body.appendChild(heading)
    settingsArea = document.createElement('div')
    settingsArea.setAttribute('id','settingsArea_'+activityProf.source+'_'+activityProf.activity)
    settingsArea.setAttribute('class','settingsArea')
    document.body.appendChild(settingsArea)
    addActivityProfile(activityProf.settings,activityProf.activity,activityProf.source,settingsArea, settingsControls)
    // TO DO: add buttons underneath? delete profile?
}

function getProfile() {
    return new Promise((resolve, reject) => {
        // get all the settings from the profiles
        profileStore.activities.forEach(activityProfile => {
            settingControls = activitySettingControlsStore[activityProfile.source + '_' + activityProfile.activity]
            activityProfile.settings = getSettings(settingControls, activityProfile.activity, activityProfile.source)
        })
        profileStore.name = document.getElementById('profileName').value
        resolve(profileStore)
    })
        .catch(error => {
            reject(error); // Propagate the error to the caller
        });
};


ipcRenderer.on('addToProfile', (event, activity, source, settings, settingControls) => {
    existingActivityProfile = profileStore.activities.find(profile => profile.activity === activity)
    if(existingActivityProfile){
        existingActivityProfile.settings = settings
        setSettings(settings, settingControls, true, activity, source, document.getElementById('settingsArea_'+source+'_'+activity))
    } else {
    let activityProf = {activity: activity, source: source, settings: settings}
      profileStore.activities.push(activityProf)
      settingsVisible[source + '_' + activity] = true
      activitySettingControlsStore[source + '_' + activity] = settingControls
      addNewProfileSection(activityProf, settingControls)
    }
    
  });

// ipcRenderer.on('loadSettings', (event, activity, settings) => {
//     console.log(settings)
//     // profileStore.activities.push({activity: activity, settings: settings})
//     if (profileStore.activities.length == numActivityProfiles){
//         displayProfile(profileStore)
//     }
//   });


ipcRenderer.on('loadProfile',(event, profile, settingControls) => {
    profileStore = profile
    activitySettingControlsStore = settingControls
    console.log(profileStore)
    console.log(activitySettingControlsStore)
    displayProfile()
})

ipcRenderer.on('updateAndApplyActivityProfile',(event,activity,source) => {
    applyProfile(activity, source)
})

ipcRenderer.on('updateProfileToSave', (event,path) => {
    getProfile().then( result => {
        ipcRenderer.send('saveProfile',result,path)
    })
})

ipcRenderer.on('toCheckProfileChangesThen', (event, action) => {
    getProfile().then( result => {
        ipcRenderer.send('checkProfileChangesThen',profileStore,action)
    })
})