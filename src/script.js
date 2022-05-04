// Faceapi eye points
const LEFT_EYE_POINTS = [36, 37, 38, 39, 40, 41]
const RIGHT_EYE_POINTS = [42, 43, 44, 45, 46, 47]

// Create video element
const video = document.createElement("VIDEO")
video.id = "video"
video.width = 750
video.height = 560
video.autoplay = true;
video.defaultMuted = true
video.style.position = "absolute"
video.style.top = 0 + "px"
video.style.left = 0 + "px"

// Load video element and append to body
video.load();
document.body.appendChild(video);

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
    // Create canvas for faceapi overlay
    const canvas = faceapi.createCanvasFromMedia(video)
    canvas.id = "videoCanvas"
    canvas.style.position = "absolute"
    canvas.style.top = 0 + "px"
    canvas.style.left = 0 + "px"
    document.body.append(canvas)

    // create second canvas for adding filters
    const croppedCanvasLeft = document.createElement("CANVAS")
    croppedCanvasLeft.id = "canvasOutputLeft"
    croppedCanvasLeft.width = 200
    croppedCanvasLeft.height = 200
    croppedCanvasLeft.style.position = "absolute"
    croppedCanvasLeft.style.top = 0 + "px"
    croppedCanvasLeft.style.left = 750 + "px"
    document.body.append(croppedCanvasLeft)

    const croppedCanvasRight = document.createElement("CANVAS")
    croppedCanvasRight.id = "canvasOutputRight"
    croppedCanvasRight.width = 200
    croppedCanvasRight.height = 200
    croppedCanvasRight.style.position = "absolute"
    croppedCanvasRight.style.top = 0 + "px"
    croppedCanvasRight.style.left = 950 + "px"
    document.body.append(croppedCanvasRight)

    // create second canvas for adding filters
    const croppedCanvas2 = document.createElement("CANVAS")
    croppedCanvas2.id = "canvasOutput2Left"
    croppedCanvas2.width = 200
    croppedCanvas2.height = 200
    croppedCanvas2.style.position = "absolute"
    croppedCanvas2.style.top = 200 + "px"
    croppedCanvas2.style.left = 750 + "px"
    document.body.append(croppedCanvas2)

    // Set faceapi dimensions
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize);

    // Main loop where face detection and eye tracking takes place.
    // Repeats every 30 ms
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        // drawing detection and landmarks on clear canvas
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
        // faceapi.draw.drawDetections(canvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)

        // extracting eye data
        if (detections.length === 1) {
            // get left and right eye
            const leftEye = detections[0].landmarks.getLeftEye()
            const rightEye = detections[0].landmarks.getRightEye()

            const padding = 5

            const [leftStartX, leftStartY, leftDisX, leftDisY] = calculateStartAndDistance(leftEye, padding)

            const [rightStartX, rightStartY, rightDisX, rightDisY] = calculateStartAndDistance(rightEye, padding)

            // draw cropped video onto canvas
            croppedCanvasLeft.getContext('2d').drawImage(
                video,
                leftStartX, leftStartY,                                 // start position
                leftDisX, leftDisY,                                     // area to crop
                0, 0,                                           // draw from point (0, 0) in the canvas,
                croppedCanvasLeft.width, croppedCanvasLeft.height
            )

            croppedCanvasRight.getContext('2d').drawImage(
                video,
                rightStartX, rightStartY,                                 // start position
                rightDisX, rightDisY,                                     // area to crop
                0, 0,                                           // draw from point (0, 0) in the canvas,
                croppedCanvasRight.width, croppedCanvasRight.height
            )


            // OpenCV adaptive threshold filter applied to the video 
            const imgSrc = cv.imread('canvasOutputLeft')
            let dst = new cv.Mat()
            cv.cvtColor(imgSrc, dst, cv.COLOR_RGBA2GRAY, 0)
            cv.imshow('canvasOutputLeft', dst)

            // !remove later!
            cv.imshow('canvasOutput2Left', dst)
            // ---------------

            imgSrc.delete()
            dst.delete()


            let canvas = document.getElementById("canvasOutputLeft")
            let ctx = canvas.getContext('2d')
            let imgData = ctx.getImageData(0, 0, croppedCanvasLeft.width, croppedCanvasLeft.height)
            // Make a copy of original grayscale data
            let originalGrayScaleData = Object.assign([], imgData.data)

            // Applying CDF filter 

            // Getting the input value from the slider
            const sliderInputValue = document.getElementById("myRange");
            
            // Grabs value from value from sliderInputValue and approximates conversion            
            const intensityThreshold = sliderInputValue.value / 1000;
            // console.log(intensityThreshold)

            const output = document.getElementById("intensityThreshold")
            output.innerHTML = intensityThreshold;

            for (let i = 3; i<imgData.data.length; i+=4) {
                // Parameter we can change 0.03
                if ((1.0 / parseFloat(imgData.data[i-1])) < intensityThreshold){
                    imgData.data[i-3] = 0
                    imgData.data[i-2] = 0
                    imgData.data[i-1] = 0
                }else{
                    imgData.data[i-3] = 255
                    imgData.data[i-2] = 255
                    imgData.data[i-1] = 255
                }
            }
            
            // draw CDF filtered image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = imgData.width;
            canvas.height = imgData.height;
            ctx.putImageData(imgData, 0, 0);


            // minimim filter applied (SEARCH FOR MORE FILTERS TO APPLY)
            src = cv.imread('canvasOutputLeft');
            dst = new cv.Mat();
            let M = cv.Mat.ones(5, 5, cv.CV_8U);
            let anchor = new cv.Point(-1, -1);
            // You can try more different parameters
            cv.erode(src, dst, M, anchor, 2, cv.BORDER_ISOLATED, cv.morphologyDefaultBorderValue());
            cv.imshow('canvasOutputLeft', dst);
            src.delete(); dst.delete(); M.delete();

            
            // Getting image data after application of minimum filter
            canvas = document.getElementById("canvasOutputLeft")
            ctx = canvas.getContext('2d')
            imgData = ctx.getImageData(0, 0, croppedCanvasLeft.width, croppedCanvasLeft.height)
            
            // Search for brightest possible value Pixel with Minimum Intensity
            let pmi = 255
            // if nothing detected
            let pmiIndex = -1
            let pixelNum = 1
            
            for (let i = 3; i<imgData.data.length; i+=4) {
                if (imgData.data[i-1] == 255){
                    if (originalGrayScaleData[i-1] < pmi){
                        pmi = originalGrayScaleData[i-1]
                        pmiIndex = pixelNum
                    }
                }
                pixelNum++
            }
            // console.log(pmi, pmiIndex)

            rowY = Math.floor(pmiIndex/(croppedCanvasLeft.width))
            columnX = pmiIndex % (croppedCanvasLeft.width)

            // console.log(rowY, columnX)

            // mainImageColumn = leftStartX + padding + column/leftDisX
            // mainImageRow = leftStartY - padding + row/leftDisY
            // console.log(row, column, mainImageRow, mainImageColumn)

            // drawing circle at location of pmi
            let c = document.getElementById("canvasOutputLeft")
            let ctxx = c.getContext("2d")
            ctxx.beginPath()
            ctx.lineWidth = 6
            ctx.strokeStyle = 'green'
            ctxx.arc(columnX, rowY, 5, 0, 2 * Math.PI)
            ctxx.stroke()

            // array [R,G,B,A,R,G,B,A,...]
            // let matrix = cv.matFromImageData(imgData).data

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
//     const leftEyeXcoord = leftEye.map(i => i.x);
//     const leftEyeYcoord = leftEye.map(i => i.y);

//     let minX = Math.min(...leftEyeXcoord) - padding
//     let minY1 = Math.min(...leftEyeYcoord)
//     let maxY1 = Math.max(...leftEyeYcoord)

//     // Calculations for rightEye
//     const rightEyeXcoord = rightEye.map(i => i.x);
//     const rightEyeYcoord = rightEye.map(i => i.y);

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


/**
 * Finds the starting and ending x,y coordinates from the left eye to the right eye.
 * 
 * @param {Object}  eye eye variable is a dictionary of x and y coordinates
 * @param {number}  padding padding added to image
 * 
 * @return {number} Returns an array of [startX, startY, disX, disY]
 */
const calculateStartAndDistance = (eye, padding) => {

    // Place x and y coords into seperate arrays
    const EyeXcoord = eye.map(i => i.x);
    const EyeYcoord = eye.map(i => i.y);

    let minX = Math.min(...EyeXcoord) - padding
    let minY1 = Math.min(...EyeYcoord)
    let maxY1 = Math.max(...EyeYcoord)

    let maxX = Math.max(...EyeXcoord) + padding
    let minY2 = Math.min(...EyeYcoord)
    let maxY2 = Math.max(...EyeYcoord)

    let minY = Math.min(minY1, minY2) - padding
    let maxY = Math.max(maxY1, maxY2) + padding

    return [minX, minY, maxX - minX, maxY - minY]
}