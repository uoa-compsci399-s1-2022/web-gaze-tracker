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
  // minimim filter applied TODO:(SEARCH FOR DIFFERENT FILTERS TO APPLY)
  const src = cv.imread(canvas.id)
  let dst = new cv.Mat()
  let M = cv.Mat.ones(5, 5, cv.CV_8U)
  let anchor = new cv.Point(-1, -1)
  // You can try change to other parameters
  cv.erode(src, dst, M, anchor, 2, cv.BORDER_ISOLATED, cv.morphologyDefaultBorderValue())
  cv.imshow(canvas.id, dst)
  src.delete()
  dst.delete()
  M.delete()
}

/** Calculates pixel position of the pupil based on PMI
*
* @param {HTMLElement} canvas canvas to get PMI from
*
* @return {number} x and y position of pupils
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

export { evaluateIntensity, applyMinimumFilter, getPMIIndex, getPupils, drawPupilRegion }