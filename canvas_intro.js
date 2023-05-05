const drawIntro = (canvas, { fontColor = '#001f3f', fontBaseSize = 30 }) => {
    canvas.add(new fabric.Text('USAGE:', { selectable: false, fontFamily: 'sans-serif', fontSize: fontBaseSize, fill: fontColor, left: 10, top: 25 }))
    canvas.add(new fabric.Text('1. Load your images (jpg, png). Might be slow if many or big.', { selectable: false, fontFamily: 'sans-serif', fontSize: fontBaseSize, fill: fontColor, left: 10, top: 50 }))
    canvas.add(new fabric.Text('2. Load your classes (yolo *.names format).', { selectable: false, fontFamily: 'sans-serif', fontSize: fontBaseSize, fill: fontColor, left: 10, top: 75 }))
    canvas.add(new fabric.Text('3. Load or restore, if any, bboxes (zipped yolo/voc/coco files).', { selectable: false, fontFamily: 'sans-serif', fontSize: fontBaseSize, fill: fontColor, left: 10, top: 100 }))
    canvas.add(new fabric.Text('NOTES:', { selectable: false, fontFamily: 'sans-serif', fontSize: fontBaseSize, fill: fontColor, left: 10, top: 150 }))
    canvas.add(new fabric.Text('1: Images and classes must be loaded before bbox load.', { selectable: false, fontFamily: 'sans-serif', fontSize: fontBaseSize, fill: fontColor, left: 10, top: 175 }))
    canvas.add(new fabric.Text('2: Reloading images will RESET BBOXES!', { selectable: false, fontFamily: 'sans-serif', fontSize: fontBaseSize, fill: fontColor, left: 10, top: 200 }))
    canvas.add(new fabric.Text('3: Check out README.md for more information.', { selectable: false, fontFamily: 'sans-serif', fontSize: fontBaseSize, fill: fontColor, left: 10, top: 225 }))
}
