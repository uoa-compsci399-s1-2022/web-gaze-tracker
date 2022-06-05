// settings menu
const menu = document.createElement("div");
menu.id = "mySidenav"
menu.className = "sidenav"

// Open sidenav functionality
const openNav = () => { document.getElementById("mySidenav").style.display = "block" }

// open sidenav button
const openMenu = document.createElement("button")
openMenu.id = 'menuButton'
openMenu.innerHTML = "SETTINGS"
openMenu.addEventListener('click', openNav)

// Close sidenav functionality 
const closeNav = () => { document.getElementById("mySidenav").style.display = "none" }

// Close sidenav button
const menuCloseButton = document.createElement("a")
menuCloseButton.href = "javascript:void(0)"
menuCloseButton.className = "closebtn"
menuCloseButton.addEventListener('click', closeNav)
menuCloseButton.innerHTML = "&times;"

// Create menu items prefixed with "slider" and functionality name; e.g, sliderIT

// SliderIT for intensity threshold (IT)
const sliderIT = document.createElement("input")
sliderIT.id = "myRange"
sliderIT.className = "slider"
sliderIT.type = "range"
sliderIT.min = 10
sliderIT.max = 50
sliderIT.value = 10

const sliderITtext = document.createElement("p")
sliderITtext.className = 'menuText'
sliderITtext.innerHTML = "Intensity Threshold"

// Append main Settings menu html elements
menu.appendChild(sliderITtext)
menu.appendChild(sliderIT)
menu.appendChild(menuCloseButton)


// video elements used for image processing
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

// create second canvas for adding filters
const grayscaleCanvas = document.createElement("CANVAS")
grayscaleCanvas.id = "canvasOutput2Left"
grayscaleCanvas.width = 200
grayscaleCanvas.height = 200
grayscaleCanvas.style.position = "absolute"
grayscaleCanvas.style.top = 200 + "px"
grayscaleCanvas.style.left = 750 + "px"

// create canvas to draw mapping
const mappingCanvas = document.createElement("CANVAS")
mappingCanvas.id = "mappingCanvas"
mappingCanvas.style.position = "absolute"

/** Clears the canvas
* 
* @param {HTMLElement}  canvas HTML Canvas
* 
*/
const clearCanvas = (canvas) => {
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

export { openMenu, menu, sliderIT, sliderITtext, video, croppedCanvasLeft, grayscaleCanvas, clearCanvas, mappingCanvas }
