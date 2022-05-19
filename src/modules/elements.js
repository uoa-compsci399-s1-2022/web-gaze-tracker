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

export { video, croppedCanvasLeft, grayscaleCanvas, clearCanvas, mappingCanvas }