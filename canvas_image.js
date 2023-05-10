const drawImageScratch = (img, canvas) => {
    const imgInstance = new fabric.Image(img.object, {
        left: 0,
        top: 0,
        selectable: false,
    })
    imgInstance.scaleToWidth(canvas.width, false)
    img.scale = canvas.width / img.width // Remember scale for future use
    canvas.add(imgInstance);
    canvas.renderAll();
}
