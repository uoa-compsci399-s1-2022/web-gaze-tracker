// ELEMENTS

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

// EYE DETECTION

/**
 * Draws a cropped canvas for each eye
 * 
 * @param {any} detections detections object from faceapi
 * @param {HTMLElement} leftCanvas canvas for left eye
 * 
 */
const drawCroppedCanvas = (detections, leftCanvas) => {
  // get left eye
  const leftEye = detections[0].landmarks.getLeftEye()
  // const right eye = detections[1].landmarks.getLeftEye()
  const padding = 5

  const [leftStartX, leftStartY, leftDisX, leftDisY] = calculateStartAndDistance(leftEye, padding)

  // draw cropped video onto left canvas
  leftCanvas.getContext('2d').drawImage(
    video,
    leftStartX, leftStartY,                                 // start position
    leftDisX, leftDisY,                                     // area to crop
    0, 0,                                                   // draw from point (0, 0) in the canvas,
    leftCanvas.width, leftCanvas.height
  )
}

/**
 * Finds the starting and ending x, y coordinates of a bounding box around the eyes.
 * 
 * @param {Object}  eye eye variable is a dictionary of x and y coordinates
 * @param {number}  padding padding added to image
 * 
 * @return {number} Returns startX, startY, disX, disY
 */
const calculateStartAndDistance = (eye, padding) => {

  // Place x and y coords into seperate arrays
  const EyeXcoord = eye.map(i => i.x)
  const EyeYcoord = eye.map(i => i.y)

  const minX = Math.min(...EyeXcoord) - padding
  const minY1 = Math.min(...EyeYcoord)
  const maxY1 = Math.max(...EyeYcoord)

  const maxX = Math.max(...EyeXcoord) + padding
  const minY2 = Math.min(...EyeYcoord)
  const maxY2 = Math.max(...EyeYcoord)

  const minY = Math.min(minY1, minY2) - padding
  const maxY = Math.max(maxY1, maxY2) + padding

  return [minX, minY, maxX - minX, maxY - minY]
}

// IMAGE PROCESSING

/** Applies image processing needed before pupil detection
*
* @param {HTMLElement} canvas canvas to apply image processing to
* @param {HTMLElement} debugCanvas debugging canvas
*/
const applyImageProcessing = (canvas, debugCanvas) => {
  // convert image to grayscale and apply to 2 canvases
  const imgSrc = cv.imread(canvas.id)
  let dst = new cv.Mat()
  cv.cvtColor(imgSrc, dst, cv.COLOR_RGBA2GRAY, 0)
  cv.imshow(canvas.id, dst)

  // debugging canvas
  cv.imshow(debugCanvas.id, dst)

  imgSrc.delete()
  dst.delete()
}

// PUPIL DETECTION

let originalGrayScaleData, pmiX, pmiY

/** Changes the intensity of each pixel in the canvas based on CDF algorithm in https://arxiv.org/pdf/1202.6517.pdf
 * 
 * @param {HTMLElement} canvas canvas with cropped eye
 * @param {number} intensityThreshold threshold to measure intensity of each pixel against
 */
const evaluateIntensity = (canvas, intensityThreshold) => {
  // Make a copy of original grayscale data
  const ctx = canvas.getContext('2d')
  let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  originalGrayScaleData = Object.assign([], imgData.data)

  // Applying CDF filter
  for (let i = 3; i < imgData.data.length; i += 4) {
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
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  canvas.width = imgData.width
  canvas.height = imgData.height
  ctx.putImageData(imgData, 0, 0)
}

/** Applies minimum filter to a specified canvas
 * 
 * @param {HTMLElement} canvas canvas to apply filter to
 */
const applyMinimumFilter = (canvas) => {
  const src = cv.imread(canvas.id)
  let dst = new cv.Mat()
  let M = cv.Mat.ones(5, 5, cv.CV_8U)
  let anchor = new cv.Point(-1, -1)

  cv.erode(src, dst, M, anchor, 2, cv.BORDER_ISOLATED, cv.morphologyDefaultBorderValue())
  cv.imshow(canvas.id, dst)
  src.delete()
  dst.delete()
  M.delete()
}

/** Calculates the PMI (pixel with minimum intensity) of given canvas
*
* @param {HTMLElement} canvas canvas to get PMI from
*
* @return {number} index of the PMI from originalGrayScaleData
*/
const getPMIIndex = (canvas) => {
  // Getting image data after application of minimum filter
  const ctx = canvas.getContext('2d')
  let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)

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
  return pmiIndex
}

