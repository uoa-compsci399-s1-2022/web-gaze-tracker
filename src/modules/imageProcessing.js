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

export { applyImageProcessing }