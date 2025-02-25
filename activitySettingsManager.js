var settingsVisible = { main: false }

const languages = [{code: "af", label: "Afrikaans"}, {code: "sq", label: "Albanian - shqip"}, {code: "am", label: "Amharic - አማርኛ"}, {code: "ar", label: "Arabic - العربية"}, {code: "an", label: "Aragonese - aragonés"}, {code: "hy", label: "Armenian - հայերեն"}, {code: "ast", label: "Asturian - asturianu"}, {code: "az", label: "Azerbaijani - azərbaycan dili"}, {code: "eu", label: "Basque - euskara"}, {code: "be", label: "Belarusian - беларуская"}, {code: "bn", label: "Bengali - বাংলা"}, {code: "bs", label: "Bosnian - bosanski"}, {code: "br", label: "Breton - brezhoneg"}, {code: "bg", label: "Bulgarian - български"}, {code: "ca", label: "Catalan - català"}, {code: "ckb", label: "Central Kurdish - کوردی (دەستنوسی عەرەبی)"}, {code: "zh", label: "Chinese - 中文"}, {code: "zh-HK", label: "Chinese (Hong Kong) - 中文（香港）"}, {code: "zh-CN", label: "Chinese (Simplified) - 中文（简体）"}, {code: "zh-TW", label: "Chinese (Traditional) - 中文（繁體）"}, {code: "co", label: "Corsican"}, {code: "hr", label: "Croatian - hrvatski"}, {code: "cs", label: "Czech - čeština"}, {code: "da", label: "Danish - dansk"}, {code: "nl", label: "Dutch - Nederlands"}, {code: "en", label: "English"}, {code: "en-AU", label: "English (Australia)"}, {code: "en-CA", label: "English (Canada)"}, {code: "en-IN", label: "English (India)"}, {code: "en-NZ", label: "English (New Zealand)"}, {code: "en-ZA", label: "English (South Africa)"}, {code: "en-GB", label: "English (United Kingdom)"}, {code: "en-US", label: "English (United States)"}, {code: "eo", label: "Esperanto - esperanto"}, {code: "et", label: "Estonian - eesti"}, {code: "fo", label: "Faroese - føroyskt"}, {code: "fil", label: "Filipino"}, {code: "fi", label: "Finnish - suomi"}, {code: "fr", label: "French - français"}, {code: "fr-CA", label: "French (Canada) - français (Canada)"}, {code: "fr-FR", label: "French (France) - français (France)"}, {code: "fr-CH", label: "French (Switzerland) - français (Suisse)"}, {code: "gl", label: "Galician - galego"}, {code: "ka", label: "Georgian - ქართული"}, {code: "de", label: "German - Deutsch"}, {code: "de-AT", label: "German (Austria) - Deutsch (Österreich)"}, {code: "de-DE", label: "German (Germany) - Deutsch (Deutschland)"}, {code: "de-LI", label: "German (Liechtenstein) - Deutsch (Liechtenstein)"}, {code: "de-CH", label: "German (Switzerland) - Deutsch (Schweiz)"}, {code: "el", label: "Greek - Ελληνικά"}, {code: "gn", label: "Guarani"}, {code: "gu", label: "Gujarati - ગુજરાતી"}, {code: "ha", label: "Hausa"}, {code: "haw", label: "Hawaiian - ʻŌlelo Hawaiʻi"}, {code: "he", label: "Hebrew - עברית"}, {code: "hi", label: "Hindi - हिन्दी"}, {code: "hu", label: "Hungarian - magyar"}, {code: "is", label: "Icelandic - íslenska"}, {code: "id", label: "Indonesian - Indonesia"}, {code: "ia", label: "Interlingua"}, {code: "ga", label: "Irish - Gaeilge"}, {code: "it", label: "Italian - italiano"}, {code: "it-IT", label: "Italian (Italy) - italiano (Italia)"}, {code: "it-CH", label: "Italian (Switzerland) - italiano (Svizzera)"}, {code: "ja", label: "Japanese - 日本語"}, {code: "kn", label: "Kannada - ಕನ್ನಡ"}, {code: "kk", label: "Kazakh - қазақ тілі"}, {code: "km", label: "Khmer - ខ្មែរ"}, {code: "ko", label: "Korean - 한국어"}, {code: "ku", label: "Kurdish - Kurdî"}, {code: "ky", label: "Kyrgyz - кыргызча"}, {code: "lo", label: "Lao - ລາວ"}, {code: "la", label: "Latin"}, {code: "lv", label: "Latvian - latviešu"}, {code: "ln", label: "Lingala - lingála"}, {code: "lt", label: "Lithuanian - lietuvių"}, {code: "mk", label: "Macedonian - македонски"}, {code: "ms", label: "Malay - Bahasa Melayu"}, {code: "ml", label: "Malayalam - മലയാളം"}, {code: "mt", label: "Maltese - Malti"}, {code: "mr", label: "Marathi - मराठी"}, {code: "mn", label: "Mongolian - монгол"}, {code: "ne", label: "Nepali - नेपाली"}, {code: "no", label: "Norwegian - norsk"}, {code: "nb", label: "Norwegian Bokmål - norsk bokmål"}, {code: "nn", label: "Norwegian Nynorsk - nynorsk"}, {code: "oc", label: "Occitan"}, {code: "or", label: "Oriya - ଓଡ଼ିଆ"}, {code: "om", label: "Oromo - Oromoo"}, {code: "ps", label: "Pashto - پښتو"}, {code: "fa", label: "Persian - فارسی"}, {code: "pl", label: "Polish - polski"}, {code: "pt", label: "Portuguese - português"}, {code: "pt-BR", label: "Portuguese (Brazil) - português (Brasil)"}, {code: "pt-PT", label: "Portuguese (Portugal) - português (Portugal)"}, {code: "pa", label: "Punjabi - ਪੰਜਾਬੀ"}, {code: "qu", label: "Quechua"}, {code: "ro", label: "Romanian - română"}, {code: "mo", label: "Romanian (Moldova) - română (Moldova)"}, {code: "rm", label: "Romansh - rumantsch"}, {code: "ru", label: "Russian - русский"}, {code: "gd", label: "Scottish Gaelic"}, {code: "sr", label: "Serbian - српски"}, {code: "sh", label: "Serbo-Croatian - Srpskohrvatski"}, {code: "sn", label: "Shona - chiShona"}, {code: "sd", label: "Sindhi"}, {code: "si", label: "Sinhala - සිංහල"}, {code: "sk", label: "Slovak - slovenčina"}, {code: "sl", label: "Slovenian - slovenščina"}, {code: "so", label: "Somali - Soomaali"}, {code: "st", label: "Southern Sotho"}, {code: "es", label: "Spanish - español"}, {code: "es-AR", label: "Spanish (Argentina) - español (Argentina)"}, {code: "es-419", label: "Spanish (Latin America) - español (Latinoamérica)"}, {code: "es-MX", label: "Spanish (Mexico) - español (México)"}, {code: "es-ES", label: "Spanish (Spain) - español (España)"}, {code: "es-US", label: "Spanish (United States) - español (Estados Unidos)"}, {code: "su", label: "Sundanese"}, {code: "sw", label: "Swahili - Kiswahili"}, {code: "sv", label: "Swedish - svenska"}, {code: "tg", label: "Tajik - тоҷикӣ"}, {code: "ta", label: "Tamil - தமிழ்"}, {code: "tt", label: "Tatar"}, {code: "te", label: "Telugu - తెలుగు"}, {code: "th", label: "Thai - ไทย"}, {code: "ti", label: "Tigrinya - ትግርኛ"}, {code: "to", label: "Tongan - lea fakatonga"}, {code: "tr", label: "Turkish - Türkçe"}, {code: "tk", label: "Turkmen"}, {code: "tw", label: "Twi"}, {code: "uk", label: "Ukrainian - українська"}, {code: "ur", label: "Urdu - اردو"}, {code: "ug", label: "Uyghur"}, {code: "uz", label: "Uzbek - o‘zbek"}, {code: "vi", label: "Vietnamese - Tiếng Việt"}, {code: "wa", label: "Walloon - wa"}, {code: "cy", label: "Welsh - Cymraeg"}, {code: "fy", label: "Western Frisian"}, {code: "xh", label: "Xhosa"}, {code: "yi", label: "Yiddish"}, {code: "yo", label: "Yoruba - Èdè Yorùbá"}, {code: "zu", label: "Zulu - isiZulu"}]
const fonts = [
    {name: 'Arial', style: 'sans-serif', src: 'websafe', isFont: true},
    {name: 'Brush Script MT', style: 'cursive', src: 'websafe', isFont: true},
    {name: 'Cabin', style: 'sans-serif', src:'fonts/Cabin.ttf', format: 'ttf', isFont: true},
    {name: 'Courier New', style: 'monospace', src: 'websafe', isFont: true},
    {name: 'Garamond', style: 'serif', src: 'websafe', isFont: true},      
    {name: 'Georgia', style: 'serif', src: 'websafe', isFont: true},  
    {name: 'Grandstander', style: 'sans-serif', src:'fonts/Grandstander.ttf', format: 'ttf', isFont: true},
    {name: 'Kode-Mono', style: 'monospace', src:'fonts/KodeMono.ttf', format: 'ttf', isFont: true},
    {name: 'Lora', style: 'serif', src:'fonts/Lora.ttf', format: 'ttf', isFont: true},
    {name: 'Niconne', style: 'cursive', src:'fonts/Niconne-Regular.ttf', format: 'ttf', isFont: true},
    {name: 'Playwrite', style: 'cursive', src:'fonts/Playwrite.ttf', format: 'ttf', isFont: true},
    {name: 'ShareTech', style: 'sans-serif', src:'fonts/ShareTech-Regular.ttf', format: 'ttf', isFont: true},
    {name: 'ShareTech-Mono', style: 'monospace', src:'fonts/ShareTechMono-Regular.ttf', fornat: 'ttf', isFont: true},        
    {name: 'Short Stack', style: 'cursive', src:'fonts/ShortStack.ttf', format: 'ttf', isFont: true},
    {name: 'Tahoma', style: 'sans-serif', src: 'websafe', isFont: true},    
    {name: 'Times New Roman', style: 'serif', src: 'websafe', isFont: true},        
    {name: 'Trebuchet MS', style: 'sans-serif', src: 'websafe', isFont: true},
    {name: 'Verdana', style: 'sans-serif', src: 'websafe', isFont: true}
    ]
