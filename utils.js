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

const crossFromRectangle = (x, y, width, height, paddingPercentage = 1) => {
    const centerX = x + width / 2
    const centerY = y + height / 2

    const offsetY = (height - (height * paddingPercentage)) / 2
    const offsetX = (width - (width * paddingPercentage)) / 2

    return { vertical: [centerX, (centerY - offsetY), centerX, (centerY + offsetY)], horizontal: [(centerX - offsetX), centerY, (centerX + offsetX), centerY] }
}