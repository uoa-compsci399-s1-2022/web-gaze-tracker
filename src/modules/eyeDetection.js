/**
 * Draws a cropped canvas for each eye
 * 
 * @param {any} detections detections object from faceapi
 * @param {HTMLElement} leftCanvas canvas for left eye
 * 
 */
const drawCroppedCanvas = (detections, leftCanvas) => {
  // get left and right eye
  const leftEye = detections[0].landmarks.getLeftEye()
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
 * Finds the starting and ending x,y coordinates from the left eye to the right eye.
 * 
 * @param {Object}  eye eye variable is a dictionary of x and y coordinates
 * @param {number}  padding padding added to image
 * 
 * @return {number} Returns an array of [startX, startY, disX, disY]
 */
const calculateStartAndDistance = (eye, padding) => {

  // Place x and y coords into seperate arrays
  const EyeXcoord = eye.map(i => i.x)
  const EyeYcoord = eye.map(i => i.y)

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

export { drawCroppedCanvas }