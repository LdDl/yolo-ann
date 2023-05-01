// Adds guidelines to user's cursor
const drawGuidelines = (context, mouse, imgWidth, imgHeight, { scale = 1, canvasX, canvasY, screenX, screenY }) => {
    context.setLineDash([5])

    context.beginPath()
    context.moveTo(zoomX(mouse.realX, scale, canvasX, screenX), zoomY(0, scale, canvasY, screenY))
    context.lineTo(zoomX(mouse.realX, scale, canvasX, screenX), zoomY(imgHeight, scale, canvasY, screenY))
    context.stroke()

    context.beginPath()
    context.moveTo(zoomX(0, scale, canvasX, screenX), zoomY(mouse.realY, scale, canvasY, screenY))
    context.lineTo(zoomX(imgWidth, scale, canvasX, screenX), zoomY(mouse.realY, scale, canvasY, screenY))
    context.stroke()
}