function drawCalibrationPoints () {
  // create a new div container to draw our calibration points
  const calibrationDiv = document.createElement("div");
  calibrationDiv.id = "calibration";
  calibrationDiv.innerHTML = "Click each of the calibration points 5 times";

  //draw each point on to the screen made with input buttons
  for (i = 1; i < 10; i++) {
        const point = document.createElement("input");
        point.type = "button";
        point.className = "Calibration";
        point.id = `Pt${i}`;
        calibrationDiv.appendChild(point);~~~
        point.addEventListener("click", calibrateAllPoints);
  }

  document.body.appendChild(calibrationDiv);

} // -- drawCalibrationPoints()

//  The object that stores click counts with point id as the key.
let calibrationPoints = {};
//  The number of total points calibrated.
let totalPointsCalibrated = 0;

//  The main function where we check if all points are clicked
// - We set the opacity and color to yellow once each point is calibrated
function calibrateAllPoints() {

    let keys = Object.keys(calibrationPoints);
    let getPointID = this.getAttribute('id');

    //  Checking the existence of current point id.
    //  If it doesn't exist in the calibrationPoints object, initialize it to 1.
    //  Else increase the value stored in current point id by 1.
    if (!keys.includes(getPointID)) {
        calibrationPoints[getPointID] = 1;
    } else {
        calibrationPoints[getPointID]++;
    }

    // ----------------------------------------------------------------
    // - Checks if each point is clicked
    // - for each point, we check if user has clicked it 5 times
    // - if so, then disable point and display yellow point to complete

    if (calibrationPoints[getPointID] == 5) {
        document.getElementById(getPointID).style.backgroundColor = "yellow";
        document.getElementById(getPointID).disabled = true;
        totalPointsCalibrated += 1;

    } else if (calibrationPoints[getPointID] < 5) {
        document.getElementById(getPointID).style.opacity = 0.2*calibrationPoints[getPointID]+0.2;
    };

    // This logs out the specific point id and the number of clicks per point
    console.log(`This is point ${getPointID}, number of click: ${calibrationPoints[getPointID]}`);

    // ---------------------------------------------------------------------
    // We use the points stored in here to analyze and compute the precision 
    // Total number of points calibrated should equal to 9
    if ( totalPointsCalibrated == 9) {
        console.log("All points have been clicked.");
        // NEXT STEP TO COMPLETE
    }
    
}

// call the drawCalibrationPoints function when window loads
window.onload =  drawCalibrationPoints;