import { drawCroppedCanvas } from './modules/eyeDetection.js'
import { clearCanvas, grayscaleCanvas, croppedCanvasLeft, video, sliderIT, sliderITtext, mappingCanvas, menu, openMenu } from './modules/elements.js'
import { applyImageProcessing } from './modules/imageProcessing.js'
import { applyMinimumFilter, drawPupilRegion, evaluateIntensity, getPMIIndex, getPupils } from './modules/pupilDetection.js'
import { startCalibration, userGazePoints } from './modules/calibration.js'
import { getPositions, drawMapping } from './modules/mapping.js'

// constant
var globalList = []

// Load video element and append to body
video.load()
document.body.appendChild(video)

// Load models and start video
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('assets/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('assets/models'),
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

    startCalibration()

    // display settings menu
    document.body.appendChild(openMenu)
    document.body.appendChild(menu)

    // Main loop where face detection and eye tracking takes place.
    // Repeats every 30 ms
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        // drawing landmarks on clear canvas
        faceapiCanvas.getContext('2d').drawImage(video, 0, 0, faceapiCanvas.width, faceapiCanvas.height)
        faceapi.draw.drawFaceLandmarks(faceapiCanvas, resizedDetections)

        // Only continue if one face is detected
        if (detections.length === 1) {
            // add canvases to document
            document.body.append(croppedCanvasLeft)
            document.body.append(grayscaleCanvas)
            document.body.append(mappingCanvas)


            // Eye detection
            drawCroppedCanvas(detections, croppedCanvasLeft)
            // Image Processing
            applyImageProcessing(croppedCanvasLeft, grayscaleCanvas)

            // Pupil Detection
            // Get intensity threshold from slider 
            const intensityThreshold = sliderIT.value / 1000
            sliderITtext.innerHTML = "Intensity threshold: " + intensityThreshold

            evaluateIntensity(croppedCanvasLeft, intensityThreshold)
            applyMinimumFilter(croppedCanvasLeft)
            const pmiIndex = getPMIIndex(croppedCanvasLeft)
            if (pmiIndex !== -1) {

                //Draw the dot in the position of the pupil on the greyscale canvas
                const [pupilX, pupilY] = getPupils(croppedCanvasLeft, pmiIndex)
                drawPupilRegion(grayscaleCanvas, pupilX, pupilY)

                // mapping to the screen
                if (userGazePoints.calibrationComplete) {
                    const [cursorX, cursorY, screenWidth, screenHeight, yScreenStart, xScreenStart] = getPositions(pupilX, pupilY)
                    globalList.push([cursorX, cursorY])
                    let numberOfSavedElements = 3
                    if (globalList.length === numberOfSavedElements) {
                        let avgX = 0
                        let avgY = 0
                        for (let i = 0; i < globalList.length; i++) {
                            avgX += globalList[i][0]
                            avgY += globalList[i][1]
                        }
                        globalList = []

                        avgX = parseInt(avgX / numberOfSavedElements)
                        avgY = parseInt(avgY / numberOfSavedElements)

                        // style canvas
                        drawMapping(mappingCanvas, avgX, avgY, screenWidth, screenHeight, yScreenStart, xScreenStart)
                    }

                }
            }
        } else {
            clearCanvas(croppedCanvasLeft)
            clearCanvas(grayscaleCanvas)
            clearCanvas(mappingCanvas)
        }
    }, 30)
})