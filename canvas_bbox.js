// Sets user defiend styles for bounding box
const setBBoxStyles = (context, borderColor, backgroundColor, markedBorderColor, markedBackgroundColor, marked) => {
    context.setLineDash([])

    if (marked === false) {
        context.strokeStyle = borderColor
        context.fillStyle = backgroundColor
    } else {
        context.strokeStyle = markedBorderColor
        context.fillStyle = markedBackgroundColor
    }
}

// Draws cross in the middle of bounding box
const drawCross = (context, x, y, width, height, scale, canvasX, canvasY, screenX, screenY) => {
    const centerX = x + width / 2
    const centerY = y + height / 2

    context.beginPath()
    context.moveTo(zoomX(centerX, scale, canvasX, screenX), zoomY(centerY - 10, scale, canvasY, screenY))
    context.lineTo(zoomX(centerX, scale, canvasX, screenX), zoomY(centerY + 10, scale, canvasY, screenY))
    context.stroke()

    context.beginPath()
    context.moveTo(zoomX(centerX - 10, scale, canvasX, screenX), zoomY(centerY, scale, canvasY, screenY))
    context.lineTo(zoomX(centerX + 10, scale, canvasX, screenX), zoomY(centerY, scale, canvasY, screenY))
    context.stroke()
}

// Sets for given container coordinates of bounding box
const setBBoxCoordinates = (containerID, x, y, width, height) => {
    const x2 = x + width
    const y2 = y + height

    document.getElementById(containerID).innerHTML = `${width}x${height} (${x}, ${y}) (${x2}, ${y2})`
}