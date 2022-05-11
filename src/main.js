import { drawCroppedCanvases } from './modules/eyeDetection.js'
import { clearCanvas, croppedCanvas2, croppedCanvasLeft, croppedCanvasRight, video } from './modules/elements.js'
import { applyImageProcessing } from './modules/imageProcessing.js'

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

        // extracting eye data
        if (detections.length === 1) {
            // add canvases to document
            document.body.append(croppedCanvasLeft)
            document.body.append(croppedCanvasRight)
            document.body.append(croppedCanvas2)

            // Eye detection
            drawCroppedCanvases(detections)
            // Image Processing
            applyImageProcessing()

            // ------------------------ PUPIL DETECTION -----------------------------
            let ctx = croppedCanvasLeft.getContext('2d')
            let imgData = ctx.getImageData(0, 0, croppedCanvasLeft.width, croppedCanvasLeft.height)
            // Make a copy of original grayscale data
            let originalGrayScaleData = Object.assign([], imgData.data)

            // Applying CDF filter 

            // Getting the input value from the slider
            const sliderInputValue = document.getElementById("myRange")
            // Grabs value from value from sliderInputValue and approximates conversion            
            const intensityThreshold = sliderInputValue.value / 1000
            const output = document.getElementById("intensityThreshold")
            output.innerHTML = intensityThreshold

            for (let i = 3; i < imgData.data.length; i += 4) {
                // Parameter we can change 0.03
                if ((1.0 / parseFloat(imgData.data[i - 1])) < intensityThreshold) {
                    imgData.data[i - 3] = 0
                    imgData.data[i - 2] = 0
                    imgData.data[i - 1] = 0
                } else {
                    imgData.data[i - 3] = 255
                    imgData.data[i - 2] = 255
                    imgData.data[i - 1] = 255
                }
            }

            // draw CDF filtered image
            ctx.clearRect(0, 0, croppedCanvasLeft.width, croppedCanvasLeft.height)
            croppedCanvasLeft.width = imgData.width
            croppedCanvasLeft.height = imgData.height
            ctx.putImageData(imgData, 0, 0)

            // minimim filter applied (SEARCH FOR MORE FILTERS TO APPLY)
            const src = cv.imread('canvasOutputLeft')
            let dst = new cv.Mat()
            let M = cv.Mat.ones(5, 5, cv.CV_8U)
            let anchor = new cv.Point(-1, -1)
            // You can try more different parameters
            cv.erode(src, dst, M, anchor, 2, cv.BORDER_ISOLATED, cv.morphologyDefaultBorderValue())
            cv.imshow('canvasOutputLeft', dst)
            src.delete()
            dst.delete()
            M.delete()


            // Getting image data after application of minimum filter
            imgData = ctx.getImageData(0, 0, croppedCanvasLeft.width, croppedCanvasLeft.height)

            // Search for brightest possible value Pixel with Minimum Intensity (PMI)
            let pmi = 255
            // if nothing detected
            let pmiIndex = -1
            let pixelNum = 1

            for (let i = 3; i < imgData.data.length; i += 4) {
                if (imgData.data[i - 1] == 255) {
                    if (originalGrayScaleData[i - 1] < pmi) {
                        pmi = originalGrayScaleData[i - 1]
                        pmiIndex = pixelNum
                    }
                }
                pixelNum++
            }

            if (pmiIndex !== -1) {
                // calculate position of PMI
                const pmiX = pmiIndex % (croppedCanvasLeft.width)  //column
                const pmiY = Math.floor(pmiIndex / (croppedCanvasLeft.width)) //row

                // convert grayscale to 2D array
                let grayScaleMatrix = []
                let row = []
                let counter = 0
                for (let i = 3; i < originalGrayScaleData.length; i += 4) {
                    counter++
                    row.push(originalGrayScaleData[i - 1])
                    if (counter == croppedCanvasLeft.width) {
                        grayScaleMatrix.push(row)
                        row = []
                        counter = 0
                    }
                }

                // look for 70x70 area around pmi 
                let averageIntensity70x70 = getAverageIntensity(grayScaleMatrix, pmiX, pmiY, 35, croppedCanvasLeft)

                // look into grayScale 100x100 area around pmi and check against AI in 70x70
                const arrayOfPoints = []
                for (let row = Math.max(pmiY - 50, 0); row < Math.min(pmiY + 50, croppedCanvasLeft.height); row++) {
                    for (let pixel = Math.max(pmiX - 50, 0); pixel < Math.min(pmiX + 50, croppedCanvasLeft.width); pixel++) {
                        if (grayScaleMatrix[row][pixel] < averageIntensity70x70) {
                            arrayOfPoints.push([parseInt(pixel), parseInt(row)])
                        }
                    }
                }

                // calculating average coordinates
                let totalX = 0
                let totalY = 0
                counter = 0
                arrayOfPoints.forEach(element => {
                    totalX += element[0]
                    totalY += element[1]
                    counter++
                })
                const newPmiX = totalX / counter
                const newPmiY = totalY / counter

                // coordinates for main image
                // mainImageColumn = leftStartX + padding + column / leftDisX
                // mainImageRow = leftStartY - padding + row / leftDisY
                // console.log(row, column, mainImageRow, mainImageColumn)

                // drawing circle at location of pmi
                // let c = document.getElementById("canvasOutput2Left")
                let ctxx = croppedCanvas2.getContext("2d")
                ctxx.lineWidth = 2

                ctxx.beginPath()
                ctxx.strokeStyle = 'blue'
                ctxx.rect(pmiX - 50, pmiY - 50, 100, 100)
                ctxx.stroke()

                ctxx.beginPath()
                ctxx.strokeStyle = 'purple'
                ctxx.rect(pmiX - 35, pmiY - 35, 70, 70)
                ctxx.stroke()

                // pmi before
                ctxx.beginPath()
                ctxx.strokeStyle = 'green'
                ctxx.arc(pmiX, pmiY, 2, 0, 2 * Math.PI)
                ctxx.stroke()

                // pmi after the averageIntesity calculations
                ctxx.beginPath()
                ctxx.strokeStyle = 'red'
                ctxx.arc(newPmiX, newPmiY, 2, 0, 2 * Math.PI)
                ctxx.stroke()
            }
        } else {
            clearCanvas(croppedCanvasLeft)
            clearCanvas(croppedCanvasRight)
            clearCanvas(croppedCanvas2)
        }
    }, 30)
})

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

/** Calculates the average intensity in a (size x size) pixel square around the PMI
* 
* @param {array}  grayScaleMatrix 2D array of pixels
* @param {number}  x x position of PMI
* @param {number}  y y position of PMI
* @param {number}  size pixel size of square around PMI
* @param {canvas}  canvas canvas on which the calculation is applied
* 
* @return {number} Returns the average intensity around the PMI
*/
const getAverageIntensity = (grayScaleMatrix, x, y, size, canvas) => {
    let totalIntensity = 0
    let counter = 0

    for (let row = Math.max(y - size, 0); row < Math.min(y + size, canvas.height); row++) {
        for (let pixel = Math.max(x - size, 0); pixel < Math.min(x + size, canvas.width); pixel++) {
            totalIntensity += parseInt(grayScaleMatrix[row][pixel])
            counter++
        }
    }
    return totalIntensity / counter
}