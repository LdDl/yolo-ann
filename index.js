
(() => {
    "use strict"

    // Parameters
    const saveInterval = 60 // Bbox recovery save in seconds
    const fontBaseSize = 30 // Text size in pixels
    const fontColor = "#001f3f" // Base font color
    const borderColor = "#001f3f" // Base bbox border color
    const borderWidth = 2 // Bbox border width
    const fillOpacity = 0.2 // Bbox fill: the border color at this opacity
    // Border and label background by class id: the bright half of the tab20 palette (matplotlib, D3) ...
    const classColors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
        "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]
    // ... and the light half of it for the selected box
    const markedClassColors = ["#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5",
        "#c49c94", "#f7b6d2", "#c7c7c7", "#dbdb8d", "#9edae5"]
    const unknownClassColor = "#ff00ff" // Border and label background of boxes whose class isn't loaded
    const markedUnknownClassColor = "#ff99ff" // The same for the selected box
    const markedFontColor = "#ff4136" // Marked font color in the intro text
    const minBBoxWidth = 5 // Minimal width of bbox
    const minBBoxHeight = 5 // Minimal height of bbox
    const minZoom = 0.1 // Smallest zoom allowed
    const maxZoom = 5 // Largest zoom allowed
    const wheelZoomSpeed = 0.002 // Zoom change per scroll unit (deltaY); larger zooms faster
    const resetCanvasOnChange = true // Whether to return to default position and zoom on image change
    const defaultScale = 0.5 // Default zoom level for images. Can be overridden with fittedZoom
    const drawCursorGuidelines = true // Whether to draw guidelines for cursor
    const minSidebarWidth = 200 // Narrowest the sidebar can be dragged, in pixels
    const minCanvasWidth = 300 // How close to the right window edge the sidebar can be dragged, in pixels

    let canvas = null

    // All annotation data and selections live here; see formats.js for the shapes of images, classes and bboxes
    const state = {
        images: {}, // Loaded image files by name, with their size and position in the image list
        classes: {}, // Class ids by name
        bboxes: {}, // Boxes by image name and class name
        currentImage: null, // Image shown on the canvas: { name, object, width, height, scale }
        currentImageRequest: 0, // Incremented per image switch so stale async loads can be ignored
        currentClass: null, // Class name given to new boxes
        currentBBox: null, // Selected box: { bbox, index, ... }
        imageListIndex: 0, // Selected row in the image list
        classListIndex: 0 // Selected row in the class list
    }

    /* Containers */
    const canvasID = 'canvas'
    const bboxInformationID = 'bboxInformation'
    const classListID = 'classList'
    const classesID = 'classes'
    const imageInformationID = 'imageInformation'
    const imagesID = 'images'
    const imageListID = 'imageList'
    const imageProgressID = "imageProgress"
    const imageSearchID = 'imageSearch'
    const bboxesID = 'bboxes'
    const restoreBboxesID = 'restoreBboxes'
    const saveBBoxesID = 'saveBboxes'
    const saveBBoxesVOCID = 'saveVocBboxes'
    const vocFolderID = 'vocFolder'
    const saveBBoxesCOCOID = 'saveCocoBboxes'
    const cropImagesID = 'cropImages'
    const containerID = "container"
    const sidebarResizerID = "sidebarResizer"

    // Keep tracking objects in drawing mode
    var isDrawingMode = false
    var drawingObject = null

    // Panning
    var isPanning = false
    let controlsLocked = false // See lockControls

    let lastPosX = 0;
    let lastPosY = 0;
    // Prevent context menu on right click - it's used for panning
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault()
    }, false)

    const isSupported = ()  => {
        try {
            const key = "__some_random_key_1234%(*^()^)___"

            localStorage.setItem(key, key)
            localStorage.removeItem(key)

            return true
        } catch (e) {
            return false
        }
    }

    // Save bboxes to local storage every X seconds
    if (isSupported() === true) {
        setInterval(() => {
            if (Object.keys(state.bboxes).length > 0) {
                localStorage.setItem("bboxes", JSON.stringify(state.bboxes))
                // The class list in id order, so Restore works without loading the classes file again
                localStorage.setItem("classes", JSON.stringify(Object.keys(state.classes)
                    .sort((a, b) => state.classes[a] - state.classes[b])))
                localStorage.setItem("bboxesSavedAt", new Date().toISOString())
            }
        }, saveInterval * 1000)
    } else {
        alert("Restore function is not supported. If you need it, use Chrome or Firefox instead.")
    }

    // Prevent accidental reloading
    window.onbeforeunload = function(){
        return 'Are you sure you want to leave the page?';
    };

    // Start everything
    document.onreadystatechange = () => {
        if (document.readyState === "complete") {
            // Nothing is loaded after a reload, so the pickers and buttons mustn't show a restored state
            document.querySelector("form").reset()
            updateLoadButtons()
            listenSidebarResize(sidebarResizerID, containerID) // Restores the saved width before the canvas is sized
            initCanvas(canvasID, bboxInformationID)
            listenCanvasMouse(bboxInformationID)
            listenImageLoad(imagesID, imageListID)
            listenImageSelect(imageListID)
            listenClassLoad(classesID)
            listenClassSelect(classListID)
            listenBboxLoad(bboxesID)
            listenBboxSave(saveBBoxesID)
            listenBboxVocSave(saveBBoxesVOCID, vocFolderID)
            listenBboxCocoSave(saveBBoxesCOCOID)
            listenBboxRestore(restoreBboxesID)
            listenKeyboard(imageListID, classListID)
            listenImageSearch(imageSearchID)
            listenImageCrop(cropImagesID)
        }
    }

    const initCanvas = (canvasContainerID, bboxInformationContainerID) => {

        canvas = new fabric.Canvas(canvasContainerID, {
            preserveObjectStacking: true,
            selection: false // Disable selection of multiple objects by "click+drag" or "shift+click"
        })
        fitCanvasToWindow()

        // Browser zoom resizes the window too
        window.addEventListener("resize", scheduleCanvasFit)

        if (drawCursorGuidelines === true) {
            canvas.hoverCursor = 'crosshair'
            canvas.on('mouse:move', function (opt) {
                const canvasMouse = canvas.getPointer(opt.e);
                drawGuidelines(canvas, canvasMouse, borderColor)
            })
        }
        drawIntro(canvas, { fontColor, markedFontColor, fontBaseSize: fontBaseSize * defaultScale })

        canvas.on('selection:created', changeCurrentBBox)
        canvas.on('selection:updated', changeCurrentBBox)
        // Otherwise Delete would still remove the last selected bbox's data while its rect stays on the canvas
        canvas.on('selection:cleared', clearCurrentBBox)
    }

    // Makes the canvas fill the area right of the sidebar
    const fitCanvasToWindow = () => {
        const right = document.getElementById("right")
        const style = window.getComputedStyle(right)
        const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)

        // Fabric reads the pixel ratio only once, but browser zoom changes it; a stale one blurs the image
        fabric.devicePixelRatio = window.devicePixelRatio || 1
        canvas.setDimensions({
            width: Math.floor(right.clientWidth - padding),
            height: window.innerHeight - 20 // .right's top and bottom margins
        })
    }

    // Refits the canvas at most once per frame, e.g. while dragging the window edge or the sidebar border
    let canvasFitPending = false

    const scheduleCanvasFit = () => {
        if (canvasFitPending) {
            return
        }

        canvasFitPending = true
        window.requestAnimationFrame(() => {
            canvasFitPending = false
            fitCanvasToWindow()
            refreshCanvas() // Fits the image to the new width
        })
    }

    // Dragging the sidebar's border resizes it; double-click resets it. The width is kept as a percentage of the
    // window, so it scales with window resizes, and remembered across reloads.
    const listenSidebarResize = (resizerID, containerID) => {
        const resizer = document.getElementById(resizerID)
        const container = document.getElementById(containerID)
        const storageKey = "sidebarWidth"
        const borderOffset = 10 // .right's border is this far right of the sidebar width (see index.css)

        const setWidth = (pixels) => {
            const total = container.clientWidth
            const clamped = Math.max(minSidebarWidth, Math.min(pixels, total - minCanvasWidth))

            container.style.setProperty("--sidebar-width", `${clamped / total * 100}%`)
        }

        const saved = isSupported() ? parseFloat(localStorage.getItem(storageKey)) : NaN

        if (isFinite(saved)) {
            setWidth(saved / 100 * container.clientWidth)
        }

        resizer.addEventListener("pointerdown", (event) => {
            if (event.button !== 0) {
                return
            }

            event.preventDefault() // No text selection while dragging
            resizer.setPointerCapture(event.pointerId)
            resizer.classList.add("dragging")
        })

        resizer.addEventListener("pointermove", (event) => {
            if (resizer.classList.contains("dragging")) {
                setWidth(event.clientX - borderOffset)
                scheduleCanvasFit()
            }
        })

        const stopDragging = () => {
            if (!resizer.classList.contains("dragging")) {
                return
            }

            resizer.classList.remove("dragging")

            if (isSupported()) {
                localStorage.setItem(storageKey, parseFloat(container.style.getPropertyValue("--sidebar-width")))
            }
        }

        resizer.addEventListener("pointerup", stopDragging)
        resizer.addEventListener("lostpointercapture", stopDragging)

        resizer.addEventListener("dblclick", () => {
            container.style.removeProperty("--sidebar-width")

            if (isSupported()) {
                localStorage.removeItem(storageKey)
            }

            scheduleCanvasFit()
        })
    }

    // Forgets the selected box; its rect stays on the canvas
    const clearCurrentBBox = () => {
        if (state.currentBBox !== null) {
            state.currentBBox.bbox.marked = false // Unmark via reference
            state.currentBBox = null
        }
    }

    const changeCurrentBBox = (options) => {
        const event = options.e
        if (event === undefined) {
            return
        }
        const selectedObjects = options.selected;
        if (selectedObjects.length < 1) {
            return
        }
        const selectedObject = selectedObjects[0]
        const underlyingBBox = selectedObject.underlying_bbox

        const index = state.bboxes[state.currentImage.name][selectedObject.underlying_bbox.class].findIndex(
            element => (element.height === underlyingBBox.height) && (element.width === underlyingBBox.width) && (element.x === underlyingBBox.x) && (element.y === underlyingBBox.y)
        );

        state.currentBBox = {
            bbox: selectedObject.underlying_bbox,
            // index: bboxes[currentImage.name][selectedObject.underlying_bbox.class].length-1, // What was that? hidden memes?
            index: index,
            originalX: underlyingBBox.x,
            originalY: underlyingBBox.y,
            originalWidth: underlyingBBox.width,
            originalHeight: underlyingBBox.height,
            moving: false,
            resizing: null
        }
    }

    const refreshCanvas = () => {
        if (state.currentImage === null) {
            return
        }

        canvas.clear()
        drawImageScratch(state.currentImage, canvas)
        // drawNewBbox(context)
        drawExistingBboxes(bboxInformationID, canvas)
    }

    const drawExistingBboxes = (bboxInformationContainerID, canvas) => {
        const imgScale = state.currentImage.scale
        const currentBboxes = state.bboxes[state.currentImage.name]

        for (let className in currentBboxes) {
            currentBboxes[className].forEach(bbox => {

                const { rect, label } = newRect(bbox, className,
                    bboxStyle(imgScale, className, bboxInformationContainerID))

                canvas.add(rect)
                canvas.add(label)
            })
        }
    }

    // Options for newRect: how boxes look on the canvas, unselected and selected
    // The border, the translucent fill and the label background share the class color, a light variant of it
    // when selected
    const bboxStyle = (scale, className, bboxInformationContainerID) => {
        const { color, markedColor } = classColor(className)

        return {
            scale: scale,
            rect_props: {
                stroke: color,
                activeStroke: markedColor,
                strokeWidth: borderWidth,
                fill: withOpacity(color, fillOpacity),
                activeFill: withOpacity(markedColor, fillOpacity),
                opacity: 1.0
            },
            label_props: {
                fontSize: fontBaseSize * defaultScale,
                fill: textColorOn(color),
                activeFill: textColorOn(markedColor),
                backgroundColor: color,
                activeBackgroundColor: markedColor
            },
            container: { id: bboxInformationContainerID }
        }
    }

    const classColor = (className) => {
        const id = state.classes[className]
        if (!Number.isInteger(id)) {
            return { color: unknownClassColor, markedColor: markedUnknownClassColor }
        }
        const i = id % classColors.length

        return { color: classColors[i], markedColor: markedClassColors[i] }
    }

    const rgbOf = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))

    // "#rrggbb" as an "rgba(...)" with the given opacity
    const withOpacity = (hex, opacity) => `rgba(${rgbOf(hex).join(", ")}, ${opacity})`

    // Black or white text, whichever is more readable on the given "#rrggbb" background
    const textColorOn = (hex) => {
        const [r, g, b] = rgbOf(hex)
        const luma = 0.299 * r + 0.587 * g + 0.114 * b

        return luma > 150 ? "#000000" : "#ffffff"
    }

    const listenCanvasMouse = (bboxInformationContainerID) => {
        canvas.on('mouse:wheel', trackWheel)
        canvas.on('mouse:down:before', wheelPanningStart)
        canvas.on('mouse:move', wheelPanningMove)
        canvas.on('mouse:up:before', wheelPanningDone)

        canvas.on('mouse:down:before', (event) => startNewRect(event, bboxInformationContainerID))
        canvas.on('mouse:move', eventDrawingRect)
        canvas.on('mouse:up', doneDrawingRect)
    }

    const wheelPanningStart = (event) => {
        // Make sure that panning started with WHEEL click
        if (event.e.button !== 1) {
            return
        }
        isPanning = true
        lastPosX = event.e.clientX;
        lastPosY = event.e.clientY;
    }

    const wheelPanningMove = (event) => {
        if (isPanning === false) {
            return
        }
        const deltaX = event.e.clientX - lastPosX;
        const deltaY = event.e.clientY - lastPosY;
        lastPosX = event.e.clientX;
        lastPosY = event.e.clientY;
        canvas.viewportTransform[4] += deltaX;
        canvas.viewportTransform[5] += deltaY;
        // canvas.requestRenderAll();
    }

    const wheelPanningDone = (event) => {
        if (isPanning === true && event.e.button === 1) {
            isPanning = false
        }
    }

    const startNewRect = (event, bboxInformationContainerID) => {
        // Make sure that drawing started with LEFT mouse click
        if (event.e.button !== 0) {
            return
        }
        // Pressing on an existing bbox (or the resize handles of the selected one) selects/moves it instead.
        // Anywhere else (background image, labels, empty canvas) draws, even while another bbox is selected.
        if (event.target && event.target.selectable) {
            return
        }
        if (state.currentImage === null || state.currentImage === undefined ||
            state.currentClass === null || state.currentClass === undefined) {
            // Prevent drawing new bounding box when no image or classname is selected
            return
        }
        if (canvas.getActiveObject()) {
            canvas.discardActiveObject()
        }
        const imgScale = state.currentImage.scale
        isDrawingMode = true
        const pointer = canvas.getPointer(event.e)
        
        const newBBox = canvasRectToBBox({left: pointer.x, top: pointer.y, width: 0, height: 0}, imgScale,
            state.currentClass)

        const { rect, label, placeLabel } = newRect(newBBox, state.currentClass,
            bboxStyle(imgScale, state.currentClass, bboxInformationContainerID))

        drawingObject = {
            rect: rect,
            label: label,
            placeLabel: placeLabel,
            bbox: newBBox,
            start: pointer
        }

        canvas.add(drawingObject.rect)
        canvas.add(drawingObject.label)
        canvas.setActiveObject(drawingObject.rect) // @todo: this is not highlighing object, which is strange to me
    }
    
    const eventDrawingRect = (event) => {
        if (!isDrawingMode) {
            return
        }
        const pointer = canvas.getPointer(event.e)
        const start = drawingObject.start
        // The start point may be any corner, as the box can be drawn in any direction
        drawingObject.rect.set({
          left: Math.min(start.x, pointer.x),
          top: Math.min(start.y, pointer.y),
          width: Math.abs(pointer.x - start.x),
          height: Math.abs(pointer.y - start.y),
          dirty: true,
        })
        drawingObject.placeLabel()
        canvas.requestRenderAllBound() // Do we need this?
    }
    
    const doneDrawingRect = (event) => {
        if (!isDrawingMode) {
            return
        }
        isDrawingMode = false;

        if (drawingObject.rect && (drawingObject.rect.width <= minBBoxWidth || drawingObject.rect.height <= minBBoxHeight)) {
            // Do not draw bounding box if it is too small
            canvas.remove(drawingObject.rect)
            canvas.remove(drawingObject.label)
            return
        }
        if (!drawingObject.rect) {
            console.log('Is it possible to reach this condition?')
        }
        drawingObject.rect.setCoords() // Do we need this?

        // Mock up options to trigger 'modified' event so bounding box is forced to be re-calculated
        const mockOptions = {
            target: {
                left: drawingObject.rect.left,
                top: drawingObject.rect.top,
                width: drawingObject.rect.width,
                height: drawingObject.rect.height,
                scaleX: 1,
                scaleY: 1,
            }
        };
        drawingObject.rect.fire('modified', mockOptions)
        canvas.setActiveObject(drawingObject.rect)
        // Simply store new bounding box
        saveBBox(state.bboxes, drawingObject.bbox, state.currentImage.name)
    }

    const canvasRectToBBox = (rect, scale, classname) => {
        const new_bbox = {
            x: rect.left / scale,
            y: rect.top / scale,
            width: rect.width / scale,
            height: rect.height / scale,
            marked: true,
            class: classname
        }
        return new_bbox
    }
    
    const saveBBox = (storage, bbox, imageName) => {
        if (typeof storage[imageName] === "undefined") {
            storage[imageName] = {}
        }
        if (typeof storage[imageName][bbox.class] === "undefined") {
            storage[imageName][bbox.class] = []
        }
        storage[imageName][bbox.class].push(bbox)
        state.currentBBox = {
            bbox: bbox,
            index: storage[imageName][bbox.class].length - 1,
            originalX: bbox.x,
            originalY: bbox.y,
            originalWidth: bbox.width,
            originalHeight: bbox.height,
            moving: false,
            resizing: null
        }
    }

    const trackWheel = (opt) => {
        const delta = opt.e.deltaY
        let zoom = canvas.getZoom()
        zoom *= (1 - wheelZoomSpeed) ** delta
        zoom = Math.min(maxZoom, zoom) // eq. to: if (zoom > maxZoom) zoom = maxZoom;
        zoom = Math.max(minZoom, zoom) // eq. to: if (zoom < minZoom) zoom = minZoom;
        // canvas.setZoom(zoom)
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
        opt.e.preventDefault()
        opt.e.stopPropagation()
    }

    const listenImageLoad = (imagesContainerID, imageListContainerID) => {
        const imagesElement = document.getElementById(imagesContainerID)
        let waitingForFiles = false // The picker was opened and its files haven't arrived yet
        let reading = false // Images of the current selection are being read

        const stopWaiting = () => {
            if (waitingForFiles && !reading) {
                showImageProgress(null)
                lockControls(false)
            }

            waitingForFiles = false
        }

        // The browser may take a long time to pass on many files after the picker closes (e.g. a Flatpak
        // browser exporting each file through its document portal), and the page gets nothing until then
        imagesElement.addEventListener("click", () => {
            waitingForFiles = true
            lockControls(true)

            if (!reading) {
                showImageProgress("waiting")
            }
        })
        imagesElement.addEventListener("cancel", stopWaiting) // Chromium also sends this when the same files are picked

        imagesElement.addEventListener("change", async (event) => {
            const imageList = document.getElementById(imageListContainerID)
            const files = event.target.files

            waitingForFiles = false

            if (files.length === 0) {
                if (!reading) {
                    showImageProgress(null)
                    lockControls(false)
                }

                return
            }

            resetImageList(imageListContainerID)

            for (let i = 0; i < files.length; i++) {
                if (Formats.isImageFile(files[i].name)) {
                    // Position in the image list; skipped non-image files must not leave gaps
                    const index = imageList.length

                    state.images[files[i].name] = {
                        meta: files[i],
                        index: index
                    }

                    const option = document.createElement("option")

                    option.value = files[i].name
                    option.textContent = files[i].name

                    if (index === 0) {
                        option.selected = true
                    }

                    imageList.appendChild(option)
                }
            }

            const imageSet = state.images // Loads from an earlier selection must not touch a newer image set
            const imageNames = Object.keys(imageSet)
            const failed = []

            let done = 0

            if (imageNames.length === 0) {
                document.body.style.cursor = "default" // An earlier, superseded load may have set "wait"
                reading = false
                showImageProgress(null)
                lockControls(false)

                return
            }

            document.body.style.cursor = "wait"
            reading = true
            lockControls(true) // Also for files dropped on the picker, which sends no click
            showImageProgress(0, imageNames.length, 0)

            // Decode every image once to learn its size, which the annotation formats need
            await mapLimit(imageNames, fileReadConcurrency, async (imageName) => {
                if (state.images !== imageSet) {
                    return // A newer selection replaced this one; stop reading its files
                }

                try {
                    const imageObject = await loadImage(imageSet[imageName].meta)

                    imageSet[imageName].width = imageObject.width
                    imageSet[imageName].height = imageObject.height
                } catch (error) {
                    failed.push(imageName)
                }

                done += 1

                if (state.images === imageSet) {
                    showImageProgress(done, imageNames.length, failed.length)
                }
            })

            if (state.images !== imageSet) {
                return
            }

            document.body.style.cursor = "default"
            reading = false
            showImageProgress(null)
            lockControls(false)

            if (failed.length > 0) {
                const more = failed.length > 10 ? `\n...and ${failed.length - 10} more` : ""

                console.warn(`Could not decode ${failed.length} image(s):`, failed)
                alert(`Could not load ${failed.length} image(s); they can't be annotated or exported:\n\n` +
                    `${failed.slice(0, 10).join("\n")}${more}`)
            }

            const firstLoaded = imageNames.find((name) => typeof state.images[name].width !== "undefined")

            if (typeof firstLoaded !== "undefined") {
                selectImage(state.images[firstLoaded].index)
            }

            updateLoadButtons()
        })
    }

    // Disables every control but the Images picker from the moment its picker opens until the images are read.
    // Opening another file picker (Classes, Bboxes) while a Flatpak browser is still exporting the picked
    // images through its document portal hangs the browser. Restores what was enabled before.
    const lockControls = (locked) => {
        if (locked === controlsLocked) {
            return
        }

        controlsLocked = locked

        if (locked) {
            document.querySelectorAll("form input, form select, form button, form textarea").forEach((control) => {
                if (control.id !== imagesID && !control.disabled) {
                    control.disabled = true
                    control.dataset.locked = "true"
                }
            })

            return
        }

        document.querySelectorAll("form [data-locked]").forEach((control) => {
            control.disabled = false
            delete control.dataset.locked
        })

        updateLoadButtons()
    }

    // Shows a spinner and "Reading images: done / total" under the Images picker. Pass "waiting" while the
    // browser hasn't passed on the picked files yet (count unknown), or null to hide it.
    const showImageProgress = (done, total, failedCount) => {
        const container = document.getElementById(imageProgressID)
        const bar = container.querySelector("progress")
        const text = container.querySelector(".hint")

        if (done === null) {
            container.hidden = true

            return
        }

        if (done === "waiting") {
            bar.hidden = true
            text.textContent = "Waiting for the selected files..."
            container.hidden = false

            return
        }

        const failedText = failedCount > 0 ? ` (${failedCount} failed)` : ""

        bar.max = total
        bar.value = done
        bar.hidden = false
        text.textContent = `Reading images: ${done} / ${total}${failedText}`
        container.hidden = false
    }

    // Annotations and the backup are matched to loaded images, so they need images first. Classes are
    // optional: a COCO file and the backup bring their own.
    const updateLoadButtons = () => {
        if (controlsLocked) {
            return // lockControls calls this again when unlocking
        }

        const hasImages = Object.keys(state.images).length > 0

        document.getElementById(bboxesID).disabled = !hasImages
        document.getElementById(restoreBboxesID).disabled = !hasImages
    }

    const resetImageList = (imageListContainerID) => {
        const imageList = document.getElementById(imageListContainerID)

        imageList.innerHTML = ""

        state.images = {}
        state.bboxes = {}
        state.currentImage = null
        state.currentImageRequest++
        state.imageListIndex = 0
    }

    // The only way to change the current image (list click, arrow keys, search, loading): selects its row,
    // remembers the position for the arrow keys and shows the image
    const selectImage = (index) => {
        const imageList = document.getElementById(imageListID)

        if (index < 0 || index >= imageList.length) {
            return
        }

        state.imageListIndex = index
        imageList.selectedIndex = index

        setCurrentImage(state.images[imageList.options[index].value])
    }

    const setCurrentImage = async (imageFile) => {
        if (resetCanvasOnChange === true) {
            resetCanvasPlacement()
        }

        const request = ++state.currentImageRequest

        clearCurrentBBox()

        document.getElementById(imageInformationID).innerHTML =
            `${imageFile.width}x${imageFile.height}, ${formatBytes(imageFile.meta.size)}`

        let imageObject = null

        try {
            imageObject = await loadImage(imageFile.meta)
        } catch (error) {
            console.warn(error.message)

            return
        }

        // Another image was selected while this one was loading
        if (request !== state.currentImageRequest) {
            return
        }

        state.currentImage = {
            name: imageFile.meta.name,
            object: imageObject,
            width: imageFile.width,
            height: imageFile.height,
            scale: 1.0
        }
        refreshCanvas()
    }

    const listenImageSelect = (imageListContainerID) => {
        const imageList = document.getElementById(imageListContainerID)

        imageList.addEventListener("change", () => {
            if (imageList.selectedIndex < 0) {
                // Ctrl+click deselected the only row; keep showing the current image
                imageList.selectedIndex = state.imageListIndex
            } else {
                selectImage(imageList.selectedIndex)
            }
        })
    }

    const listenClassLoad = (classesContainerID) => {
        const classesElement = document.getElementById(classesContainerID)
    
        classesElement.addEventListener("click", () => {
            classesElement.value = null
        })
    
        classesElement.addEventListener("change", async (event) => {
            const files = event.target.files

            if (files.length === 0) {
                return
            }

            const extension = Formats.extensionOf(files[0].name)
            let result = null

            try {
                // Don't read files that are rejected by name anyway (could be a large zip)
                const text = ["txt", "names", "yaml", "yml"].includes(extension) ? await readText(files[0]) : ""

                result = Formats.readClassFile(files[0].name, text)
            } catch (error) {
                result = {error: `Could not read ${files[0].name}: ${error.message}`}
            }

            if (typeof result.error !== "undefined") {
                // Reject the file: the picker shows no file and the current class list stays
                const kept = Object.keys(state.classes).length > 0 ? "\n\nThe current class list is kept." : ""

                classesElement.value = ""
                alert(result.error + kept)

                return
            }

            if (!applyClassListToBoxes(files[0].name, result.classes)) {
                classesElement.value = ""

                return
            }

            // Ids follow the file: non-empty rows (blank lines don't shift them) or the data.yaml `names` ids
            setClassList(result.classes)
        })
    }

    // A new class list renames the existing boxes by class id (see Formats.remapClassesById), after asking.
    // Returns false if the user keeps the current class list instead.
    const applyClassListToBoxes = (fileName, classNames) => {
        const { bboxes, renamed, unmapped } = Formats.remapClassesById(state.bboxes, state.classes, classNames)
        const unmappedNames = Object.keys(unmapped)

        if (renamed.length === 0 && unmappedNames.length === 0) {
            return true
        }

        const list = (rows) => rows.slice(0, 15).join("\n") +
            (rows.length > 15 ? `\n...and ${rows.length - 15} more` : "")
        let message = `${fileName} has other class names. Existing boxes follow their class id:\n\n` +
            list(renamed.map(({ from, to, count }) => `${from} → ${to} (${count} box(es))`))

        if (unmappedNames.length > 0) {
            message += `\n\nThese classes have no id in the new list, so their boxes keep the old name (shown in ` +
                `magenta, and not saved to YOLO or COCO):\n\n` +
                list(unmappedNames.map((name) => `${name} (${unmapped[name]} box(es))`))
        }

        if (!confirm(`${message}\n\nOK: load the new class list. Cancel: keep the current one.`)) {
            return false
        }

        clearCurrentBBox()
        state.bboxes = bboxes

        return true
    }

    // Replaces the class list; a class's position in it is its YOLO id
    const setClassList = (classNames) => {
        const classList = document.getElementById(classListID)

        classList.innerHTML = ""

        state.classes = {}
        state.currentClass = null
        state.classListIndex = 0

        classNames.forEach((className, id) => {
            state.classes[className] = id

            const option = document.createElement("option")

            option.value = id
            option.textContent = className

            classList.appendChild(option)
        })

        selectClass(0)
        updateLoadButtons()
        // Box colors and labels follow the class list
        refreshCanvas()
    }

    // The only way to change the class given to new boxes (list click, arrow keys, loading classes)
    const selectClass = (index) => {
        const classList = document.getElementById(classListID)

        if (index < 0 || index >= classList.length) {
            return
        }

        state.classListIndex = index
        classList.selectedIndex = index
        state.currentClass = classList.options[index].text

        clearCurrentBBox()
    }

    const listenClassSelect = (classesListContainerID) => {
        const classList = document.getElementById(classesListContainerID)

        classList.addEventListener("change", () => {
            if (classList.selectedIndex < 0) {
                classList.selectedIndex = state.classListIndex
            } else {
                selectClass(classList.selectedIndex)
            }
        })
    }

    const listenBboxLoad = (bboxesContainerID) => {
        const bboxesElement = document.getElementById(bboxesContainerID)
    
        bboxesElement.addEventListener("click", () => {
            bboxesElement.value = null
        })
    
        bboxesElement.addEventListener("change", async (event) => {
            const files = Array.from(event.target.files)

            if (files.length === 0) {
                return
            }

            resetBboxes()

            // Each file reports its own errors, so the canvas is always redrawn at the end
            const needClasses = [].concat(...await mapLimit(files, fileReadConcurrency, loadAnnotationSource))

            if (needClasses.length > 0) {
                const more = needClasses.length > 10 ? `\n...and ${needClasses.length - 10} more` : ""

                console.warn("No classes loaded, so no boxes were read from:", needClasses)
                alert(`YOLO and VOC files need a classes file, but none is loaded. No boxes were read from ` +
                    `${needClasses.length} file(s). Load classes, then load the annotations again:\n\n` +
                    `${needClasses.slice(0, 10).join("\n")}${more}`)
            }

            refreshCanvas()
        })
    }

    // Reads one picked annotation file, or a zip of them.
    // Returns the names of files that were skipped because no classes are loaded (see storeBbox).
    const loadAnnotationSource = async (file) => {
        const extension = Formats.extensionOf(file.name)
        const needClasses = []

        if (extension === "txt" || extension === "xml" || extension === "json") {
            try {
                if (!storeBbox(file.name, await readText(file))) {
                    needClasses.push(file.name)
                }
            } catch (error) {
                alert(`Could not read ${file.name}: ${error.message}`)
            }

            return needClasses
        }

        let archive = null

        try {
            archive = await new JSZip().loadAsync(await readArrayBuffer(file))
        } catch (error) {
            alert(`Could not read ${file.name} as a zip archive: ${error.message}`)

            return needClasses
        }

        // Skip folders and macOS metadata (__MACOSX/, ._name)
        const entries = Object.keys(archive.files).filter((filename) => !archive.files[filename].dir &&
            !filename.startsWith("__MACOSX/") && !Formats.baseName(filename).startsWith("._"))
        const failed = []

        await Promise.all(entries.map(async (filename) => {
            try {
                // Match labels to images by file name, whatever folder they are in
                if (!storeBbox(Formats.baseName(filename), await archive.file(filename).async("string"))) {
                    needClasses.push(filename)
                }
            } catch (error) {
                failed.push(`${filename}: ${error.message}`)
            }
        }))

        if (failed.length > 0) {
            console.warn(`Could not read from ${file.name}:`, failed)
            alert(`Could not read ${failed.length} file(s) from ${file.name}:\n\n${failed.slice(0, 10).join("\n")}`)
        }

        return needClasses
    }

    const resetBboxes = () => {
        state.bboxes = {}
    }

    // Adds the boxes of one annotation file (.txt/.xml/.json, other files are ignored) to the loaded images.
    // Without a class list, a COCO file fills it from its categories. Returns false for a YOLO/VOC file of a
    // loaded image that was skipped because there are no classes to name its boxes.
    const storeBbox = (filename, text) => {
        const noClasses = Object.keys(state.classes).length === 0

        if (noClasses && Formats.extensionOf(filename) === "json") {
            setClassList(Formats.cocoClassNames(text))
        }

        const {boxes, unmatched} = Formats.parseAnnotationFile(filename, text, state.images, state.classes)

        if (noClasses && Formats.extensionOf(filename) !== "json" && Object.keys(boxes).length > 0) {
            return false
        }

        Object.keys(boxes).forEach((imageName) => {
            if (typeof state.bboxes[imageName] === "undefined") {
                state.bboxes[imageName] = {}
            }

            boxes[imageName].forEach((bbox) => {
                if (typeof state.bboxes[imageName][bbox.class] === "undefined") {
                    state.bboxes[imageName][bbox.class] = []
                }

                state.bboxes[imageName][bbox.class].push(bbox)
            })
        })

        if (unmatched > 0) {
            console.warn(`${filename}: skipped ${unmatched} annotation(s) whose image is not loaded`)
        }

        return true
    }

    const reportSkipped = (format, skipped) => {
        if (skipped.length === 0) {
            return
        }

        console.warn(`${format} export: skipped ${skipped.length} annotated image(s) not in the loaded image set:`,
            skipped)

        const shown = skipped.slice(0, 10).join("\n")
        const more = skipped.length > 10 ? `\n...and ${skipped.length - 10} more` : ""

        alert(`${format} export: skipped ${skipped.length} annotated image(s) that are not in the loaded image set ` +
            `(see console for the full list):\n\n${shown}${more}`)
    }

    // Warns about boxes left out because their class isn't in the loaded class list (see Formats.exportYolo)
    const reportUnknownClasses = (format, unknownClasses) => {
        const names = Object.keys(unknownClasses)

        if (names.length === 0) {
            return
        }

        const list = names.map((name) => `${name} (${unknownClasses[name]} box(es))`).join("\n")

        console.warn(`${format} export: skipped boxes with classes not in the loaded class list:`, unknownClasses)

        alert(`${format} export: skipped boxes whose class is not in the loaded class list:\n\n${list}`)
    }

    const downloadZip = (files, zipName) => {
        const zip = new JSZip()

        Object.keys(files).forEach((fileName) => zip.file(fileName, files[fileName]))

        zip.generateAsync({type: "blob"})
            .then((blob) => {
                saveAs(blob, zipName)
            })
    }

    const listenBboxSave = (saveBBoxesContainerID) => {
        document.getElementById(saveBBoxesContainerID).addEventListener("click", () => {
            const {files, skipped, unknownClasses} = Formats.exportYolo(state.bboxes, state.images, state.classes)

            reportSkipped("YOLO", skipped)
            reportUnknownClasses("YOLO", unknownClasses)
            downloadZip(files, "bboxes_yolo.zip")
        })
    }

    const listenBboxVocSave = (saveBBoxesVOCContainerID, vocFolderContainerID) => {
        document.getElementById(saveBBoxesVOCContainerID).addEventListener("click", () => {
            const folderPath = document.getElementById(vocFolderContainerID).value
            const {files, skipped} = Formats.exportVoc(state.bboxes, state.images, folderPath)

            reportSkipped("VOC", skipped)
            downloadZip(files, "bboxes_voc.zip")
        })
    }

    const listenBboxCocoSave = (saveBBoxesCOCOContainerID) => {
        document.getElementById(saveBBoxesCOCOContainerID).addEventListener("click", () => {
            const {files, skipped, unknownClasses} = Formats.exportCoco(state.bboxes, state.images, state.classes)

            reportSkipped("COCO", skipped)
            reportUnknownClasses("COCO", unknownClasses)
            downloadZip(files, "bboxes_coco.zip")
        })
    }


    const countBboxes = (bboxes) => {
        let images = 0
        let boxes = 0

        Object.values(bboxes || {}).forEach((imageBboxes) => {
            const count = Object.values(imageBboxes || {})
                .reduce((sum, classBboxes) => sum + (Array.isArray(classBboxes) ? classBboxes.length : 0), 0)

            if (count > 0) {
                images++
                boxes += count
            }
        })

        return {images, boxes}
    }

    const describeBackup = (backup, savedAt) => {
        const saved = savedAt ? new Date(savedAt) : null
        const when = saved && !isNaN(saved) ? saved.toLocaleString() : "unknown (saved by an older version)"
        const inBackup = countBboxes(backup)
        const current = countBboxes(state.bboxes)

        return "Restore the backup? It replaces all current boxes.\n\n" +
            `Backup taken: ${when}\n` +
            `Backup: ${inBackup.boxes} box(es) on ${inBackup.images} image(s)\n` +
            `Current: ${current.boxes} box(es) on ${current.images} image(s)`
    }

    const listenBboxRestore = (restoreBboxesContainerID) => {
        document.getElementById(restoreBboxesContainerID).addEventListener("click", () => {
            let backup = null
            let classNames = []

            try {
                backup = JSON.parse(localStorage.getItem("bboxes"))
                classNames = JSON.parse(localStorage.getItem("classes")) || []
            } catch (error) {
                alert(`Could not read the backup: ${error.message}`)

                return
            }

            if (backup === null) {
                alert("There is no backup in this browser yet.")

                return
            }

            if (!confirm(describeBackup(backup, localStorage.getItem("bboxesSavedAt")))) {
                return
            }

            // A loaded classes file wins over the backup's class list
            if (Object.keys(state.classes).length === 0) {
                if (classNames.length === 0) {
                    alert("This backup has no class list (it was saved by an older version). " +
                        "Load the classes file, then restore again.")

                    return
                }

                setClassList(classNames)
            }

            state.bboxes = backup
            state.currentBBox = null

            // The backup is shared by all image sets, so it may hold boxes for images that aren't loaded
            const unmatched = Object.keys(state.bboxes).filter((imageName) =>
                typeof state.images[imageName] === "undefined" &&
                Object.values(state.bboxes[imageName]).some((classBboxes) => classBboxes.length > 0))

            if (unmatched.length > 0) {
                const more = unmatched.length > 10 ? `\n...and ${unmatched.length - 10} more` : ""

                console.warn("Restored boxes for images that are not loaded:", unmatched)
                alert(`Restored boxes for ${unmatched.length} image(s) that are not in the loaded image set. ` +
                    `They are kept, but skipped on export:\n\n${unmatched.slice(0, 10).join("\n")}${more}`)
            }

            refreshCanvas()
        })
    }

    const listenKeyboard = (imageListContainerID, classListContainerID) => {
        const imageList = document.getElementById(imageListContainerID)
        const classList = document.getElementById(classListContainerID)
    
        document.addEventListener("keydown", (event) => {
            const target = event.target

            // Leave Delete/arrow keys to the field while typing (image search, VOC folder)
            if (target && (target.tagName === "TEXTAREA" ||
                (target.tagName === "INPUT" && /^(text|search)$/i.test(target.type)))) {
                return
            }

            const key = event.keyCode || event.charCode
            // Delete
            if (key === 46 || (key === 8 && event.metaKey === true)) {
                if (state.currentBBox !== null) {
                    const {bbox, index} = state.currentBBox

                    state.bboxes[state.currentImage.name][bbox.class].splice(index, 1)
                    state.currentBBox = null
                    document.body.style.cursor = "default"
                    canvas.remove(canvas.getActiveObject())
                }
                event.preventDefault()
            }
            // Arrow left/right: previous/next image, wrapping around
            if ((key === 37 || key === 39) && imageList.length > 1) {
                const step = key === 37 ? -1 : 1

                selectImage((state.imageListIndex + step + imageList.length) % imageList.length)
                document.body.style.cursor = "default"
            }
            // Arrow up/down: previous/next class, wrapping around
            if ((key === 38 || key === 40) && classList.length > 1) {
                const step = key === 38 ? -1 : 1

                selectClass((state.classListIndex + step + classList.length) % classList.length)
            }
            if (key >= 37 && key <= 40) {
                event.preventDefault()
            }
        })
    }

    const resetCanvasPlacement = () => {
        // @todo: when image changes we need to reset zooms/scales and etc.
    }

    const listenImageSearch = (imageSearchContainerID) => {
        document.getElementById(imageSearchContainerID).addEventListener("input", (event) => {
            const value = event.target.value
            const match = Object.keys(state.images).find((imageName) => imageName.indexOf(value) !== -1)

            if (typeof match !== "undefined") {
                selectImage(state.images[match].index)
            }
        })
    }

    const listenImageCrop = (cropImagesContainerID) => {
        document.getElementById(cropImagesContainerID).addEventListener("click", async () => {
            const {crops, skipped} = Formats.cropRegions(state.bboxes, state.images)
            const cropsByImage = {} // One decode per image, shared by all its crops
            const files = {}

            reportSkipped("Crop", skipped)

            if (crops.length === 0) {
                return
            }

            document.body.style.cursor = "wait" // Mark as busy

            crops.forEach((crop) => {
                cropsByImage[crop.imageName] = cropsByImage[crop.imageName] || []
                cropsByImage[crop.imageName].push(crop)
            })

            try {
                await mapLimit(Object.keys(cropsByImage), fileReadConcurrency, async (imageName) => {
                    const imageCrops = cropsByImage[imageName]
                    let imageObject = null

                    try {
                        imageObject = await loadImage(imageCrops[0].image.meta)
                    } catch (error) {
                        console.warn(`Crop: could not decode ${imageName}`)

                        return
                    }

                    for (const {image, bbox, fileName} of imageCrops) {
                        const temporaryCanvas = document.createElement("canvas")

                        temporaryCanvas.width = bbox.width
                        temporaryCanvas.height = bbox.height
                        temporaryCanvas.getContext("2d").drawImage(imageObject, bbox.x, bbox.y, bbox.width,
                            bbox.height, 0, 0, bbox.width, bbox.height)

                        const blob = await canvasToBlob(temporaryCanvas, image.meta.type)

                        if (blob !== null) {
                            files[fileName] = blob
                        } else {
                            console.warn(`Crop: empty crop ${fileName} skipped`)
                        }
                    }
                })
            } finally {
                document.body.style.cursor = "default"
            }

            downloadZip(files, "crops.zip")
        })
    }
})()
