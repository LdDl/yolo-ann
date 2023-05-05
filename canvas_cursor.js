// Adds guidelines to user's cursor
const drawGuidelines = (canvas, canvasMouse, strokeColor = '#001f3f') => {
    const horizontalGuideline = new fabric.Line([0, canvasMouse.y, canvas.width, canvasMouse.y], {
        stroke: strokeColor,
        strokeWidth: 1,
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        strokeDashArray: [5, 5]
    });
    canvas.remove(canvas.hLine);
    canvas.add(horizontalGuideline);
    canvas.hLine = horizontalGuideline;

    const verticalGuideline = new fabric.Line([canvasMouse.x, 0, canvasMouse.x, canvas.height], {
        stroke: strokeColor,
        strokeWidth: 1,
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        strokeDashArray: [5, 5]
    });
    canvas.remove(canvas.vLine);
    canvas.add(verticalGuideline);
    canvas.vLine = verticalGuideline;
}

