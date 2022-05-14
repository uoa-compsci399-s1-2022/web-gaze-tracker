import { clearCanvas, croppedCanvas2, croppedCanvasLeft, croppedCanvasRight, video } from './elements.js'
import { applyMinimumFilter, drawPupilRegion, evaluateIntensity, getPMIIndex, getPupils } from './pupilDetection.js'

// ---------- GLOBAL VARIABLES --------------------------------
let calibrationPoints = {};     // The object that stores click counts with point id as the key.
let totalPointsCalibrated = 0;  // The number of total points calibrated.
let userGazePoints = {};        // Use this for mapping the coordinatess


/** - This function draws all 9 calibration points on the screen into the DOM
 * @todo - Prepare for @NatRivers changes to dynamic point sprites
 * @return {None}
 * */
const drawCalibrationPoints = () => {
  // create a new div container to draw our calibration points
  const calibrationDiv = document.createElement("div");
  calibrationDiv.id = "calibration";
  calibrationDiv.style = "position: absolute; top: 55%;";
  calibrationDiv.innerHTML = "<p>Click each of the calibration points 5 times</p>";

  //draw each point on to the screen made with input buttons
  for (let i = 1; i < 10; i++) {
        const point = document.createElement("input");
        point.type = "button";
        point.className = "Calibration";
        point.id = `Pt${i}`
        calibrationDiv.appendChild(point);
        point.addEventListener("click", calibrateAllPoints);
  }

  document.body.appendChild(calibrationDiv);

}

/** - Check all points are clicked, gather data to compute, complete calibration
 * @todo - Compute all calibration points
 * @todo - Implement accuracy computation tbc by @kr0720
 * @param {interface} event The Event interface represents an event which takes place in the DOM.
 * @return {None}
 * */
const calibrateAllPoints = (event) => {

    let keys = Object.keys(calibrationPoints);
    let getPointID = event.currentTarget.getAttribute('id');

    // Updating the click count of the calibration points
    if (!keys.includes(getPointID)) {
        calibrationPoints[getPointID] = 1;
    } else {
        calibrationPoints[getPointID]++;
    }

    // -----------------------------------------------------------------
    // - Checks if each point is clicked
    // - for each point, we check if user has clicked it 5 times
    // - if so, then disable point and display yellow point to complete

    if (calibrationPoints[getPointID] <= 5) {
        // use newPmix newPmiY defined in global variable to map point to gaze
        const pmiIndex = getPMIIndex(croppedCanvasLeft)
        if (pmiIndex !== -1) {
            const [pupilX, pupilY] = getPupils(croppedCanvasLeft, pmiIndex)
            calculatePupilDataToScreen(getPointID, pupilX, pupilY);
        }

        if (calibrationPoints[getPointID] == 5) {
            document.getElementById(getPointID).style.backgroundColor = "yellow";
            document.getElementById(getPointID).disabled = true;
            totalPointsCalibrated += 1;
        } else {
            document.getElementById(getPointID).style.opacity = 0.2*calibrationPoints[getPointID]+0.2;
        }

    };


    // ---------------------------------------------------------------------
    // We use the points stored in here to analyze and compute the precision 
    // Total number of points calibrated should equal to 9


    // Test if all points are stored in object for Amri to use.
    if ( totalPointsCalibrated == 9) {
        let keys = Object.keys(userGazePoints);
        
        console.log(`All points have been clicked!`);

        for (let i = 0; keys.length > i; i++) {
            for (let j = 0; userGazePoints[keys[i]].length > j; j++) {
                console.log(`UserGazePoints object - for each ${keys[i]} these are the stored points: ( ${userGazePoints[keys[i]][j]} )`);
            }
        }
        /** @todo - Blocked: needs mapping part to work */
        // --------- FEATURE: Calculating Accuracy (Analyze prediction points) --------------------------
        // 1. Set up function to start storing 50 points in [script.js] and return it in calibration file
        // 2. Stop storing points after 5 seconds (5000ms)
        // 2.1 Take points and calculate
    }
    
} // calibrateAllPoints

/** - HELPER function: Called when user clicks each of the 9 calibration points 
 * @todo Complete all accuracy calculations and predictions
 * @param {number}  x the X coordinate from the newPmiX variable define in script.js
 * @param {number}  y the Y coordinate from the newPmiY variable defined in script.js
 * */
const calculatePupilDataToScreen = (pointID, x, y) => {
    // Do main calculation with 5 x,y points of screen.
    // Round newPmiY/X variables to an integer for developing purposes.
    x = Math.round(x);
    y = Math.round(y);

    let keys = Object.keys(userGazePoints);
    let userPoints = [x,y];

    if (!keys.includes(pointID)) {
        userGazePoints[pointID] = [userPoints];
    } else {
        userGazePoints[pointID].push(userPoints);
    }

    console.log(`calculatePupilDataToScreen executed, this is point${pointID}, click count = ${calibrationPoints[pointID]}`);

} 

export { drawCalibrationPoints, calibrateAllPoints, calculatePupilDataToScreen, calibrationPoints, userGazePoints, totalPointsCalibrated };