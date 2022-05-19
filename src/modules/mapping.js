import { userGazePoints } from './calibration.js'

/** Draws user's gaze as a circle on the browser
 * 
 * @param {HTMLElement} canvas canvas to draw on
 * @param {number}  pupilX x position of pupil
 * @param {number}  pupilY y position of pupil
 * 
 * @return {number} cursor postion
 */
const drawCursor = (canvas, pupilX, pupilY) => {

    // Calculating average points for the pupil and calibration points position after calibration 
    const allGazePoints = getAveragePoints("pupilPos")
    const allScreenPoints = getAveragePoints("calibrationPointsPos")

    // Calculating xCoordinate of where you look 
    let xGazeStart = (allGazePoints[0][0] + allGazePoints[3][0] + allGazePoints[6][0]) / 3
    let xGazeEnd = (allGazePoints[2][0] + allGazePoints[5][0] + allGazePoints[8][0]) / 3
    let gazeWidth = xGazeEnd - xGazeStart

    let xScreenStart = (allScreenPoints[0][0] + allScreenPoints[3][0] + allScreenPoints[6][0]) / 3
    let xScreenEnd = (allScreenPoints[2][0] + allScreenPoints[5][0] + allScreenPoints[8][0]) / 3
    let screenWidth = xScreenEnd - xScreenStart

    let cursorX = (pupilX - xGazeStart) * screenWidth / gazeWidth

    // Calculating yCoordinate of where you look 
    let yGazeStart = (allGazePoints[0][1] + allGazePoints[1][1] + allGazePoints[2][1]) / 3
    let yGazeEnd = (allGazePoints[6][1] + allGazePoints[7][1] + allGazePoints[8][1]) / 3
    let gazeHeight = yGazeEnd - yGazeStart

    let yScreenStart = (allScreenPoints[0][1] + allScreenPoints[1][1] + allScreenPoints[2][1]) / 3
    let yScreenEnd = (allScreenPoints[6][1] + allScreenPoints[7][1] + allScreenPoints[8][1]) / 3
    let screenHeight = yScreenEnd - yScreenStart

    let cursorY = (pupilY - yGazeStart) * screenHeight / gazeHeight

    // style canvas
    canvas.width = screenWidth
    canvas.height = screenHeight
    canvas.style.top = yScreenStart + "px"
    canvas.style.left = xScreenStart + "px"
    
    let ctx = canvas.getContext('2d');
    ctx.beginPath()
    ctx.fillStyle = 'red'
    ctx.arc(cursorX, cursorY, 20, 0, 2 * Math.PI)
    ctx.fill()
    ctx.closePath()

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