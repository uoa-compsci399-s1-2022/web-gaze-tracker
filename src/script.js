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

        // OpenCV adaptive threshold filter applied to the video 
        // const imgSrc = cv.imread('videoCanvas');
        // let dst = new cv.Mat();
        // cv.cvtColor(imgSrc, imgSrc, cv.COLOR_RGBA2GRAY, 0);

        // cv.adaptiveThreshold(imgSrc, dst, 200, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 35, 2);
        // cv.imshow('canvasOutput', dst);

        // // canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
        // imgSrc.delete();
        // dst.delete();

        // extracting eye data
        if (detections.length === 1) {
            // only need right eye as camera is flipped
            const rightEye = detections[0].landmarks.getRightEye()
            // get resized points
            const leftEyeResized = resizedDetections[0].landmarks.getLeftEye()
            const rightEyeResized = resizedDetections[0].landmarks.getRightEye()

            // starting position 
            // TODO: adjust starting postion and distance to fit both eyes properly in canvas
            const startX = rightEye[0].x - 50
            const startY = rightEye[0].y - 15

            // get distance between both eyes
            // multiply to get area around eyes as buffer
            const disX = distance(rightEyeResized[0], leftEyeResized[3]) * 2.5
            const disY = distance(rightEyeResized[1], leftEyeResized[4])

            // draw cropped video onto canvas
            croppedCanvas.getContext('2d').drawImage(
                video,
                startX, startY,                                 // start position
                disX, disY,                                     // area to crop
                0, 0,                                           // draw from point (0, 0) in the canvas,
                croppedCanvas.width, croppedCanvas.height
            )

            // leftEyeResized[0],change [X] the value later as it is not representetive, use max, min function instead to find the min and max coordinate in the array
            // also want to try drawing this matrix on canvas to see what we get
            // for (let x = parseInt(leftEyeResized[0].x); x < parseInt(leftEyeResized[3].x); x ++){
            //     for (let y = parseInt(leftEyeResized[1].y); y < parseInt(leftEyeResized[5].y); y ++){
            //         let src = cv.imread("canvasOutput");
            //         let pixel = src.ucharPtr(x, y);
            //         let R = pixel[0];
            //         let G = pixel[1];
            //         let B = pixel[2];
            //         let A = pixel[3];
            //         console.log(R,G,B,A,x,y)
            //     }
            // }

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
function distance(p1, p2) {
    return Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2));
}