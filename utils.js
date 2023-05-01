const zoom = (number, scale) => {
    return Math.floor(number * scale)
}

const zoomX = (number, scale, canvasX, screenX) => {
    return Math.floor((number - canvasX) * scale + screenX)
}

const zoomY = (number, scale, canvasY, screenY) => {
    return Math.floor((number - canvasY) * scale + screenY)
}

const zoomXInv = (number, scale, canvasX, screenX) => {
    return Math.floor((number - screenX) * (1 / scale) + canvasX)
}

const zoomYInv = (number, scale, canvasY, screenY) => {
    return Math.floor((number - screenY) * (1 / scale) + canvasY)
}

const formatBytes = (bytes, decimals) => {
    if (bytes === 0) {
        return "0 Bytes"
    }

    const k = 1024
    const dm = decimals || 2
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}