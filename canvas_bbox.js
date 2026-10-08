// Sets for given container coordinates of bounding box
const setBBoxCoordinates = (containerID, x, y, width, height) => {
    const x2 = Math.floor(x + width)
    const y2 = Math.floor(y + height)

    document.getElementById(containerID).innerHTML = `${Math.floor(width)}x${Math.floor(height)} (${Math.floor(x)}, ${Math.floor(y)}) (${x2}, ${y2})`
}

const newRect = (bbox, className,
    {
        scale = 1,
        rect_props = { stroke: '#1f77b4', activeStroke: '#aec7e8', strokeWidth: 2, fill: 'rgba(31, 119, 180, 0.2)', activeFill: 'rgba(174, 199, 232, 0.2)', opacity: 1.0 },
        label_props = { fontSize: 30, fill: '#ffffff', activeFill: '#000000', backgroundColor: '#1f77b4', activeBackgroundColor: '#aec7e8' },
        container = { id: null }
    }) => {
    // The border is drawn by renderBorder rather than Fabric's stroke, so left/top/width/height are exactly the
    // bbox and the border is centered on its edge
    const rect = new fabric.Rect({
        left: bbox.x * scale,
        top: bbox.y * scale,
        width: bbox.width * scale,
        height: bbox.height * scale,
        stroke: rect_props.stroke,
        strokeWidth: 0,
        fill: rect_props.fill,
        opacity: rect_props.opacity,
        objectCaching: false // The cache canvas would clip the border, which reaches outside the box
    })
    rect.setControlsVisibility({ mtr: false }) // Disable rotation control
    rect._render = function (ctx) {
        fabric.Rect.prototype._render.call(this, ctx)
        renderBorder(ctx, this, rect_props)
    }
    
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

    // Class name on a solid background, above the bounding box
    const fontSize = label_props.fontSize * scale
    const padding = fontSize * 0.25
    const label = new fabric.Text(className, {
        selectable: false,
        fontFamily: 'sans-serif',
        fontSize: fontSize,
        fill: label_props.fill,
        backgroundColor: label_props.backgroundColor,
        objectCaching: false // The cache canvas would clip the padded background
    })
    label._renderBackground = function (ctx) {
        ctx.fillStyle = this.backgroundColor
        ctx.fillRect(-this.width / 2 - padding, -this.height / 2, this.width + 2 * padding, this.height)
    }

    // Keep the label's background flush with the outer edge of the border, at the top left corner, so they
    // join into one shape
    const borderExtent = rect_props.strokeWidth / 2
    const placeLabel = () => {
        label.set({
            left: rect.left - borderExtent + padding,
            top: rect.top - borderExtent - label.height
        })
        label.setCoords()
    }
    placeLabel()

    rect.on('selected', () => {
        // Display clicked bounding box coordinates into the box of left panel
        if (container.id !== null) {
            setBBoxCoordinates(container.id, bbox.x, bbox.y, bbox.width, bbox.height)
        }
        rect.set({ fill: rect_props.activeFill, stroke: rect_props.activeStroke })
        label.set({ fill: label_props.activeFill, backgroundColor: label_props.activeBackgroundColor })
    })

    rect.on('deselected', () => {
        rect.set({ fill: rect_props.fill, stroke: rect_props.stroke })
        label.set({ fill: label_props.fill, backgroundColor: label_props.backgroundColor })
    })
    
    // Move the label along with the bounding box
    rect.on('moving', placeLabel)
    rect.on('scaling', placeLabel)
        
    // Make sure that the label is removed when the bounding box is removed
    rect.on('removed', () => {
        // Is this really dirty way?
        const canvas = label.canvas
        canvas.remove(label)
    })

    return { rect, label, placeLabel }
}

// The colored border centered on the box edge. Its width stays constant while the box is being resized
// (scaleX/scaleY), like Fabric's strokeUniform.
const renderBorder = (ctx, rect, { strokeWidth }) => {
    if (strokeWidth <= 0) {
        return
    }
    const scaleX = Math.abs(rect.scaleX) || 1
    const scaleY = Math.abs(rect.scaleY) || 1
    const width = rect.width * scaleX
    const height = rect.height * scaleY

    ctx.save()
    ctx.scale(1 / scaleX, 1 / scaleY)
    ctx.lineWidth = strokeWidth
    ctx.strokeStyle = rect.stroke
    ctx.strokeRect(-width / 2, -height / 2, width, height)
    ctx.restore()
}
