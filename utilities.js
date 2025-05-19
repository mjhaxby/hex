function newElement(tag, properties = {}, innerHTML = '') {
    let el = document.createElement(tag)
    for (const property in properties) {
        let propertyName = property.replaceAll(/([A-Z])/g, '-$1').toLowerCase() // change camel case to - seperation
        if(propertyName == 'disabled' || propertyName == 'disabled' || propertyName == 'required'){
            el[propertyName] = properties[property] // for disabled, disabled and required, we need to set these differently            
        } else {
            el.setAttribute(propertyName, properties[property])
        }        
    }
    if (typeof innerHTML == 'string' || typeof innerHTML == 'number') {
        el.innerHTML = innerHTML
    } else if (Array.isArray(innerHTML)) {
        innerHTML.forEach(child => {
            el.appendChild(child)
        })
    } else {
        el.appendChild(innerHTML)
    }
    return el
}