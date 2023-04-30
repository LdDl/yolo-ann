
const panImage = (mouse, scale, canvasX, canvasY, xx, yy) => {
    if (mouse.buttonR === true) {
        canvasX -= mouse.realX - xx
        canvasY -= mouse.realY - yy
        mouse.realX = zoomXInv(mouse.x, scale, canvasX, screenX)
        mouse.realY = zoomYInv(mouse.y, scale, canvasY, screenY)
    }
    return canvasX, canvasY
}
