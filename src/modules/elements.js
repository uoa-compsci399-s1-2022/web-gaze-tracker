// HTML elements

// Create video element
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

export { video, croppedCanvasLeft, croppedCanvasRight, croppedCanvas2, clearCanvas }