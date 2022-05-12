import { croppedCanvasLeft, croppedCanvas2 } from "./elements.js"

const ctx = croppedCanvasLeft.getContext('2d')
let originalGrayScaleData, pmiX, pmiY

const evaluateIntensity = (intensityThreshold) => {
  // Make a copy of original grayscale data
  let imgData = ctx.getImageData(0, 0, croppedCanvasLeft.width, croppedCanvasLeft.height)
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
  ctx.clearRect(0, 0, croppedCanvasLeft.width, croppedCanvasLeft.height)
  croppedCanvasLeft.width = imgData.width
  croppedCanvasLeft.height = imgData.height
  ctx.putImageData(imgData, 0, 0)

}

const applyMinimumFilter = () => {
  // minimim filter applied (SEARCH FOR MORE FILTERS TO APPLY)
  const src = cv.imread('canvasOutputLeft')
  let dst = new cv.Mat()
  let M = cv.Mat.ones(5, 5, cv.CV_8U)
  let anchor = new cv.Point(-1, -1)
  // You can try more different parameters
  cv.erode(src, dst, M, anchor, 2, cv.BORDER_ISOLATED, cv.morphologyDefaultBorderValue())
  cv.imshow('canvasOutputLeft', dst)
  src.delete()
  dst.delete()
  M.delete()
}

/** Calculates pixel position of the pupil based on PMI
*
* @return {number} x and y position of pupils
*/
const getPMIIndex = () => {
  // Getting image data after application of minimum filter
  let imgData = ctx.getImageData(0, 0, croppedCanvasLeft.width, croppedCanvasLeft.height)

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
* @param {number}  pmiIndex pixel with minimum intensity's index
*
* @return {number} x and y position of pupils
*/
const getPupils = (pmiIndex) => {
  // calculate position of PMI
  pmiX = pmiIndex % (croppedCanvasLeft.width)  //column
  pmiY = Math.floor(pmiIndex / (croppedCanvasLeft.width)) //row

  // convert grayscale to 2D array
  let grayScaleMatrix = []
  let row = []
  let counter = 0
  for (let i = 3; i < originalGrayScaleData.length; i += 4) {
    counter++
    row.push(originalGrayScaleData[i - 1])
    if (counter == croppedCanvasLeft.width) {
      grayScaleMatrix.push(row)
      row = []
      counter = 0
    }
  }

  // look for 70x70 area around pmi 
  let averageIntensity70x70 = getAverageIntensity(grayScaleMatrix, pmiX, pmiY, 35, croppedCanvasLeft)

  // look into grayScale 100x100 area around pmi and check against AI in 70x70
  const arrayOfPoints = []
  for (let row = Math.max(pmiY - 50, 0); row < Math.min(pmiY + 50, croppedCanvasLeft.height); row++) {
    for (let pixel = Math.max(pmiX - 50, 0); pixel < Math.min(pmiX + 50, croppedCanvasLeft.width); pixel++) {
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
* @param {number}  pupilX x position of pupil
* @param {number}  pupilY y position of pupil
*
*/
const drawPupilRegion = (pupilX, pupilY) => {
  // coordinates for main image
  // mainImageColumn = leftStartX + padding + column / leftDisX
  // mainImageRow = leftStartY - padding + row / leftDisY
  // console.log(row, column, mainImageRow, mainImageColumn)

  // drawing squares around pmi
  let ctxx = croppedCanvas2.getContext("2d")
  ctxx.lineWidth = 2

  ctxx.beginPath()
  ctxx.strokeStyle = 'blue'
  ctxx.rect(pmiX - 50, pmiY - 50, 100, 100)
  ctxx.stroke()

  ctxx.beginPath()
  ctxx.strokeStyle = 'purple'
  ctxx.rect(pmiX - 35, pmiY - 35, 70, 70)
  ctxx.stroke()

  // pmi before
  ctxx.beginPath()
  ctxx.strokeStyle = 'green'
  ctxx.arc(pmiX, pmiY, 2, 0, 2 * Math.PI)
  ctxx.stroke()

  // pmi after the averageIntesity calculations
  ctxx.beginPath()
  ctxx.strokeStyle = 'red'
  ctxx.arc(pupilX, pupilY, 2, 0, 2 * Math.PI)
  ctxx.stroke()
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