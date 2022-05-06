function drawCalibrationPoints () {
  // create a new div container to draw our calibration points
  const calibrationDiv = document.createElement("div");
  calibrationDiv.id = "calibration";
  calibrationDiv.innerHTML = "Click each of the calibration points 5 times";

  //draw each point on to the screen made with input buttons
  for (i = 1; i < 10; i++) {
        let point = document.createElement("input");
        point.type = "button";
        point.className = "Calibration";
        point.id = `Pt${i}`;
        calibrationDiv.appendChild(point);
  }

  document.body.appendChild(calibrationDiv);

}

// call the drawCalibrationPoints function when window loads
window.onload =  drawCalibrationPoints;