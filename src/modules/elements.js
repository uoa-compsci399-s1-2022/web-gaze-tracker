// HTML elements


/** Creates a sidebar settings menu to change canvas image processing **/ 
const menu = document.createElement("div");
menu.id = "mySidenav"
menu.className = "sidenav"

// --- Open sidenav functionality ---
const openNav = () => { document.getElementById("mySidenav").style.display = "block" }

// create open sidenav button
const openMenu = document.createElement("button")
openMenu.id = 'menuButton'
openMenu.innerHTML = "SETTINGS"
openMenu.addEventListener('click', openNav)
document.body.appendChild(openMenu)

// --- Close sidenav functionality ---
const closeNav = () => { document.getElementById("mySidenav").style.display = "none" }

// create Close sidenav button
const menuCloseButton = document.createElement("a")
menuCloseButton.href = "javascript:void(0)"
menuCloseButton.className = "closebtn"
menuCloseButton.addEventListener('click', closeNav)
menuCloseButton.innerHTML = "&times;"

// --- Create menu items prefixed with "slider" and functionality name; e.g, sliderIT ---

// SliderIT for intensity threshold (IT)
const sliderIT = document.createElement("input")
sliderIT.id = "myRange"
sliderIT.className = "slider"
sliderIT.type = "range"
sliderIT.min = 10
sliderIT.max = 30
sliderIT.value = 10

const sliderITtext = document.createElement("p")
sliderITtext.className = 'menuText'
sliderITtext.innerHTML = "Intensity Threshold"

// --- Append main Settings menu html elements
menu.appendChild(sliderITtext)
menu.appendChild(sliderIT)
menu.appendChild(menuCloseButton)
document.body.appendChild(menu)



/** Creates video elements used for image processing **/ 
const video = document.createElement("VIDEO")
video.id = "video"
video.width = 750
video.height = 560
video.autoplay = true
video.defaultMuted = true
video.style.position = "absolute"
video.style.top = 0 + "px"
video.style.left = 0 + "px"

// create second canvas for adding filters
const croppedCanvasLeft = document.createElement("CANVAS")
croppedCanvasLeft.id = "canvasOutputLeft"
croppedCanvasLeft.width = 200
croppedCanvasLeft.height = 200
croppedCanvasLeft.style.position = "absolute"
croppedCanvasLeft.style.top = 0 + "px"
croppedCanvasLeft.style.left = 750 + "px"

// test canvas for comparisons
const croppedCanvasRight = document.createElement("CANVAS")
croppedCanvasRight.id = "canvasOutputRight"
croppedCanvasRight.width = 200
croppedCanvasRight.height = 200
croppedCanvasRight.style.position = "absolute"
croppedCanvasRight.style.top = 0 + "px"
croppedCanvasRight.style.left = 950 + "px"

// create second canvas for adding filters
const croppedCanvas2 = document.createElement("CANVAS")
croppedCanvas2.id = "canvasOutput2Left"
croppedCanvas2.width = 200
croppedCanvas2.height = 200
croppedCanvas2.style.position = "absolute"
croppedCanvas2.style.top = 200 + "px"
croppedCanvas2.style.left = 750 + "px"

/** Clears the canvas
* 
* @param {HTMLElement}  canvas HTML Canvas
* 
*/
const clearCanvas = (canvas) => {
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

export { sliderIT, sliderITtext, video, croppedCanvasLeft, croppedCanvasRight, croppedCanvas2, clearCanvas }