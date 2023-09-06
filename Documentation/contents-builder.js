let lastKnownScrollPosition = 0;
let ticking = false;
contentsTop = 0

function buildContents(el,contentsName="contents"){ 
    const headings = el.querySelectorAll('h2, h3, h4, h5, h6')
    var counters = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
    var contents = ""
    var prevLevel = 0
    
    headings.forEach(heading => {
        var level = parseInt(heading.nodeName.substring(1))
        var title = heading.textContent
        // if we've gone back down a level (more important header) or stayed and the same level
        if (level <= prevLevel){
            if(prevLevel != 0){ // if not the very first header
                // close however many subsections we need to in order to get back to the same level
                for (let i = 0; i <= (prevLevel - level); i++){
                    contents += '</div>\n' // close the last subsection
                }
            }
            // if we've gone back down a level
            if (level < prevLevel){
                // reset previous level counter
                counters[prevLevel] = 0
            }                             
        }

        // make the ID by tunneling down through all the relavent level counters
        var id_parts = []
        for (let i = 1; i<=6; i++){
            if(level >= i){
                id_parts.push(counters[i])
            }
        }
        var id = id_parts.join('_')

        var viewStatus = 'closed'
        if (level <= 2){
            viewStatus = 'open'
        }

        contents += `<div class="contentsHeader level${level}" id="contentHeader_${id}" data-sub="contentsSub_${id}">`
        if (viewStatus == 'closed'){
            contents += `<i class="arrow right openButton" onclick="openSub(this, 'contentsSub_${id}')"></i>`
        } else {
            contents += `<i class="arrow down openButton" onclick="closeSub(this, 'contentsSub_${id}')"></i>`
        }
        
        contents += `<a href="#${id}">${title}</a>`
        contents += '</div>\n'
        contents += `<div class="contentsSub level${level} ${viewStatus}" id="contentsSub_${id}">\n` // open new subsection
        
        heading.innerHTML = `<a name="${id}">${heading.innerHTML}</a>`

        counters[level]++      
        prevLevel = level     
        
    })

    var contentsEl = document.createElement('div')
    contentsEl.setAttribute('id',contentsName)
    contentsEl.setAttribute('class','contents')
    contentsEl.innerHTML = contents

    // Find arrows that aren't necessary and remove them (TODO: Finish and make work!)
    var contentsHeaders = contentsEl.querySelectorAll('.contentsHeader')
    contentsHeaders.forEach(contentsHeader => {
        var contentsSub = contentsEl.querySelector('#'+contentsHeader.getAttribute('data-sub'))
        if (contentsSub.children.length == 0){
            contentsHeader.children[0].remove()
        }
    })    
    return contentsEl
}

function contentsSizeChange(event, dummyEl){

    dummyEl.style.height = event[0].borderBoxSize[0].blockSize + 'px'
    console.log(event[0])
}

function openSub(button, subID){
    sub = document.getElementById(subID)
    sub.classList.remove('closed')
    sub.classList.add('open')
    button.classList.add('down')
    button.classList.remove('right')    
    button.setAttribute('onclick', 'closeSub(this, "'+subID+'")')
}

function closeSub(button, subID){
    sub = document.getElementById(subID)
    sub.classList.remove('open')
    sub.classList.add('closed')
    button.classList.add('right')
    button.classList.remove('down')  
    button.setAttribute('onclick', 'openSub(this, "'+subID+'")')
}

function contentsMove(scrollPos, contentsID){
    contents = document.getElementById(contentsID) 
    contentsPos = contents.getBoundingClientRect()
    contentsDummy = document.getElementById(contentsID + '_dummy')
    if (scrollPos > contentsTop){
        if (!contents.classList.contains('side')){
            contents.style.left = 'calc(3% - ' + (contentsPos.width) + 'px)'
            // add class after moved out the way
            setTimeout(() => {
                contents.classList.add('side')
            },1000)              

            // contentsDummy.classList.add('sideMode')            
        }
        
    } else {
        contents.style.left = null
        contents.style.top = contentsTop
        setTimeout(() => {            
            contents.classList.remove('side')
            // contentsDummy.classList.remove('sideMode')
        },1000)
        
    }
}

function enableMoveToSide(contentsEl){

    contentsID = contentsEl.id
    contentsPos = contentsEl.getBoundingClientRect()

    var contentsDummyEl = document.createElement('div')
    contentsDummyEl.classList.add('contentsDummy')
    contentsDummyEl.setAttribute('id',contentsID+'_dummy')
    // contentsDummyEl.style.height = contentsPos.height

    contentsTop = contentsPos.top // remember its normal position

    contentsEl.parentElement.insertBefore(contentsDummyEl,contentsEl)

    contentsEl.style.top = contentsTop
    contentsEl.classList.add('moveable')

    indicatorArrow = document.createElement('div')
    indicatorArrow.setAttribute('class','indicator arrow right')
    contentsEl.appendChild(indicatorArrow)
    
    // we need to know when the contents element moves
    new ResizeObserver((event) => {contentsSizeChange(event, contentsDummyEl)}).observe(contentsEl)

    document.addEventListener("scroll", (event) => {
        lastKnownScrollPosition = window.scrollY;
      
        if (!ticking) {
          window.requestAnimationFrame(() => {
            contentsMove(lastKnownScrollPosition, contentsID);
            ticking = false;
          });
      
          ticking = true;
        }
      });
} 