/** Calculates pixel position of the pupil based on PMI
* 
* @param {HTMLElement} canvas canvas to get pupils from
* @param {number}  pmiIndex pixel with minimum intensity's index
*
* @return {number} x and y position of pupils
*/
const getPupils = (canvas, pmiIndex) => {
  // calculate position of PMI
  pmiX = pmiIndex % (canvas.width)  //column
  pmiY = Math.floor(pmiIndex / (canvas.width)) //row

  // convert grayscale to 2D array
  let grayScaleMatrix = []
  let row = []
  let counter = 0
  for (let i = 3; i < originalGrayScaleData.length; i += 4) {
    counter++
    row.push(originalGrayScaleData[i - 1])
    if (counter == canvas.width) {
      grayScaleMatrix.push(row)
      row = []
      counter = 0
    }
  }

  // look for 70x70 area around pmi 
  let averageIntensity70x70 = getAverageIntensity(grayScaleMatrix, pmiX, pmiY, 35, canvas)

  // look into grayScale 100x100 area around pmi and check against AI in 70x70
  const arrayOfPoints = []
  for (let row = Math.max(pmiY - 50, 0); row < Math.min(pmiY + 50, canvas.height); row++) {
    for (let pixel = Math.max(pmiX - 50, 0); pixel < Math.min(pmiX + 50, canvas.width); pixel++) {
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

  return [newPmiX, newPmiY]
}

/** Draws graphic on and around pupil
* 
* @param {HTMLElement} canvas canvas to draw on
* @param {number}  pupilX x position of pupil
* @param {number}  pupilY y position of pupil
*
*/
const drawPupilRegion = (canvas, pupilX, pupilY) => {
  // drawing squares around pmi
  let ctx = canvas.getContext("2d")
  ctx.lineWidth = 2

  // pmi after the averageIntesity calculations
  ctx.beginPath()
  ctx.strokeStyle = 'red'
  ctx.arc(pupilX, pupilY, 2, 0, 2 * Math.PI)
  ctx.stroke()
}

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

// CALIBRATION

const calibrationPoints = {}     // The object that stores click counts with point id as the key.
let totalPointsCalibrated = 0  // The number of total points calibrated. Change to boolean

const userGazePoints = {
  calibrationComplete: false
}

/** - Creates a modal popup that asks the user to start calibration 
 * @return {None} 
* */
const startCalibration = () => {
  // Setup modal html elements
  const modalWindow = document.createElement('div')
  modalWindow.id = "myModal"
  modalWindow.className = "modal"
  modalWindow.style.display = "block"

  const modalContent = document.createElement('div')
  modalContent.className = "modal_content"

  const modalMessage = document.createElement('div')
  modalMessage.className = "modal_message"
  modalMessage.innerHTML = "<h1>Welcome to our Peeper.js gaze tracker</h1><br>Click each of the 9 pink points 5 times while staring at it!"

  const modalStart = document.createElement('button')
  modalStart.innerHTML = "Calibrate"

  // append modal html elements 
  modalContent.appendChild(modalMessage)
  modalContent.appendChild(modalStart)
  modalWindow.appendChild(modalContent)
  document.body.appendChild(modalWindow)

  const modal = document.getElementById("myModal")

  modalStart.id = 'startButton'
  modalStart.onclick = () => {
    drawCalibrationPoints() // Drawing points on screen
    modal.style.display = "none"
  }
}

/** Draws 9 calibration points on the screen
 * @return {None}
 **/
const drawCalibrationPoints = () => {
  // create a new div container to draw our calibration points
  const calibrationDiv = document.createElement("div")
  calibrationDiv.id = "calibration"
  calibrationDiv.style = "position: absolute; top: 70%;"
  calibrationDiv.innerHTML = "<span id='pupil_detection_prompt' style='display: none;'>Eyes not detected, please stare at point while clicking</span>"

  // draw each point on to the screen made with input buttons
  for (let i = 1; i < 10; i++) {
    const point = document.createElement("input")
    point.type = "button"
    point.className = "Calibration"
    point.id = `Pt${i}`
    calibrationDiv.appendChild(point)

    userGazePoints[point.id] = {
      pupilPos: [],
      calibrationPointsPos: [],
    }
    point.addEventListener("click", calibrateAllPoints)
  }
  document.body.appendChild(calibrationDiv)
}

/** - Calibrate all points and store pupil coordinates
 * @param {Event} event The Event interface represents an event which takes place in the DOM.
 * */
const calibrateAllPoints = (event) => {
  const keys = Object.keys(calibrationPoints)
  const pointID = event.currentTarget.getAttribute('id')
  let pupilX, pupilY
  const pupilDetectionPrompt = document.getElementById('pupil_detection_prompt')

  // Get pupil coordinates
  const pmiIndex = getPMIIndex(croppedCanvasLeft)
  if (pmiIndex !== -1) {
    [pupilX, pupilY] = getPupils(croppedCanvasLeft, pmiIndex)
  }

  // Check if pupil coordinates is valid to store (not NaN)
  if (!isNaN(pupilX) && !isNaN(pupilY)) {
    pupilDetectionPrompt.style.display = 'none'
    // Updating click count of the calibration points
    if (!keys.includes(pointID)) {
      calibrationPoints[pointID] = 1
    } else {
      calibrationPoints[pointID]++
    }

    // Store valid pupil coordinates on a counted click
    if (calibrationPoints[pointID] <= 5) {
      // Store cursor coordinates as the calibration point position
      userGazePoints[pointID]["calibrationPointsPos"].push([event.clientX, event.clientY])

      // Store pupil coordinates
      storePupilCoordinates(pointID, pupilX, pupilY)

      if (calibrationPoints[pointID] == 5) {
        document.getElementById(pointID).style.backgroundColor = "yellow"
        document.getElementById(pointID).disabled = true
        totalPointsCalibrated += 1
      } else {
        document.getElementById(pointID).style.opacity = 0.2 * calibrationPoints[pointID] + 0.2
      }
    }

  } else {
    // Show message on screen for user to stare at point
    pupilDetectionPrompt.style.color = 'red'
    pupilDetectionPrompt.style.fontSize = '24px'
    pupilDetectionPrompt.style.display = 'block'
  }

  if (totalPointsCalibrated == 9) {
    userGazePoints.calibrationComplete = true
    // hide calibration points
    const points = document.getElementsByClassName("Calibration")
    for (let i = 0; i < points.length; i++) {
      points[i].style.visibility = 'hidden'
    }

    alert("Calibration complete")
  }

  /** FEATURE: Calculating Accuracy (Analyze prediction points)
   * @todo
   * 1. Store 50 points in [main.js] and return it in calibration file
   * 2. Stop storing points after 5 seconds (5000ms)
   * 2.1 Take points and calculate
   **/
}

/** Storing pupil coordinates for calculating precision and analysis.
 * @param {string} pointID id of each of the 9 calibration points
 * @param {number} pupilX the X coordinate from the newPmiX variable define in script.js
 * @param {number} pupilY the Y coordinate from the newPmiY variable defined in script.js
 **/
const storePupilCoordinates = (pointID, pupilX, pupilY) => {
  const x = Math.round(pupilX)
  const y = Math.round(pupilY)

  const userPoints = [x, y]

  // Storing all points in userGazePoints object
  if (userGazePoints[pointID]["pupilPos"].length == 0) {
    userGazePoints[pointID]["pupilPos"] = [userPoints]
  } else {
    userGazePoints[pointID]["pupilPos"].push(userPoints)
  }
}

// MAPPING

/** Draws user's gaze as a circle on the browser
 * 
 * @param {HTMLElement} canvas canvas to draw on
 * @param {number}  pupilX x position of pupil
 * @param {number}  pupilY y position of pupil
 * 
 * @return {number} cursor postion
 */
const getPositions = (pupilX, pupilY) => {

  // Calculating average points for the pupil and calibration points position after calibration 
  const allGazePoints = getAveragePoints("pupilPos")
  const allScreenPoints = getAveragePoints("calibrationPointsPos")

  // Calculating xCoordinate of where you look 
  const xGazeStart = (allGazePoints[0][0] + allGazePoints[3][0] + allGazePoints[6][0]) / 3
  const xGazeEnd = (allGazePoints[2][0] + allGazePoints[5][0] + allGazePoints[8][0]) / 3
  const gazeWidth = xGazeEnd - xGazeStart

  const xScreenStart = (allScreenPoints[0][0] + allScreenPoints[3][0] + allScreenPoints[6][0]) / 3
  const xScreenEnd = (allScreenPoints[2][0] + allScreenPoints[5][0] + allScreenPoints[8][0]) / 3
  const screenWidth = xScreenEnd - xScreenStart

  const cursorX = (pupilX - xGazeStart) * screenWidth / gazeWidth

  // Calculating yCoordinate of where you look 
  const yGazeStart = (allGazePoints[0][1] + allGazePoints[1][1] + allGazePoints[2][1]) / 3
  const yGazeEnd = (allGazePoints[6][1] + allGazePoints[7][1] + allGazePoints[8][1]) / 3
  const gazeHeight = yGazeEnd - yGazeStart

  const yScreenStart = (allScreenPoints[0][1] + allScreenPoints[1][1] + allScreenPoints[2][1]) / 3
  const yScreenEnd = (allScreenPoints[6][1] + allScreenPoints[7][1] + allScreenPoints[8][1]) / 3
  const screenHeight = yScreenEnd - yScreenStart

  const cursorY = (pupilY - yGazeStart) * screenHeight / gazeHeight

  return [cursorX, cursorY, screenWidth, screenHeight, yScreenStart, xScreenStart]
}

/** Draws user's gaze as a circle on the browser
* 
* @param {HTMLElement} canvas 
* @param {number} pupilX 
* @param {number} pupilY 
* @param {number} screenWidth 
* @param {number} screenHeight 
* @param {number} yScreenStart 
* @param {number} xScreenStart 
*/
const drawMapping = (canvas, pupilX, pupilY, screenWidth, screenHeight, yScreenStart, xScreenStart) => {
  // style canvas
  canvas.width = screenWidth
  canvas.height = screenHeight
  canvas.style.top = yScreenStart + "px"
  canvas.style.left = xScreenStart + "px"

  let ctx = canvas.getContext('2d')
  ctx.beginPath()
  ctx.fillStyle = 'red'
  ctx.arc(pupilX, pupilY, 20, 0, 2 * Math.PI)
  ctx.fill()
  ctx.closePath()
}

/** Extracts average points from userGazePoints
* @param {string} key either screen or gaze coordinates
* @return {number[][]} list of averaged coordinates 
*/
const getAveragePoints = (key) => {
  const result = []
  for (let i = 1; i < Object.keys(userGazePoints).length; i++) {
    let gazeCoordinates = userGazePoints["Pt" + i.toString()][key.toString()]
    let xTotal = 0
    let yTotal = 0
    let counter = 0
    for (let i = 0; i < gazeCoordinates.length; i++) {
      counter++
      xTotal += gazeCoordinates[i][0]
      yTotal += gazeCoordinates[i][1]
    }
    let xAvg = xTotal / counter
    let yAvg = yTotal / counter
    result.push([xAvg, yAvg])
  }
  return result
}