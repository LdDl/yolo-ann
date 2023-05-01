const setFontStyles = (context, { fontColor = '#001f3f', markedFontColor = '#ff4136', fontBaseSize = 30, scale = 1, marked = false }) => {
    if (marked === false) {
        context.fillStyle = fontColor
    } else {
        context.fillStyle = markedFontColor
    }
    context.font = context.font.replace(/\d+px/, `${zoom(fontBaseSize, scale)}px`)
}
