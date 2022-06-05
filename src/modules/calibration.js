import { croppedCanvasLeft } from './elements.js'
import { getPMIIndex, getPupils } from './pupilDetection.js'

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

export { startCalibration, userGazePoints }