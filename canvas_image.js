const drawImage = (context, imgObject, imgWidth, imgHeight, scale, canvasX, canvasY, screenX, screenY) => {
    context.drawImage(imgObject, zoomX(0, scale, canvasX, screenX), zoomY(0, scale, canvasY, screenY), zoom(imgWidth, scale), zoom(imgHeight, scale))
}

const panImage = (mouse, scale, canvasX, canvasY, xx, yy) => {
    if (mouse.buttonR === true) {
        canvasX -= mouse.realX - xx
        canvasY -= mouse.realY - yy
        mouse.realX = zoomXInv(mouse.x, scale, canvasX, screenX)
        mouse.realY = zoomYInv(mouse.y, scale, canvasY, screenY)
    }
    return canvasX, canvasY
}

const fitZoom = (image, scale, canvasWidth, canvasHeight) => {
    if (image.width > image.height) {
        scale = canvasWidth / image.width
    } else {
        scale = canvasHeight / image.height
    }
    return scale
}
