const setFontStyles = (context, fontColor, markedFontColor, fontBaseSize, scale, marked) => {
    if (marked === false) {
        context.fillStyle = fontColor
    } else {
        context.fillStyle = markedFontColor
    }
    context.font = context.font.replace(/\d+px/, `${zoom(fontBaseSize, scale)}px`)
}
