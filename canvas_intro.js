const drawIntro = (context, fontColor, markedFontColor, fontBaseSize, scale, canvasX, canvasY, screenX, screenY) => {
    setFontStyles(context, fontColor, markedFontColor, fontBaseSize, scale, false)
    context.fillText("USAGE:", zoomX(20, scale, canvasX, screenX), zoomY(50, scale, canvasY, screenY))
    context.fillText("1. Load your images (jpg, png). Might be slow if many or big.", zoomX(20, scale, canvasX, screenX), zoomY(100, scale, canvasY, screenY))
    context.fillText("2. Load your classes (yolo *.names format).", zoomX(20, scale, canvasX, screenX), zoomY(150, scale, canvasY, screenY))
    context.fillText("3. Load or restore, if any, bboxes (zipped yolo/voc/coco files).", zoomX(20, scale, canvasX, screenX), zoomY(200, scale, canvasY, screenY))
    context.fillText("NOTES:", zoomX(20, scale, canvasX, screenX), zoomY(300, scale, canvasY, screenY))
    context.fillText("1: Images and classes must be loaded before bbox load.", zoomX(20, scale, canvasX, screenX), zoomY(350, scale, canvasY, screenY))
    context.fillText("2: Reloading images will RESET BBOXES!", zoomX(20, scale, canvasX, screenX), zoomY(400, scale, canvasY, screenY))
    context.fillText("3: Check out README.md for more information.", zoomX(20, scale, canvasX, screenX), zoomY(450, scale, canvasY, screenY))
}
