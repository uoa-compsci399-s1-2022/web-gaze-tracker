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
    const croppedCanvas = document.createElement("CANVAS")
    croppedCanvas.id = "canvasOutput"
    croppedCanvas.width = 500
    croppedCanvas.height = 150
    croppedCanvas.style.position = "absolute"
    croppedCanvas.style.top = 0 + "px"
    croppedCanvas.style.left = 750 + "px"
    document.body.append(croppedCanvas)

    // create third canvas for adding filters
    // const faceApiCanvas = faceapi.createCanvasFromMedia(video)
    // faceApiCanvas.id = "faceApiCanvas"
    // faceApiCanvas.style.position = "absolute"
    // faceApiCanvas.style.top = 560 + "px"
    // faceApiCanvas.style.left = 0 + "px"
    // document.body.append(faceApiCanvas)

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
            // only need right eye as camera is flipped
            const rightEye = detections[0].landmarks.getRightEye()
            const leftEye = detections[0].landmarks.getLeftEye()

            // get resized points
            const leftEyeResized = resizedDetections[0].landmarks.getLeftEye()
            const rightEyeResized = resizedDetections[0].landmarks.getRightEye()


            const [startX, startY, disX, disY] = caluclateStartAndDistance(leftEye, rightEye)

            // draw cropped video onto canvas
            croppedCanvas.getContext('2d').drawImage(
                video,
                startX, startY,                                 // start position
                disX, disY,                                     // area to crop
                0, 0,                                           // draw from point (0, 0) in the canvas,
                croppedCanvas.width, croppedCanvas.height
            )


            // OpenCV adaptive threshold filter applied to the video 
            const imgSrc = cv.imread('canvasOutput')
            let dst = new cv.Mat()
            cv.cvtColor(imgSrc, imgSrc, cv.COLOR_RGBA2GRAY, 0)
            cv.adaptiveThreshold(imgSrc, dst, 200, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 35, 2)
            cv.imshow('canvasOutput', dst)
            imgSrc.delete()
            dst.delete()

            
            let canvas = document.getElementById("canvasOutput")
            let ctx = canvas.getContext('2d')
            let imgData = ctx.getImageData(0, 0, croppedCanvas.width, croppedCanvas.height)
            
            // array [R,G,B,A,R,G,B,A,...]
            let matrix = cv.matFromImageData(imgData).data
            
            //WARNING: tried to make it in a more readable format, however going through the matrix just one time 
            // takes so much time(making it laggy) since the resolution is high, therefore the array consists of 80000 pixels making it total of 80000*4=320000 elements in the array.
            // so if we want to work futher with the matrix we need to 1. reduce resolution, 2. reduce canvas width and height, 3. Consider cropping eyes separately (reducing canvas size)

            // counter = 0
            // rgba_array = []
            // // array [[R,G,B,A], [R,G,B,A]]
            // readable_matrix = []
            // for (component_key in matrix){
            //     if (counter == 4){
            //         readable_matrix.push(rgba_array)
            //         rgba_array = []
            //         counter = 0
            //     }
            //     rgba_array.push(matrix[component_key])
            //     counter++
            // }
                
            // console.log(readable_matrix)

        }

    }, 30)
})

/**
 * Calculates the distance between 2 points on the cartesian plane
 * 
 * @param {object}  p1 First point
 * @param {object}  p2 Second point
 *
 * @return {number} Returns distance in pixels
 */
const distance = (p1, p2) => {
    return Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2));
}


/**
 * Taking the leftEye and rightEye coordinates from the faceAPI detection and finds min and max X and Y coordinates and distance between them. 
 * 
 * @param {Object}  leftEye leftEye variable is a dictionary of x and y coordinates
 * @param {Object}  rightEye rightEye variable is a dictionary of x and y coordinates
 *
 * @return {number} Returns an array of [startX, startY, disX, disY]
 */
const caluclateStartAndDistance = (leftEye, rightEye) => {

    // Calculations for leftEye
    // Since leftEye is a dictionary, so first convert it to the array 
    let leftEyeXcoord = []
    let leftEyeYcoord = []
    for(let key in leftEye) {
        leftEyeXcoord.push(leftEye[key].x);
        leftEyeYcoord.push(leftEye[key].y);
    }
    let minX = Math.min(...leftEyeXcoord) - 5
    let minY1 = Math.min(...leftEyeYcoord)
    let maxY1 = Math.max(...leftEyeYcoord)

    // Calculations for rightEye
    let rightEyeXcoord = []
    let rightEyeYcoord = []
    for(let key in rightEye) {
        rightEyeXcoord.push(rightEye[key].x);
        rightEyeYcoord.push(rightEye[key].y);
    }
    let maxX = Math.max(...rightEyeXcoord) + 5
    let minY2 = Math.min(...rightEyeYcoord)
    let maxY2 = Math.max(...rightEyeYcoord)

    // If you rotate your head, Y position of the left and the right eye will change, sometimes left eye will have min coordinate and sometimes right eye will have min, same for max coordiante
    // Determine whether minY, maxY is on the right eye or on the left eye 
    let minY = Math.min(minY1, minY2) - 5
    let maxY = Math.max(maxY1, maxY2) + 5

    return [minX, minY, maxX - minX, maxY - minY]
}