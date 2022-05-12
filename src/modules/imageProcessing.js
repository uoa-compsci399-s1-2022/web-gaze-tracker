/** Applies image processing needed before pupil detection
*
*/
const applyImageProcessing = () => {
  // OpenCV adaptive threshold filter applied to the video 
  const imgSrc = cv.imread('canvasOutputLeft')
  let dst = new cv.Mat()
  cv.cvtColor(imgSrc, dst, cv.COLOR_RGBA2GRAY, 0)
  cv.imshow('canvasOutputLeft', dst)

  // debugging canvas
  cv.imshow('canvasOutput2Left', dst)

  imgSrc.delete()
  dst.delete()
}

export { applyImageProcessing }