const drawImage = (context, imgObject, imgWidth, imgHeight, scale, canvasX, canvasY, screenX, screenY) => {
    context.drawImage(imgObject, zoomX(0, scale, canvasX, screenX), zoomY(0, scale, canvasY, screenY), zoom(imgWidth, scale), zoom(imgHeight, scale))
}

const fitZoom = (image, scale, canvasWidth, canvasHeight) => {
    if (image.width > image.height) {
        scale = canvasWidth / image.width
    } else {
        scale = canvasHeight / image.height
    }
    return scale
}
