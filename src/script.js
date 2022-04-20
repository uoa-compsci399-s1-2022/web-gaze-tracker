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
    const filteredCanvas = faceapi.createCanvasFromMedia(video)
    filteredCanvas.id = "canvasOutput"
    filteredCanvas.style.position = "absolute"
    filteredCanvas.style.top = 0 + "px"
    filteredCanvas.style.left = 751 + "px"
    document.body.append(filteredCanvas)

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
        const imgSrc = cv.imread('videoCanvas');
        let dst = new cv.Mat();
        cv.cvtColor(imgSrc, imgSrc, cv.COLOR_RGBA2GRAY, 0);
        
        cv.adaptiveThreshold(imgSrc, dst, 200, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 35, 2);
        cv.imshow('canvasOutput', dst);
        
        // canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
        imgSrc.delete();
        dst.delete();

        // extracting eye data
        if (detections.length === 1) {
            // could be useful later for drawing eyes on new canvas
            // const leftEye = detections[0].landmarks.getLeftEye()
            // const rightEye = detections[0].landmarks.getRightEye()

            const leftEyeResized = resizedDetections[0].landmarks.getLeftEye()
            const rightEyeResized = resizedDetections[0].landmarks.getRightEye()

            console.log(leftEyeResized, rightEyeResized)
            
            // leftEyeResized[0],change [X] the value later as it is not representetive, use max, min function instead to find the min and max coordinate in the array
            // also want to try drawing this matrix on canvas to see what we get
            for (let x = parseInt(leftEyeResized[0].x); x < parseInt(leftEyeResized[3].x); x ++){
                for (let y = parseInt(leftEyeResized[1].y); y < parseInt(leftEyeResized[5].y); y ++){
                    let src = cv.imread("canvasOutput");
                    let pixel = src.ucharPtr(x, y);
                    let R = pixel[0];
                    let G = pixel[1];
                    let B = pixel[2];
                    let A = pixel[3];
                    console.log(R,G,B,A,x,y)
                }
            }

        }


    }, 30)
})