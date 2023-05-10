// Draws cross in the middle of bounding box
const drawCross = (x, y, width, height, { scale = 1, paddingPercentage = 1, strokeColor = '#001f3f' }) => {
    const centerX = x + width / 2
    const centerY = y + height / 2

    const offsetY = (height - (height * paddingPercentage)) / 2
    const line1 = new fabric.Line([centerX * scale, (centerY - offsetY) * scale, centerX * scale, (centerY + offsetY) * scale], {
        stroke: strokeColor,
        strokeWidth: 1,
        selectable: false,
        evented: false
    })

    const offsetX = (width - (width * paddingPercentage)) / 2
    const line2 = new fabric.Line([(centerX - offsetX) * scale, centerY * scale, (centerX + offsetX) * scale, centerY * scale], {
        stroke: strokeColor,
        strokeWidth: 1,
        selectable: false,
        evented: false
    })

    return { vertical: line1, horizontal: line2}
}

// Sets for given container coordinates of bounding box
const setBBoxCoordinates = (containerID, x, y, width, height) => {
    const x2 = Math.floor(x + width)
    const y2 = Math.floor(y + height)

    document.getElementById(containerID).innerHTML = `${Math.floor(width)}x${Math.floor(height)} (${Math.floor(x)}, ${Math.floor(y)}) (${x2}, ${y2})`
}

const newRect = (bbox, className,
    {
        scale = 1,
        rect_props = { stroke: '#001f3f', activeStroke: '#ff4136', strokeWidth: 1, fill: 'rgba(0, 116, 217, 0.2)', activeFill: 'rgba(255, 133, 27, 0.2)', opacity: 1.0 },
        label_props = { fontSize: 30, fill: '#001f3f', activeFill: '#ff4136' },
        cross_props = { enabled: true, paddingPercentage: 0.0, stroke: '#001f3f', activeStroke: '#ff4136' }, 
        container = { id: null }
    }) => {
     // Draw bounding box itself
     const rect = new fabric.Rect({
        left: bbox.x * scale,
        top: bbox.y * scale,
        width: bbox.width * scale,
        height: bbox.height * scale,
        stroke: rect_props.stroke,
        strokeWidth: rect_props.strokeWidth,
        fill: rect_props.fill,
        opacity: rect_props.opacity,
        strokeDashArray: null
        // lockRotation: true,
        // controls: { ...fabric.Rect.prototype.controls, mtr: new fabric.Control({ visible: false }) }
    })
    rect.setControlsVisibility({ mtr: false }) // Disable rotation control
    
    // Attach bounding box to the rectangle object
    rect.underlying_bbox = bbox

    // Update bounding box coordinates when the bounding box is changed
    rect.on('modified', (options) => {
        const target = options.target
        // Update bounding box coordinates
        const targetWidth = target.width * target.scaleX
        const targetHeight = target.height * target.scaleY
        bbox.x = target.left / scale
        bbox.y = target.top / scale
        bbox.width = targetWidth / scale
        bbox.height = targetHeight / scale

        // Update information in the left panel
        if (container.id !== null) {
            setBBoxCoordinates(container.id, bbox.x, bbox.y, bbox.width, bbox.height)
        }
    })

    // Place label above bounding box
    const label = new fabric.Text(className, {
        selectable: false,
        fontFamily: 'sans-serif',
        fontSize: label_props.fontSize * scale,
        fill: label_props.fill,
        left: rect.left,
        top: (rect.top - label_props.fontSize * scale)
    })

    // Cross in the center of bounding box
    const { vertical, horizontal } = drawCross(rect.left, rect.top, rect.width, rect.height, { scale: 1.0, paddingPercentage: cross_props.paddingPercentage, strokeColor: cross_props.stroke })

    rect.on('selected', () => {
        // Display clicked bounding box coordinates into the box of left panel
        if (container.id !== null) {
            setBBoxCoordinates(container.id, bbox.x, bbox.y, bbox.width, bbox.height)
        }
        // Highlight bounding box, label and cross
        rect.set({ fill: rect_props.activeFill })
        rect.set({ stroke: rect_props.activeStroke })
        label.set({ fill: label_props.activeFill })
        vertical.set({ stroke: cross_props.activeStroke })
        horizontal.set({ stroke: cross_props.activeStroke })
    })

    rect.on('deselected', () => {
        rect.set({ fill: rect_props.fill })
        rect.set({ stroke: rect_props.stroke })
        label.set({ fill: label_props.fill })
        vertical.set({ stroke: cross_props.stroke })
        horizontal.set({ stroke: cross_props.stroke })
    })
    
    // Move text and cross along with the bounding box
    rect.on('moving', (options) => {
        moveLabelAlongWithBBox(rect, label, label_props.fontSize, scale)
        if (cross_props.enabled === true) {
            moveCrossAlongWithBBox(rect, vertical, horizontal, cross_props.paddingPercentage, options)
        }
    })

    // Move text and cross along with the bounding box while zooming
    rect.on('scaling', (options) => {
        moveLabelAlongWithBBox(rect, label, label_props.fontSize, scale)
        if (cross_props.enabled === true) {
            moveCrossAlongWithBBox(rect, vertical, horizontal, cross_props.paddingPercentage, options)
        }
    })
        
    // Make sure that corresponding label and cross are removed when the bounding box is removed
    rect.on('removed', () => {
        // Is this really dirty way?
        const canvas = label.canvas
        canvas.remove(label)
        if (cross_props.enabled === true) {
            canvas.remove(vertical)
            canvas.remove(horizontal)
        }
    })

    return { rect, label, vertical, horizontal }
}

// Function to move the label along with the bounding box
const moveLabelAlongWithBBox = (rect, label, fontSize, imgScale) => {
    label.set({
        left: rect.left,
        top: (rect.top - fontSize * imgScale),
    });
}

// Function to move crosslines along with the bounding box
const moveCrossAlongWithBBox = (rect, vertical, horizontal, linePaddingPercent, options) => {
    const transform = options.transform
    const target = transform.target
    const targetScaleX = target.scaleX
    const targetScaleY = target.scaleY
    const rectLeft = target.left
    const rectTop = target.top
    const newRectWidth = target.width * targetScaleX
    const newRectHeight = target.height * targetScaleY
    const newCross = crossFromRectangle(rectLeft, rectTop, newRectWidth, newRectHeight, linePaddingPercent)
    vertical.set({
        x1: newCross.vertical[0],
        y1: newCross.vertical[1],
        x2: newCross.vertical[2],
        y2: newCross.vertical[3],
    });
    horizontal.set({
        x1: newCross.horizontal[0],
        y1: newCross.horizontal[1],
        x2: newCross.horizontal[2],
        y2: newCross.horizontal[3],
    });

}