import { userGazePoints } from './calibration.js'

/** Draws user's gaze as a circle on the browser
 * 
 * @param {Document} document canvas to draw on
 * @param {number}  pupilX x position of pupil
 * @param {number}  pupilY y position of pupil
 * 
 * @return {number} cursor postion
 */
const drawCursor = (document, pupilX, pupilY) => {
    const allGazePoints = getAveragePoints("pupilPos")
    const allScreenPoints = getAveragePoints("calibrationPointsPos")

    // xCoord
    let xGazeStart = (allGazePoints[0][0] + allGazePoints[3][0] + allGazePoints[6][0]) / 3
    let xGazeEnd = (allGazePoints[2][0] + allGazePoints[5][0] + allGazePoints[8][0]) / 3
    let gazeWidth = xGazeEnd - xGazeStart

    let xScreenStart = (allScreenPoints[0][0] + allScreenPoints[3][0] + allScreenPoints[6][0]) / 3
    let xScreenEnd = (allScreenPoints[2][0] + allScreenPoints[5][0] + allScreenPoints[8][0]) / 3
    let screenWidth = xScreenEnd - xScreenStart

    let cursorX = (pupilX - xGazeStart) * screenWidth / gazeWidth

    // yCoord
    let yGazeStart = (allGazePoints[0][1] + allGazePoints[1][1] + allGazePoints[2][1]) / 3
    let yGazeEnd = (allGazePoints[6][1] + allGazePoints[7][1] + allGazePoints[8][1]) / 3
    let gazeHeight = yGazeEnd - yGazeStart

    let yScreenStart = (allScreenPoints[0][1] + allScreenPoints[1][1] + allScreenPoints[2][1]) / 3
    let yScreenEnd = (allScreenPoints[6][1] + allScreenPoints[7][1] + allScreenPoints[8][1]) / 3
    let screenHeight = yScreenEnd - yScreenStart

    let cursorY = (pupilY - yGazeStart) * screenHeight / gazeHeight

    // create canvas
    const mappingCanvas = document.createElement("CANVAS")
    mappingCanvas.id = "mappingCanvas"
    mappingCanvas.width = screenWidth
    mappingCanvas.height = screenHeight
    mappingCanvas.style.position = "absolute"
    mappingCanvas.style.top = yScreenStart + "px"
    mappingCanvas.style.left = xScreenStart + "px"

    let ctx = mappingCanvas.getContext('2d');
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, mappingCanvas.width, mappingCanvas.height);

    ctx.beginPath()
    ctx.strokeStyle = 'red'
    ctx.arc(cursorX, cursorY, 6, 0, 6 * Math.PI)
    ctx.stroke()
    document.body.append(mappingCanvas)

    return [cursorX, cursorY]
}

/** Extracts average points from userGazePoints
 * @param {string} key either screen or gaze coordinates
 * @return {number[][]} list of averaged coordinates 
 */
const getAveragePoints = (key) => {
    const result = []
    for (let i = 1; i < Object.keys(userGazePoints).length; i++) {
        let gazeCoordinates = userGazePoints["Pt" + i.toString()][key.toString()]
        let xTotal = 0
        let yTotal = 0
        let counter = 0
        for (let i = 0; i < gazeCoordinates.length; i++) {
            counter++
            xTotal += gazeCoordinates[i][0]
            yTotal += gazeCoordinates[i][1]
        }
        let xAvg = xTotal / counter
        let yAvg = yTotal / counter
        result.push([xAvg, yAvg])
    }
    return result
}

export { drawCursor }