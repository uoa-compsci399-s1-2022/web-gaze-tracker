import { clearCanvas, croppedCanvas2, croppedCanvasLeft, croppedCanvasRight, video } from './elements.js'
import { applyMinimumFilter, drawPupilRegion, evaluateIntensity, getPMIIndex, getPupils } from './pupilDetection.js'

// ---------- GLOBAL VARIABLES --------------------------------
let calibrationPoints = {}     // The object that stores click counts with point id as the key.
let totalPointsCalibrated = 0  // The number of total points calibrated.
let userGazePoints = {}        // Use this for mapping the coordinatess.


/** - This function draws all 9 calibration points on the screen into the DOM
 * @return {None}
 * */
const startCalibration = () => {
    // Setup modal html elements
    let modalWindow = document.createElement('div')
    modalWindow.id = "myModal"
    modalWindow.className = "modal"
    modalWindow.style.display = "block"

    let modalContent = document.createElement('div')
    modalContent.className = "modal_content"

    let modalMessage = document.createElement('div')
    modalMessage.className = "modal_message"
    modalMessage.innerHTML = "<h1>Welcome to our Peeper.js gaze tracker</h1><br>Click each of the 9 pink points 5 times while staring at it!"

    let modalStart = document.createElement('button')
    modalStart.innerHTML = "Calibrate"

    // append modal html elements 
    modalContent.appendChild(modalMessage)
    modalContent.appendChild(modalStart)
    modalWindow.appendChild(modalContent)
    document.body.appendChild(modalWindow)

    // script for modal window actions
    let modal = document.getElementById("myModal")

    modalStart.id = 'startButton'
    modalStart.onclick = () => {
        drawCalibrationPoints()
        modal.style.display = "none"
    }
}

const drawCalibrationPoints = () => {
    // create a new div container to draw our calibration points
    const calibrationDiv = document.createElement("div")
    calibrationDiv.id = "calibration"
    calibrationDiv.style = "position: absolute; top: 70%;"
    calibrationDiv.innerHTML = "<span id='pupil_detection_prompt' style='display: none;'>Eyes not detected, please stare at point while clicking</span>"

    //draw each point on to the screen made with input buttons
    for (let i = 1; i < 10; i++) {
            const point = document.createElement("input")
            point.type = "button"
            point.className = "Calibration"
            point.id = `Pt${i}`
            calibrationDiv.appendChild(point)
            point.addEventListener("click", calibrateAllPoints)
    }

    document.body.appendChild(calibrationDiv)

}

/** - Calibrate all points and store pupil coordinates
 * @param {interface} event The Event interface represents an event which takes place in the DOM.
 * @return {None}
 * */
const calibrateAllPoints = (event) => {

    let keys = Object.keys(calibrationPoints)
    let getPointID = event.currentTarget.getAttribute('id')
    let pupilX, pupilY
    let pupilDetectionPrompt = document.getElementById('pupil_detection_prompt')

    
    // Get the pupil coordinates
    const pmiIndex = getPMIIndex(croppedCanvasLeft)
    if (pmiIndex !== -1) {
        [pupilX, pupilY] = getPupils(croppedCanvasLeft, pmiIndex)
    }

    // ------------------------------------------------------
    // Check if pupil coordinates is valid to store (not NaN)
    if (!isNaN(pupilX) && !isNaN(pupilY)) {
        pupilDetectionPrompt.style.display = 'none'
        // Updating the click count of the calibration points
        if (!keys.includes(getPointID)) {
            calibrationPoints[getPointID] = 1
        } else {
            calibrationPoints[getPointID]++
        }

        // Store the valid pupil coordinates on a counted click
        if (calibrationPoints[getPointID] <= 5) {
            storePupilCoordinates(getPointID, pupilX, pupilY)

            if (calibrationPoints[getPointID] == 5) {
                document.getElementById(getPointID).style.backgroundColor = "yellow"
                document.getElementById(getPointID).disabled = true
                totalPointsCalibrated += 1
            } else {
                document.getElementById(getPointID).style.opacity = 0.2*calibrationPoints[getPointID]+0.2
            }
    
        }
        
    } else {
        // Show message on screen for user to stare at point so we can store it.
        pupilDetectionPrompt.style.color = 'red'
        pupilDetectionPrompt.style.fontSize = '24px'
        pupilDetectionPrompt.style.display = 'block'
    }


    /** FEATURE: Calculating Accuracy (Analyze prediction points)
     * @todo - Blocked: needs mapping part to work 
     * 1. Set up function to start storing 50 points in [script.js] and return it in calibration file
     * 2. Stop storing points after 5 seconds (5000ms)
     * 2.1 Take points and calculate
     **/
    if ( totalPointsCalibrated == 9) {
        alert("All points are calibrated!")

        // Used for testing:
        let userGazeKeys = Object.keys(userGazePoints)
    
        for (let i = 0; userGazeKeys.length > i; i++) {
            for (let j = 0; userGazePoints[userGazeKeys[i]].length > j; j++) {
                console.log(`UserGazePoints object - for each ${userGazeKeys[i]} these are the stored points: ( ${userGazePoints[userGazeKeys[i]][j]} )`)
            }
        }
    }
    
}

/** Storing pupil coordinates for calculating precision and analysis.
 * @param {attribute} pointID id of each of the 9 calibration points
 * @param {number} pupilX the X coordinate from the newPmiX variable define in script.js
 * @param {number} pupilY the Y coordinate from the newPmiY variable defined in script.js
 **/
const storePupilCoordinates = (pointID, pupilX, pupilY) => {
    let x = Math.round(pupilX)
    let y = Math.round(pupilY)

    let keys = Object.keys(userGazePoints)
    let userPoints = [x,y]

    // Storing all points in userGazePoints object
    if (!keys.includes(pointID)) {
        userGazePoints[pointID] = [userPoints]
    } else {
        userGazePoints[pointID].push(userPoints)
    }
} 

export { drawCalibrationPoints, calibrateAllPoints, startCalibration, storePupilCoordinates, calibrationPoints, userGazePoints, totalPointsCalibrated }