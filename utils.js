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

// Promise wrappers for file loading, so callers can use async/await
const readFile = (file, method) => new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener("load", () => resolve(reader.result))
    reader.addEventListener("error", () => reject(reader.error || new Error(`Could not read ${file.name}`)))
    reader[method](file)
})

const readText = (file) => readFile(file, "readAsText")

const readArrayBuffer = (file) => readFile(file, "readAsArrayBuffer")

// Decodes an image file into an <img>; rejects if the browser can't decode it
const loadImage = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.addEventListener("load", () => {
        URL.revokeObjectURL(url)
        resolve(image)
    })
    image.addEventListener("error", () => {
        URL.revokeObjectURL(url)
        reject(new Error(`Could not decode ${file.name}`))
    })
    image.src = url
})

const canvasToBlob = (canvas, type) => new Promise((resolve) => canvas.toBlob(resolve, type))

// How many picked files are read at once. Opening hundreds in parallel can stall the browser, especially when
// files go through a sandbox file portal (Flatpak/Snap) or an on-access virus scanner.
const fileReadConcurrency = 4

// Like Promise.all(items.map(worker)), but with at most `limit` workers running at a time
const mapLimit = async (items, limit, worker) => {
    const results = new Array(items.length)
    let next = 0

    const run = async () => {
        while (next < items.length) {
            const index = next

            next += 1
            results[index] = await worker(items[index], index)
        }
    }

    await Promise.all(Array.from({length: Math.min(limit, items.length)}, run))

    return results
}
