import { drawCroppedCanvases } from './modules/eyeDetection.js'
import { clearCanvas, croppedCanvas2, croppedCanvasLeft, croppedCanvasRight, video } from './modules/elements.js'
import { applyImageProcessing } from './modules/imageProcessing.js'
import { applyMinimumFilter, drawPupilRegion, evaluateIntensity, getPMIIndex, getPupils } from './modules/pupilDetection.js'

// Faceapi eye points
// const LEFT_EYE_POINTS = [36, 37, 38, 39, 40, 41]
// const RIGHT_EYE_POINTS = [42, 43, 44, 45, 46, 47]

// Load video element and append to body
video.load()
document.body.appendChild(video)

// Load models and start video
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('assets/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('assets/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('assets/models')
]).then(startVideo)

function startVideo() {
    navigator.getUserMedia({ video: {} },
        stream => video.srcObject = stream,
        err => console.error(err)
    )
}

// Video event listener (executes when the webcam starts)
video.addEventListener('play', () => {
    // Create canvas for faceapi overlay from video feed
    const faceapiCanvas = faceapi.createCanvasFromMedia(video)
    faceapiCanvas.id = "faceapiCanvas"
    faceapiCanvas.style.position = "absolute"
    faceapiCanvas.style.top = 0 + "px"
    faceapiCanvas.style.left = 0 + "px"
    document.body.append(faceapiCanvas)

    // Set faceapi dimensions
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(faceapiCanvas, displaySize)

    // Main loop where face detection and eye tracking takes place.
    // Repeats every 30 ms
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        // drawing detection and landmarks on clear canvas
        faceapiCanvas.getContext('2d').drawImage(video, 0, 0, faceapiCanvas.width, faceapiCanvas.height)
        // faceapi.draw.drawDetections(canvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(faceapiCanvas, resizedDetections)

        // Only continue if one face is detected
        if (detections.length === 1) {
            // add canvases to document
            document.body.append(croppedCanvasLeft)
            document.body.append(croppedCanvasRight)
            document.body.append(croppedCanvas2)

            // Eye detection
            drawCroppedCanvases(detections, croppedCanvasLeft, croppedCanvasRight)
            // Image Processing
            applyImageProcessing(croppedCanvasLeft, croppedCanvas2)

            // Pupil Detection
            // Get intensity threshold from slider 
            const intensityThreshold = document.getElementById("myRange").value / 1000
            document.getElementById("intensityThreshold").innerHTML = intensityThreshold

            evaluateIntensity(croppedCanvasLeft, intensityThreshold)
            applyMinimumFilter(croppedCanvasLeft)
            const pmiIndex = getPMIIndex(croppedCanvasLeft)
            if (pmiIndex !== -1) {
                const [pupilX, pupilY] = getPupils(croppedCanvasLeft, pmiIndex)
                drawPupilRegion(croppedCanvas2, pupilX, pupilY)
            }
        } else {
            clearCanvas(croppedCanvasLeft)
            clearCanvas(croppedCanvasRight)
            clearCanvas(croppedCanvas2)
        }
    }, 30)
})

// ------ delete this? --------
// /**
//  * Finds the starting and ending x,y coordinates from the left eye to the right eye.
//  * 
//  * @param {Object}  leftEye leftEye variable is a dictionary of x and y coordinates
//  * @param {Object}  rightEye rightEye variable is a dictionary of x and y coordinates
//  * @param {number}  padding padding added to the left and right
//  * 
//  * @return {number} Returns an array of [startX, startY, disX, disY]
//  */
// const calculateStartAndDistance = (leftEye, rightEye, padding) => {

//     // Calculations for leftEye
//     // Place x and y coords into seperate arrays
//     const leftEyeXcoord = leftEye.map(i => i.x)
//     const leftEyeYcoord = leftEye.map(i => i.y)

//     let minX = Math.min(...leftEyeXcoord) - padding
//     let minY1 = Math.min(...leftEyeYcoord)
//     let maxY1 = Math.max(...leftEyeYcoord)

//     // Calculations for rightEye
//     const rightEyeXcoord = rightEye.map(i => i.x)
//     const rightEyeYcoord = rightEye.map(i => i.y)

//     let maxX = Math.max(...rightEyeXcoord) + padding
//     let minY2 = Math.min(...rightEyeYcoord)
//     let maxY2 = Math.max(...rightEyeYcoord)

//     // If you rotate your head, Y position of the left and the right eye will change, 
//     // sometimes left eye will have min coordinate and sometimes right eye will have min,
//     // same for max coordinate
//     // Determine whether minY, maxY is on the right eye or on the left eye 
//     let minY = Math.min(minY1, minY2) - padding
//     let maxY = Math.max(maxY1, maxY2) + padding

//     return [minX, minY, maxX - minX, maxY - minY]
// }