const sysLang = Intl.DateTimeFormat().resolvedOptions().locale
var dependentLoopTracker = {}

function makeInfoHover(info,settingsAreaID = 'settingsArea') {
    var infoContainer = document.createElement('div')
    var infoBox = document.createElement('div')
    var infoIcon = document.createElement('div')
    infoContainer.setAttribute('class', 'infoContainer')
    infoBox.setAttribute('class', 'infoBox')
    infoIcon.setAttribute('class', 'infoIcon')
    var settingsArea = ''
    if (settingsAreaID != 'settingsArea'){ // if not the default settings area (otherwise don't bother including it)
        settingsArea = ', document.getElementByID('+settingsAreaID+')'
    }
    infoIcon.setAttribute('onmouseover', 'checkInfoBoxVisibility(this'+settingsArea+')')
    infoIcon.innerHTML = 'ℹ︎'
    infoBox.innerHTML = info
    infoBox.style.bottom = '100%'
    infoContainer.appendChild(infoBox)
    infoContainer.appendChild(infoIcon)
    return infoContainer
}

function makeSettings(settings, activityName = '', sourceName = '', settingsArea = document.getElementById('settingsArea')) {
    var settingEls = new Array();
    var categories = new Array();

    var prefix = ''

    var newSetting
    var newSelect
    var newOption

    // for use in the profile editor
    if (activityName != '') {
        prefix = sourceName + '_' + activityName + '_'
    }

    // label type options default
    for (i = 0; i < settings.length; i++) {
        newSetting = document.createElement('div')
        newSetting.setAttribute('class', 'setting')
        newSetting.setAttribute('data-setting-name',settings[i].name)
        newSetting.setAttribute('data-setting-type',settings[i].type)
        if (settings[i].type == 'text' | settings[i].type == 'number' | settings[i].type == 'checkbox') {
            newInput = document.createElement('input')
            newInputLabel = document.createElement('label')
            newInput.id = prefix + 'setting_' + settings[i].type + '_' + settings[i].name
            newInput.type = settings[i].type
            newInputLabel.for = prefix + 'setting_' + settings[i].type + '_' + settings[i].name
            if (settings[i].hasOwnProperty('variables') && settings[i].label.includes('$')){
                // if there are variables, apply these to the label
                newInputLabel.innerHTML = applyVariables(settings[i].label, settings[i].variables)
            } else {
                newInputLabel.innerHTML = settings[i].label
            }             
            if (settings[i].hasOwnProperty('dependents')){
                // if there are dependents, set up to react when the settings change
                newInput.setAttribute('onchange','settingChanged(this)')
            }
            if (settings[i].hasOwnProperty('default')) {
                if (settings[i].type == 'checkbox') {
                    if (settings[i].default) {
                        newInput.checked = true
                    } else {
                        newInput.checked = false
                    }
                } else {
                    newInput.value = settings[i].default
                }
            }
            if (settings[i].type == 'number') {
                if (settings[i].hasOwnProperty('min')) {
                    newInput.min = settings[i].min
                    newInput.setAttribute('onchange','settingChanged(this)')
                }
                if (settings[i].hasOwnProperty('max')) {
                    newInput.max = settings[i].max
                    newInput.setAttribute('onchange','settingChanged(this)')
                }
            } else if (settings[i].type == 'text' && settings[i].hasOwnProperty('max')) {
                // max for a text input is interpreted as the maximum amount of text that can be inputted
                newInput.setAttribute('maxlength', settings[i].max)
                if (settings[i].max < 10) {
                    newInput.setAttribute('size', settings[i].max) // for text fields whose max is much shorter than the normal size of the box, set the size too
                    if (settings[i].max < 4) { // for short text fields, it'll look better if they're centered
                        newInput.style.textAlign = 'center'
                        if (settings[i].max == 1) {
                            newInput.setAttribute('onclick', 'this.select()') // if it's just a single character, clicking on the box should select it
                        }
                    }
                }
            }
            // different order for label and input for checkbox copared to others
            if (settings[i].type == 'checkbox') {
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
            if (settings[i].hasOwnProperty('info')) {
                newSetting.appendChild(makeInfoHover(settings[i].info,settingsArea.id))
            }
            // selects are a bit different, so we'll make that separately
        } else if (settings[i].type == 'select' | settings[i].type == 'language' | settings[i].type == 'select-import' || settings[i].type == 'font_family') {
            newSelect = document.createElement('select')
            newSelect.id = prefix + 'setting_' + settings[i].type + '_' + settings[i].name
            newSelectLabel = document.createElement('label')
            newSelectLabel.for = prefix + 'setting_' + settings[i].type + '_' + settings[i].name

            if (settings[i].hasOwnProperty('variables') && settings[i].label.includes('$')){
                // if there are variables, apply these to the label
                newSelectLabel.innerHTML = applyVariables(settings[i].label, settings[i].variables)
            } else {
                newSelectLabel.innerHTML = settings[i].label
            }       
            
            if (settings[i].hasOwnProperty('dependents')){
                // if there are dependents, set up to react when the settings change
                newSelect.setAttribute('onchange','settingChanged(this)')
            }
            // add info hover icon
            if (settings[i].hasOwnProperty('info')) {
                newSelectLabel.appendChild(makeInfoHover(settings[i].info,settingsArea.id))
            }
            if (settings[i].type == 'select' | settings[i].type == 'select-import'){
                for (let j = 0; j < settings[i].options.length; j++) {
                    let newOption = document.createElement('option')                
                    if(settings[i].hasOwnProperty('variables') && settings[i].options[j].includes('$')){
                        newOption.innerHTML = applyVariables(settings[i].options[j],settings[i].variables)
                    } else {
                        newOption.innerHTML = settings[i].options[j]
                    }
                    
                    // if the value of the option has been provided, use that as its value, otherwise just use the optional label
                    if (settings[i].hasOwnProperty('optionValues') && j < settings[i].optionValues.length){
                        newOption.value = settings[i].optionValues[j]
                    } else {
                        newOption.value = settings[i].options[j]
                    }
                    newSelect.appendChild(newOption)
                }
                if (settings[i].hasOwnProperty('default')) {
                    newSelect.value = settings[i].default
                }
                if (settings[i].type == 'select-import'){
                    let newOption = document.createElement('option')
                    newOption.innerHTML = 'custom…'
                    newOption.value = ''
                    newSelect.appendChild(newOption)
                    newSelect.setAttribute('onchange','settingChanged(this)')
                    // newSelect.setAttribute('onchange',`customSelectImport(this,"${settings[i].name}")`)
                }       
            } else if (settings[i].type == 'language') {
                let selectIndex = -1
                for (let j = 0; j < languages.length; j++){
                    newOption = document.createElement('option')
                    newOption.value = languages[j].code
                    newOption.innerHTML = languages[j].label
                    newSelect.appendChild(newOption)
                    if (languages[j].code == sysLang){
                        selectIndex = j
                    }
                }
                if (selectIndex > -1){
                    newSelect.selectedIndex = selectIndex
                }
            } else if (settings[i].type == 'font_family'){
                let selectIndex = -1
                let numFontsAdded = 0
                fonts.forEach((font) => {
                    // add all fonts, using only styles listed (either as a string or array) or if no styles given, all of them
                    if (!settings[i].hasOwnProperty('style') || (settings[i].hasOwnProperty('style') && (settings[i].style == font.style || (typeof settings[i].style == 'object' && settings[i].style.includes(font.style))))){
                        let newOption = document.createElement('option')
                        newOption.value = font.name
                        newOption.innerHTML = font.name
                        newSelect.appendChild(newOption)
                        // if no other default is specified, select ShareTech if available, if not select ShareTech-Mono if available
                        if (!settings[i].hasOwnProperty('default') && (font.name == 'ShareTech'
                        || ((settings[i].hasOwnProperty('style') && settings[i].style != 'sans-serif') | (typeof settings[i].style == 'object' && !settings[i].style.includes('sans-serif'))) && font.name == 'ShareTech-Mono')){
                            selectIndex = numFontsAdded
                        }
                        numFontsAdded++
                    }                    
                })
                if (selectIndex > -1){
                    newSelect.selectedIndex = selectIndex
                } else {
                    newSelect.selectedIndex = 0
                }
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
        if (settings[i].hasOwnProperty('category')) {
            currentCategory = settings[i].category
        } else {
            currentCategory = 'general'
        }
        newSetting.setAttribute('data-category', currentCategory)
        // add category to the list if we don't already have it
        if (!categories.includes(currentCategory)) {
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
    if (categories.length > 1) {
        var categoryPicker = document.createElement('select')
        categoryPicker.id = 'categoryPicker'
        categoryPicker.setAttribute('onchange', 'changeActivitySettingsCategory(this.value,this.parentElement)')
        // add 'all' option for categories
        allOption = document.createElement('option')
        allOption.value = 'all'
        allOption.innerHTML = 'all'
        categoryPicker.appendChild(allOption)
        // add all the other categories
        for (let i = 0; i < categories.length; i++) {
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
    settingsAreaInner.id = prefix + 'settingsAreaInner'
    settingsAreaInner.setAttribute('class', 'settingsAreaInner')
    for (i = 0; i < settingEls.length; i++) {
        settingsAreaInner.appendChild(settingEls[i])
    }
    // add columns if there is more than one setting
    settingsAreaInner.style.columns = determineColumnSettingsForSettings(settingEls.length)

    // add all the settings to the main div
    settingsArea.appendChild(settingsAreaInner)
    // so long as there was at least one setting, add a little hr
    if (settingEls.length > 0) {
        var hrule = document.createElement('hr')
        settingsArea.appendChild(hrule)
    }
    // select the first category (after all), so long as there's more than one
    if (categories.length > 1) {
        changeActivitySettingsCategory(categories[0], settingsArea)
        categoryPicker.value = categories[0]
    }    

    // after the settings have been made, check for dependencies
    settings.forEach(setting => {
        if (setting.hasOwnProperty('dependents')){
            settingChanged(document.getElementById(`setting_${setting.type}_${setting.name}`))
        }
    })
}

function getSettings(settings, activityName = '', sourceName = '') { // gets the settngs as they've been set by the user
    // activityName variable will only be used by the profile editor
    var settingEl
    var settingsToReturn = {};

    var prefix = ''

    // for use in the profile editor
    if (activityName != '') {
        prefix = sourceName + '_' + activityName + '_'
    }

    if (settings != null) {
        for (i = 0; i < settings.length; i++) {
            settingEl = document.getElementById(prefix + 'setting_' + settings[i].type + '_' + settings[i].name)
            if (settings[i].type == 'checkbox') { // for checkboxes
                if (settingEl.checked) { // set to true or false depending on whether it's checked          
                    settingsToReturn[settings[i].name] = true;
                } else {
                    settingsToReturn[settings[i].name] = false;
                }
            } else if (settings[i].type == 'number') {
                let val = parseFloat(settingEl.value) // for numbers, parse as number         
                if (isNaN(val)){
                    settingsToReturn[settings[i].name] = 0
                } else {
                    settingsToReturn[settings[i].name] = val          
                }                
            } else if (settings[i].type == 'text'){
                // for text, santitize HTML, replace \n with <br> (and \\n with \n)
                settingsToReturn[settings[i].name] = settingEl.value.replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll(/(?<!\\)\\n/g,'<br>').replaceAll(/\\\\n/g,'\\n')
            } else if (settings[i].type == 'font_family'){
                settingsToReturn[settings[i].name] = fonts.find(font => font.name == settingEl.value)     
                settingsToReturn[settings[i].name].var = settings[i].var
            } else { // for everything else, just get its value
                settingsToReturn[settings[i].name] = settingEl.value                
            }
        }
    }
    return settingsToReturn
}

function settingChanged(el){
    let settingDetails = el.id.split('_')
    let settingType = settingDetails[1] // in the setting id, this should be the part containing the setting type
    let settingName = settingDetails.slice(2).join('_') // join together the rest into a string (in case the setting name contains _)
    let setting = prefsStore.settings.find(setting => setting.name == settingName)
    
    if (setting){
        if (settingType == 'number'){
            checkMinMax(el)
        } else if (settingType == 'select-import'){
            customSelectImport(el,settingName)
        }

        if (setting.hasOwnProperty('dependents')){
            if (settingType == 'checkbox'){
                checkDependents(el.checked,setting)
            } else {
                checkDependents(el.value,setting)
            }            
        }
    }    
}

function checkMinMax(el){
    if (el.min != '' && parseFloat(el.value) < parseFloat(el.min)){
        el.value = el.min
    }
    if (el.max != '' && parseFloat(el.value) > parseFloat(el.max)){
        el.value = el.max
    }
}

// replace $0, $1 etc. with variables
function applyVariables(string,variables){
    let newString = ''
    for (let i = 0; i<string.length; i++){
        if (string[i] == '$'){
            let number = string.slice(i+1).match(/^\d+/)
            if (number && variables.length-1 <= parseInt(number[0])){
                newString += variables[parseInt(number[0])]
                i += number[0].length
            } else {
                newString += string[i]
            }
        } else {
            newString += string[i]
        }
    }
    return newString
}

function checkDependents(value,setting){
    setting.dependents.forEach(dependent =>{
        let dependentName = dependent.name
        if (setting.hasOwnProperty('variables') && dependent.name.includes('$')){
            dependentName = applyVariables(dependentName,setting.variables)
        }
        let dependentDiv = document.querySelector('div.setting[data-setting-name="' + dependentName + '"]')
        if (!dependentDiv){
            console.error(`Error finding dependent setting div ${dependentName}`)
            return
        } else { // if the div exists
            let dependentType = dependentDiv.getAttribute('data-setting-type')            

            let dependentEl = document.getElementById(`setting_${dependentType}_${dependentName}`)
            let dependentSetting = prefsStore.settings.find(setting => setting.name == dependentName)
            
            // enable or disable the dependent
            if (dependent.hasOwnProperty('enable')){
                if ((Array.isArray(dependent.enable) && dependent.enable.includes(value)) || dependent.enable == value){ // if the setting is set to a value that enables the dependent
                    dependentEl.disabled = false
                } else {
                    dependentEl.disabled = true
                }
            }
            
            // set values according to triggers
            if (dependent.hasOwnProperty('triggers')){                
                let trigger = dependent.triggers.find(trigger => trigger.this == value) // find the trigger for the current value
                if (trigger){
                    // if there's a trigger, set its value
                    if (dependentType == 'checkbox'){
                        // for checkbox type, check according to value true or false
                        if (trigger.dependent){
                            dependentEl.checked = true
                        } else {
                            dependentEl.checked = false
                        }
                    } else {
                        // for all other setting types, set dependent literally to trigger value
                        dependentEl.value = trigger.dependent
                    }
                } else if (dependentEl.disabled && dependent.hasOwnProperty('default')){
                    // if there's no trigger and the dependent is disabled, set to the default value
                    if (dependentType == 'checkbox'){
                        // for checkbox type, check according to default
                        if (dependent.default){
                            dependentEl.checked = true
                        } else {
                            dependentEl.checked = false
                        }
                    } else {
                        // for all other setting types, set dependent literally to default value
                        dependentEl.value = dependent.default
                    }
                }
            }            

            if (dependentSetting && dependentSetting.hasOwnProperty('dependents')){
                // if the dependcy also has depdencies, do a check for loops
                if (detectDependencyLoops(setting,dependentSetting)){
                    window.alert('The settings for this activity contain a dependency loop. Please alert the activity creator.')
                    return false
                } else {
                    // we then need to trigger the dependents manually, as onchange won't fire
                    settingChanged(dependentEl)      
                }                
            }
            
        }

        // Clear dependentLoopTracker after processing all dependencies for the setting
        delete dependentLoopTracker[setting.name]

    })
}

function detectDependencyLoops(setting, dependent) {
    let stack = [];
    stack.push({ setting: setting, dependent: dependent });
    
    while (stack.length > 0) {
        let { setting, dependent } = stack.pop();
        if (dependent.hasOwnProperty('dependents')) {
            console.log('Dependent also has dependents. Tracking to prevent loop.');
            if (dependentLoopTracker.hasOwnProperty(setting.name)) {
                if (dependentLoopTracker[setting.name].includes(dependent.name)) {
                    console.error('Dependency loop detected!');
                    return true;
                } else {
                    dependentLoopTracker[setting.name].push(dependent.name);
                }
            } else {
                dependentLoopTracker[setting.name] = [dependent.name];
            }

            // Add dependents of the current dependent to the stack
            dependent.dependents.forEach(dep => stack.push({ setting: dependent, dependent: dep }));
        }
    }

    return false;
}

function showSettings(source = '', activity = '') {
    var inputBox
    if (activity != '') {
        activityName = '_' + activity
        sourceName = '_' + source
        settingsID = source + '_' + activity
    } else {
        inputBox = document.getElementById("inputBox")
        settingsID = 'main'
        activityName = ''
        sourceName = ''
    }
    var showSettingsButton = document.getElementById("showSettingsButton" + sourceName + activityName)
    var settingsArea = document.getElementById("settingsArea" + sourceName + activityName)

    if (settingsVisible[settingsID]) {
        showSettingsButton.classList.remove('up')
        showSettingsButton.classList.add('down')

        if (inputBox != null) {
            inputBox.style.height = ""
        }
        settingsVisible[settingsID] = false
        settingsArea.classList.remove('openSettings')
        // settingsArea.style.minHeight = ""
        //   settingsArea.style.height = ""
        //   settingsArea.style.padding = ""
    } else {
        showSettingsButton.classList.remove('down')
        showSettingsButton.classList.add('up')
        settingsArea.classList.add('openSettings')
        //   settingsArea.style.height = "220px"
        //   settingsArea.style.padding = "20px"
        if (inputBox != null) {
            inputBox.style.height = "calc(100% - 480px)"
        }
        settingsVisible[settingsID] = true
        // settingsArea.style.minHeight = "100px"
    }
}

function changeActivitySettingsCategory(category, settingsArea = document.getElementById('settingsArea')) {
    var settingsAreaInner = settingsArea.querySelector('.settingsAreaInner')
    numSettings = 0
    for (let i = 0; i < settingsAreaInner.children.length; i++) {
        if (category == 'all' || settingsAreaInner.children[i].getAttribute('data-category') == category || settingsAreaInner.children[i].getAttribute('data-category') == 'all') {
            settingsAreaInner.children[i].classList.remove('hidden')
            numSettings++
        } else {
            settingsAreaInner.children[i].classList.add('hidden')
        }
    }
    settingsAreaInner.style.columns = determineColumnSettingsForSettings(numSettings)
}

function determineColumnSettingsForSettings(numSettings) {
    if (numSettings == 1) {
        return '1'
    } else if (numSettings == 2) {
        return '2 auto'
    } else {
        return 'auto 20em'
    }
}

function showExample(sampleData) {
    if (!tableIsEmpty()) {
        if (confirm('This will erase all data in the table and replace it with sample data. Are you sure you want to continue?')) {
            clearTable();
        } else {
            return
        }
    }
    if(sampleData.hasOwnProperty('activity')){
        convertArrayToTableData(sampleData.activity)
    } else {
        convertArrayToTableData(sampleData)
    }
    if(sampleData.hasOwnProperty('settings')){
        resetSettingsToDefault(true)
        setSettings(sampleData.settings)
    }
}

function checkSettings(profileSettings, activitySettings) {
    profileSettings.forEach(setting => {
        let originalSetting = activitySettings.find(obj => {
            return obj.name === setting.name
        })
        if (originalSetting == null) {
            setting.exists = false
        } else {
            setting.exists = true
            if (originalSetting.type == 'number') {
                if (!isNaN(setting.value)) {
                    setting.valid = true
                    if (originalSetting.hasOwnProperty('max') && setting.value > originalSetting.max) {
                        setting.valid = false
                    }
                    if (originalSetting.hasOwnProperty('min') && setting.value < originalSetting.min) {
                        setting.valid = false
                    }
                } else {
                    setting.valid = false
                }
            } else if (originalSetting.type == 'select' || originalSetting.type == 'select-import') {
                if (originalSetting.options.includes(setting.value) || originalSetting.hasOwnProperty('optionValues') && originalSetting.optionValues.includes(setting.value)) {
                    setting.valid = true
                } else if (originalSetting.type == 'select-import') {
                    setting.valid = true                                    
                } else {                    
                    setting.valid = false
                }
            } else if (originalSetting.type == 'font_family'){
                if (fonts.map(font => font.name).includes(setting.value.name) && (!originalSetting.hasOwnProperty('style') || originalSetting.style.includes(setting.value.style))){
                    setting.valid = true
                } else if (setting.hasOwnProperty('custom') && originalSetting.hasOwnProperty('custom')){ // TO DO: Allow importing custom fonts - this is just here to future proof for now!
                    setting.valid = true
                }
            } else if (originalSetting.type == 'language' && languages.map(language => language.code).includes(setting.value)) {
                setting.value == true
            } else if (originalSetting.type == 'checkbox') {
                if (typeof setting.value == 'boolean') {
                    setting.valid = true
                } else {
                    setting.valid = false
                }
            } else if (originalSetting.type == 'text') {
                if (originalSetting.hasOwnProperty('max') && setting.value.length > originalSetting.max) {
                    setting.valid = false
                }
                if (originalSetting.hasOwnProperty('min') && setting.value.length < originalSetting.max) {
                    setting.valid = false
                }
            }
        }
    })
    return profileSettings
}

function resetSettingsToDefault(overrideToFactory = false,settingControls = prefsStore.settings){
    let settings = {}
    if(prefsStore.hasOwnProperty('customDefaults') && !overrideToFactory){
        settings = prefsStore.customDefaults
    } else {
        prefsStore.settings.forEach(setting =>{
            if(setting.hasOwnProperty('default')){
                settings[setting.name] = setting.default
            }
        })        
    }
    setSettings(settings, settingControls, false)
}

function setSettings(settings, settingControls = prefsStore.settings, showErrors = true, activity = '', source = '', settingsArea = document.getElementById('settingsArea')) {
    var deletedErrors = []
    var invalidErrors = []

    var prefix = ''
    if (activity != '') {
        prefix = source + '_' + activity + '_'
    }

    var settingsAsArray = []
    for (const property in settings) {
        settingsAsArray.push({ name: property, value: settings[property], exists: true, valid: true })
    }
    let checkedSettings = checkSettings(settingsAsArray, settingControls)
    checkedSettings.forEach(setting => {
        if (setting.exists) {
            let activitySetting = settingControls.find((actSet) => actSet.name == setting.name)
            let activitySettingEl = document.getElementById(prefix + 'setting_' + activitySetting.type + '_' + activitySetting.name)
            if (setting.valid) {
                if (activitySetting.type == 'checkbox') {
                    if (setting.value == true) {
                        activitySettingEl.checked = true
                    } else {
                        activitySettingEl.checked = false
                    }
                } else if (activitySetting.type == 'select' || activitySetting.type == 'language' || activitySetting.type == 'select-import' || activitySetting.type == 'font_family') {
                    let selectedIndex = -1
                    let val = activitySetting.type == 'font_family' ? setting.value.name : setting.value // use .value.name instead of .value for font settings
                    for (let i = 0; i < activitySettingEl.options.length; i++) {
                        if (activitySettingEl.options[i].value == val) {
                            selectedIndex = i
                        }
                    }
                    activitySettingEl.selectedIndex = selectedIndex
                } else if (activitySetting.type == 'text' || activitySetting.type == 'number') {
                    activitySettingEl.value = setting.value
                }
                settingChanged(activitySettingEl)
            } else { // setting is not valid
                // mark it in red
                activitySettingEl.classList.add('invalidSetting')
                // set to delete the marking when the setting is next changed
                activitySettingEl.addEventListener('change', function(event){activitySettingEl.classList.remove("invalidSetting")}, {once: true}) 
                // add to list of invalid errors
                invalidErrors.push(activitySetting.label)
            }
        } else { // setting does not exist
            // add to last of deleted errors
            deletedErrors.push(setting.name)
        }        
    })
    var errorString = ''

        if (invalidErrors.length > 0) {
            errorString += 'One or more settings saved in the '+ activity.replaceAll('_',' ') + ' profile did not match the expected type. This may be due to an update in the activity. The values have been reset to their defaults.\n'
            invalidErrors.forEach(error => {
                errorString += '-' + error + '\n'
            })
        }

        if (deletedErrors.length > 0) {
            errorString += 'One or more settings saved in the profile do not exist. This may be due to an update in the activity.\n'
            deletedErrors.forEach(error => {
                errorString += '-' + error + '\n'
            })
        }

        if (errorString.length > 0 && showErrors) {
            alert(errorString.trim())
        }
}

function checkInfoBoxVisibility(infoIcon, settingsArea = document.getElementById('settingsArea')  ){
    var infoBox = infoIcon.parentElement.children[0]
  
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

  // for use in the main program (not profile editor)
  function setDefaultActivitySettings(){
    settings = getSettings(prefsStore.settings)
    ipcRenderer.send('setActivitySettingsDefaults',settings)
  }

  function customSelectImport(settingEl,settingName){
    if (settingEl.selectedIndex == settingEl.children.length - 1){
        let setting = prefsStore.settings.find(setting => setting.name == settingName)
        ipcRenderer.send('customSelectImport',settingEl.id,setting.fileTypes)
    }    
  }

  ipcRenderer.on('customSelectImportFileResult', (event,settingId,success) => {
    if (success){
        let settingEl = document.getElementById(settingId)
        settingEl.children[settingEl.selectedIndex].value = 'custom_'+settingId
        console.log('File was loaded successfully')
    } else {
        document.getElementById(settingId).selectedIndex = 0
    }
  })