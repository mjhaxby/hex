function newElement(tag, properties = {}, innerHTML = '') {
    let el = document.createElement(tag)
    for (const property in properties) {
        let propertyName
        if (property.startsWith('_')) {
            // we'll use leading underscores to indicate direct property setting (forcing camel case to be preserved)
            propertyName = property.slice(1) // remove leading underscore
        } else {
            propertyName = property.replaceAll(/([A-Z])/g, '-$1').toLowerCase() // change camel case to kebab-case
        }
        
        if(propertyName == 'disabled' || propertyName == 'checked' || propertyName == 'required' || propertyName == 'selected'){
            el[propertyName] = properties[property] // for disabled, checked and required, we need to set these differently            
        } else {
            el.setAttribute(propertyName, properties[property])
        }        
    }
    if (typeof innerHTML == 'string' || typeof innerHTML == 'number') {
        el.innerHTML = String(innerHTML)
    } else if (Array.isArray(innerHTML)) {
        innerHTML.forEach(child => {
            if (child instanceof Element) {
                el.appendChild(child)
            }
        })
    } else if (innerHTML instanceof Element) {
        el.appendChild(innerHTML)
    }
    return el
}

function cloneElement(element, newProperties = {}) {
    let cloned = element.cloneNode(true)
    for (const property in newProperties) {
        let propertyName
        if (property.startsWith('_')) {
            // we'll use leading underscores to indicate direct property setting (forcing camel case to be preserved)
            propertyName = property.slice(1) // remove leading underscore
        } else {
            propertyName = property.replaceAll(/([A-Z])/g, '-$1').toLowerCase() // change camel case to kebab-case
        }
        
        if(propertyName == 'disabled' || propertyName == 'checked' || propertyName == 'required' || propertyName == 'selected'){
            cloned[propertyName] = newProperties[property] // for disabled, checked and required, we need to set these differently            
        } else {
            cloned.setAttribute(propertyName, newProperties[property])
        }        
    }
    return cloned
}

function returnJSONorArray(dataBlock){
        try {
            return JSON.parse(dataBlock.trim())
        }
        catch {
            return convertTextBlockToArray(dataBlock)
        }
    }

function isJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

function  convertTextBlockToArray(textBlock){  //previous known as inputToArray
    var data = [];
    let textBlockSplit = textBlock.split(/\r?\n/);
    for (let i=0;i<textBlockSplit.length;i++){
        data.push(textBlockSplit[i].split(/\t/))
    }
    return data
}