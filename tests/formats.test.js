/* global module */
/* eslint camelcase: "off" */
// Unit tests for formats.js. Run with `node tests/run.js`, or open tests/index.html in a browser
// (the browser also runs the VOC import tests, which need DOMParser).
const defineFormatsTests = (Formats, test, assert) => {
    "use strict"

    const box = (x, y, width, height, className) => ({x, y, width, height, marked: false, class: className})
    const coords = (bbox) => [bbox.x, bbox.y, bbox.width, bbox.height]
    const classes = {boat: 0, powerboat: 1}
    const image = {width: 100, height: 200, index: 0}

    /* Classes */

    test("parseClasses ignores blank rows and surrounding spaces", () => {
        assert.equal(Formats.parseClasses("\r\n boat \r\n\r\n  \npowerboat\n"), ["boat", "powerboat"])
        assert.equal(Formats.parseClasses("\n  \n"), [])
    })

    test("readClassFile accepts one class name per line in .txt and .names", () => {
        assert.equal(Formats.readClassFile("classes.txt", "boat\npower boat\n3\n"),
            {classes: ["boat", "power boat", "3"]})
        assert.equal(Formats.readClassFile("obj.NAMES", "boat"), {classes: ["boat"]})
    })

    test("readClassFile points annotation files to the Bboxes field", () => {
        const errorOf = (fileName, text) => Formats.readClassFile(fileName, text).error || ""

        assert.ok(/COCO.*Bboxes/.test(errorOf("coco.json", "")), "json")
        assert.ok(/Bboxes/.test(errorOf("a.xml", "")), "xml")
        assert.ok(/Bboxes/.test(errorOf("labels.zip", "")), "zip")
        assert.ok(/Bboxes/.test(errorOf("a.txt", '{"images": []}')), "json content")
        assert.ok(/Bboxes/.test(errorOf("a.txt", "<annotation></annotation>")), "xml content")
        assert.ok(/YOLO.*Bboxes/.test(errorOf("a.txt", "0 0.5 0.5 0.2 0.1\n1 .25 0.5 1e-1 1\n")), "yolo")
    })

    test("readClassFile rejects other files, empty lists and duplicate names", () => {
        const errorOf = (fileName, text) => Formats.readClassFile(fileName, text).error || ""

        assert.ok(/\.txt or \.names/.test(errorOf("classes.csv", "boat")), "csv")
        assert.ok(/\.txt or \.names/.test(errorOf("a.jpg", "")), "image")
        assert.ok(/no class names/.test(errorOf("classes.txt", "\n \n")), "empty")
        assert.ok(/more than once.*: boat$/.test(errorOf("classes.txt", "boat\nbuoy\nboat\nboat")), "duplicates")
    })

    test("readClassFile reads the names of a YOLO data.yaml", () => {
        const dataYaml = "# YOLO Dataset Configuration\npath: /data/yolo_format\ntrain: images\nval: images\n" +
            "nc: 4\nnames:\n  0: seamark\n  1: boat\n  2: sailing_boat\n  3: ship\n"

        assert.equal(Formats.readClassFile("data.yaml", dataYaml),
            {classes: ["seamark", "boat", "sailing_boat", "ship"]})
        assert.equal(Formats.readClassFile("d.YML", "names:\r\n  1: boat # a comment\r\n  0: 'sea #mark'\r\nx: 1"),
            {classes: ["sea #mark", "boat"]}, "ids order the names, quotes and CRLF")
        assert.equal(Formats.readClassFile("d.yaml", "names:\n- boat\n- \"power boat\"\ntest: images"),
            {classes: ["boat", "power boat"]}, "block list")
        assert.equal(Formats.readClassFile("d.yaml", "nc: 3\nnames: ['boat', \"buoy\",\n  'a, b']"),
            {classes: ["boat", "buoy", "a, b"]}, "flow list over lines")
        assert.equal(Formats.readClassFile("d.yaml", "names: {0: boat, 1: buoy}"),
            {classes: ["boat", "buoy"]}, "flow map")
    })

    test("readClassFile rejects data.yaml files without usable names", () => {
        const errorOf = (text) => Formats.readClassFile("data.yaml", text).error || ""

        assert.ok(/^data\.yaml has no top-level `names:`/.test(errorOf("path: x\n  names: [a]")), "no names")
        assert.ok(/no class names/.test(errorOf("names: []")), "empty")
        assert.ok(/must be 0\.\.1/.test(errorOf("names:\n  0: boat\n  2: buoy")), "id gap")
        assert.ok(/must be 0\.\.1/.test(errorOf("names:\n  0: boat\n  0: buoy")), "repeated id")
        assert.ok(/aren't class ids/.test(errorOf("names:\n  boat: 0")), "names as keys")
        assert.ok(/mixes/.test(errorOf("names:\n  - boat\n  1: buoy")), "mixed")
        assert.ok(/nc: 3.*2 class/.test(errorOf("nc: 3\nnames: [boat, buoy]")), "nc mismatch")
        assert.ok(/no closing \]/.test(errorOf("names: [boat, buoy")), "unclosed")
        assert.ok(/without \[ \] or \{ \}/.test(errorOf("names: boat")), "scalar")
        assert.ok(/more than once.*: boat$/.test(errorOf("names: [boat, boat]")), "duplicates")
    })

    /* Class lists */

    test("remapClassesById renames boxes by class id and copies them", () => {
        const a = box(1, 1, 1, 1, "boat")
        const b = box(2, 2, 2, 2, "powerboat")
        const bboxes = {"a.jpg": {boat: [a], powerboat: [b], old: [box(3, 3, 3, 3, "old")]}, "b.jpg": {}}
        const result = Formats.remapClassesById(bboxes, classes, ["ship", "boat"])

        assert.equal(result.bboxes, {
            "a.jpg": {ship: [box(1, 1, 1, 1, "ship")], boat: [box(2, 2, 2, 2, "boat")], old: [box(3, 3, 3, 3, "old")]},
            "b.jpg": {}
        })
        assert.equal(result.renamed, [{from: "boat", to: "ship", count: 1}, {from: "powerboat", to: "boat", count: 1}])
        assert.equal(result.unmapped, {})
        assert.equal(bboxes["a.jpg"].boat, [a], "input unchanged")
        assert.equal(a.class, "boat", "input boxes unchanged")
    })

    test("remapClassesById keeps names past the end of the new list and merges into existing names", () => {
        const bboxes = {"a.jpg": {boat: [box(1, 1, 1, 1, "boat")], powerboat: [box(2, 2, 2, 2, "powerboat")]}}
        const result = Formats.remapClassesById(bboxes, classes, ["powerboat"])

        assert.equal(result.bboxes["a.jpg"].powerboat.map((bbox) => bbox.x), [1, 2])
        assert.equal(result.renamed, [{from: "boat", to: "powerboat", count: 1}])
        assert.equal(Formats.remapClassesById(bboxes, classes, ["ship"]).unmapped, {powerboat: 1})
        assert.equal(Formats.remapClassesById(bboxes, classes, ["boat", "powerboat"]).renamed, [], "same list")
    })

    /* YOLO import */

    test("parseYolo converts normalised centre/size rows to pixels", () => {
        const result = Formats.parseYolo("0 0.5 0.5 0.2 0.1\n1  0.25\t0.75 0.5 0.5\n", image, classes)

        assert.equal(result.map((bbox) => bbox.class), ["boat", "powerboat"])
        assert.close(coords(result[0]), [40, 90, 20, 20])
        assert.close(coords(result[1]), [0, 100, 50, 100])
        assert.equal(result[0].marked, false)
    })

    test("parseYolo skips unknown class ids and short rows", () => {
        const result = Formats.parseYolo("7 0.5 0.5 0.2 0.1\n0 0.5 0.5\n\n0 0.5 0.5 0.2 0.1", image, classes)

        assert.equal(result.length, 1)
    })

    test("parseYolo keeps full precision", () => {
        const [bbox] = Formats.parseYolo("0 0.412345 0.5 0.333 0.1", image, classes)

        assert.close(bbox.width, 33.3)
        assert.close(bbox.x, 41.2345 - 33.3 / 2)
    })

    /* VOC import */

    test("parseVoc reads objects of known classes", () => {
        const xml = "<annotation><object><name>boat &amp; ship</name><bndbox><xmin>10</xmin><ymin>20</ymin>" +
            "<xmax>30</xmax><ymax>60</ymax></bndbox></object><object><name>car</name><bndbox><xmin>1</xmin>" +
            "<ymin>1</ymin><xmax>2</xmax><ymax>2</ymax></bndbox></object></annotation>"

        assert.equal(Formats.parseVoc(xml, {"boat & ship": 0}), [box(10, 20, 20, 40, "boat & ship")])
    }, {needsDom: true})

    /* COCO import */

    test("parseCoco matches images by file name without folder and counts unmatched annotations", () => {
        const json = JSON.stringify({
            images: [{id: 7, file_name: "images/b.jpg"}, {id: 8, file_name: "missing.jpg"}],
            categories: [{id: 1, name: "powerboat"}, {id: 2, name: "car"}],
            annotations: [
                {image_id: 7, category_id: 1, bbox: [1, 2, 3, 4]},
                {image_id: 8, category_id: 1, bbox: [1, 2, 3, 4]},
                {image_id: 7, category_id: 2, bbox: [5, 6, 7, 8]}
            ]
        })
        const result = Formats.parseCoco(json, {"b.jpg": image}, classes)

        assert.equal(result, {boxes: {"b.jpg": [box(1, 2, 3, 4, "powerboat")]}, unmatched: 1})
    })

    test("parseCoco never puts a box on the wrong image", () => {
        const json = JSON.stringify({
            images: [{id: 1, file_name: "a.jpg"}, {id: 2, file_name: "gone.jpg"}],
            categories: [{id: 1, name: "boat"}],
            annotations: [
                {image_id: 1, category_id: 1, bbox: [1, 1, 1, 1]},
                {image_id: 2, category_id: 1, bbox: [9, 9, 9, 9]}
            ]
        })

        assert.equal(Formats.parseCoco(json, {"a.jpg": image}, classes).boxes, {"a.jpg": [box(1, 1, 1, 1, "boat")]})
    })

    /* Annotation files */

    test("parseAnnotationFile applies a .txt to every image with that name, scaled to each", () => {
        const images = {"a.jpg": image, "a.png": {width: 10, height: 20, index: 1}, "b.jpg": image}
        const result = Formats.parseAnnotationFile("a.TXT", "0 0.5 0.5 0.2 0.1", images, classes)

        assert.equal(Object.keys(result.boxes), ["a.jpg", "a.png"])
        assert.close(coords(result.boxes["a.png"][0]), [4, 9, 2, 2])
    })

    test("parseAnnotationFile returns an empty list for an empty label file (background image)", () => {
        assert.equal(Formats.parseAnnotationFile("a.txt", "", {"a.jpg": image}, classes),
            {boxes: {"a.jpg": []}, unmatched: 0})
    })

    test("parseAnnotationFile ignores other file types", () => {
        assert.equal(Formats.parseAnnotationFile("README.md", "# hi", {"README.jpg": image}, classes),
            {boxes: {}, unmatched: 0})
    })

    /* Clipping */

    test("clampBbox clips to the image and drops boxes outside it", () => {
        const original = box(-10, -20, 50, 60, "boat")

        assert.equal(Formats.clampBbox(original, image), {x: 0, y: 0, width: 40, height: 40})
        assert.equal(original.x, -10, "the stored box is not modified")
        assert.equal(Formats.clampBbox(box(60, 20, -20, 10, "boat"), image), {x: 40, y: 20, width: 20, height: 10})
        assert.equal(Formats.clampBbox(box(300, 300, 10, 10, "boat"), image), null)
    })

    /* YOLO export */

    test("exportYolo writes one normalised row per box, clipped to the image", () => {
        const bboxes = {"a.jpg": {boat: [box(40, 90, 20, 20, "boat"), box(-10, -20, 50, 60, "boat")],
            powerboat: [box(500, 500, 5, 5, "powerboat")]}}
        const {files} = Formats.exportYolo(bboxes, {"a.jpg": image}, classes)
        const rows = files["a.txt"].split("\n").map((row) => row.split(" ").map(Number))

        assert.equal(Object.keys(files), ["a.txt"])
        assert.close(rows[0], [0, 0.5, 0.5, 0.2, 0.1])
        assert.close(rows[1], [0, 0.2, 0.1, 0.4, 0.2])
        assert.equal(rows.length, 2, "box outside the image is dropped")
    })

    test("exportYolo writes an empty file for an annotated image without boxes", () => {
        assert.equal(Formats.exportYolo({"a.jpg": {}}, {"a.jpg": image}, classes).files, {"a.txt": ""})
    })

    test("exportYolo skips images that aren't loaded and boxes of unknown classes", () => {
        const bboxes = {"a.jpg": {boat: [box(1, 1, 5, 5, "boat")], old: [box(1, 1, 5, 5, "old")]},
            "stale.jpg": {boat: [box(1, 1, 5, 5, "boat")]}, "undecoded.jpg": {}}
        const images = {"a.jpg": image, "undecoded.jpg": {index: 1}}
        const result = Formats.exportYolo(bboxes, images, classes)

        assert.equal(Object.keys(result.files), ["a.txt"])
        assert.equal(result.files["a.txt"].split("\n").length, 1)
        assert.equal(result.skipped, ["stale.jpg", "undecoded.jpg"])
        assert.equal(result.unknownClasses, {old: 1})
    })

    test("YOLO export and import give back the same boxes", () => {
        const original = [box(12.5, 30.25, 40.125, 17, "powerboat"), box(0, 0, 100, 200, "boat")]
        const {files} = Formats.exportYolo({"a.jpg": {powerboat: [original[0]], boat: [original[1]]}},
            {"a.jpg": image}, classes)
        const loaded = Formats.parseYolo(files["a.txt"], image, classes)

        assert.equal(loaded.map((bbox) => bbox.class), ["powerboat", "boat"])
        loaded.forEach((bbox, i) => assert.close(coords(bbox), coords(original[i])))
    })

    /* VOC export */

    test("exportVoc escapes text and writes integer coordinates", () => {
        const bboxes = {"a&b.jpg": {"boat & ship": [box(10.4, 10.6, 20.2, 20.3, "boat & ship")]}}
        const xml = Formats.exportVoc(bboxes, {"a&b.jpg": image}, "<data>").files["a&b.xml"]

        assert.ok(xml.includes("<folder>&lt;data&gt;</folder>"), xml)
        assert.ok(xml.includes("<filename>a&amp;b.jpg</filename>"), xml)
        assert.ok(xml.includes("<name>boat &amp; ship</name>"), xml)
        assert.ok(xml.includes("<xmin>10</xmin>") && xml.includes("<ymin>11</ymin>") &&
            xml.includes("<xmax>31</xmax>") && xml.includes("<ymax>31</ymax>"), xml)
        assert.ok(xml.includes("<width>100</width>") && xml.includes("<height>200</height>"), xml)
    })

    test("exportVoc keeps any class name and writes no file for images without boxes", () => {
        const bboxes = {"a.jpg": {old: [box(1, 1, 5, 5, "old")]}, "b.jpg": {},
            "c.jpg": {boat: [box(900, 1, 5, 5, "boat")]}}
        const images = {"a.jpg": image, "b.jpg": image, "c.jpg": image}

        assert.equal(Object.keys(Formats.exportVoc(bboxes, images, "data").files), ["a.xml"])
    })

    test("VOC export and import give back the same boxes", () => {
        const original = box(10, 20, 30, 40, "boat")
        const {files} = Formats.exportVoc({"a.jpg": {boat: [original]}}, {"a.jpg": image}, "data")

        assert.equal(Formats.parseVoc(files["a.xml"], classes), [original])
    }, {needsDom: true})

    /* COCO export */

    test("exportCoco lists every loaded image and uses 1-based ids", () => {
        const images = {"a.jpg": image, "b.jpg": {width: 100, height: 200, index: 1},
            "c.jpg": {width: 50, height: 50, index: 2}}
        const bboxes = {"b.jpg": {powerboat: [box(10, 20, 30, 40, "powerboat")], old: [box(1, 1, 1, 1, "old")]}}
        const result = Formats.exportCoco(bboxes, images, classes)
        const json = JSON.parse(result.files["coco.json"])

        assert.equal(json.images.map((entry) => [entry.id, entry.file_name]),
            [[1, "a.jpg"], [2, "b.jpg"], [3, "c.jpg"]])
        assert.equal(json.categories, [{supercategory: "none", id: 1, name: "boat"},
            {supercategory: "none", id: 2, name: "powerboat"}])
        assert.equal(json.annotations, [{
            segmentation: [[10, 20, 10, 60, 40, 60, 40, 20]],
            area: 1200,
            iscrowd: 0,
            ignore: 0,
            image_id: 2,
            bbox: [10, 20, 30, 40],
            category_id: 2,
            id: 1
        }])
        assert.equal(result.unknownClasses, {old: 1})
    })

    test("COCO export and import give back the same boxes", () => {
        const images = {"a.jpg": image, "b.jpg": {width: 100, height: 200, index: 1}}
        const bboxes = {"a.jpg": {boat: [box(1, 2, 3, 4, "boat")]},
            "b.jpg": {powerboat: [box(5, 6, 7, 8, "powerboat")]}}
        const {files} = Formats.exportCoco(bboxes, images, classes)
        const result = Formats.parseCoco(files["coco.json"], images, classes)

        assert.equal(result, {boxes: {"a.jpg": bboxes["a.jpg"].boat, "b.jpg": bboxes["b.jpg"].powerboat}, unmatched: 0})
    })

    test("cocoClassNames orders categories by id and drops empty and repeated names", () => {
        const json = JSON.stringify({images: [], annotations: [], categories: [
            {id: 7, name: "buoy"}, {id: 1, name: "boat"}, {id: 3, name: ""}, {id: 4, name: "boat"}, {id: 2}
        ]})

        assert.equal(Formats.cocoClassNames(json), ["boat", "buoy"])
        assert.equal(Formats.cocoClassNames(JSON.stringify({images: [], annotations: []})), [])
    })

    test("cocoClassNames gives back the class list of exportCoco", () => {
        const {files} = Formats.exportCoco({}, {"a.jpg": image}, {buoy: 0, boat: 1, powerboat: 2})

        assert.equal(Formats.cocoClassNames(files["coco.json"]), ["buoy", "boat", "powerboat"])
    })

    /* Crop&Save */

    test("cropRegions names crops by class and position, skipping boxes outside the image", () => {
        const bboxes = {"a.jpg": {boat: [box(1, 1, 10, 10, "boat"), box(500, 500, 10, 10, "boat"),
            box(90, 190, 20, 20, "boat")]}, "stale.jpg": {boat: [box(1, 1, 10, 10, "boat")]}}
        const {crops, skipped} = Formats.cropRegions(bboxes, {"a.jpg": image})

        assert.equal(crops.map((crop) => [crop.fileName, crop.bbox]), [
            ["a-boat-0.jpg", {x: 1, y: 1, width: 10, height: 10}],
            ["a-boat-2.jpg", {x: 90, y: 190, width: 10, height: 10}]
        ])
        assert.equal(skipped, ["stale.jpg"])
    })

    /* File names */

    test("isImageFile and baseName", () => {
        assert.equal(["a.jpg", "b.PNG", "c.bmp", "d.txt", "e.jpg.txt", "f"].map(Formats.isImageFile),
            [true, true, true, false, false, false])
        assert.equal(["dir/a.txt", "dir\\a.txt", "a.txt"].map(Formats.baseName), ["a.txt", "a.txt", "a.txt"])
    })
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = defineFormatsTests
}
