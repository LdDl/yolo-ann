# YOLO BBox Annotation Tool

https://lddl.github.io/yolo-ann/

Fork of https://github.com/drainingsun/ybat

Fast and efficient BBox annotation for your images in YOLO, and now, VOC/COCO formats!

## USAGE

### Online

1. Navigate to https://lddl.github.io/yolo-ann/
2. Load images and classes and start bboxing!

### Offline

<details>
<summary>Click to expand</summary>

1. Download repository

    ```shell
    git clone https://github.com/LdDl/yolo-ann.git
    ```

2. Navigate to root folder

    ```shell
    cd yolo-ann
    ```

3. Open `index.html` in your browser.

4. Load images and classes and start bboxing!
</details>

UI should look something like this:

<img src="cute.png" width="720">

## CONFIGURATION
1. Open index.js.
2. Edit section named `parameters`.

## COMPATIBILITY
All browsers that support ES6 should work. Tested with:

* Chrome v65
* Firefox v58
* Safari v11
* Opera v51

No idea about IE/Edge.

## Dependencies 

|Package|Notes|Licence|
|-------|-----|-------|
|[FileSaver.js](https://github.com/eligrey/FileSaver.js)| - |[FileSaver.js license](https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md)|
|[jszip](https://stuk.github.io/jszip)| - |[MIT](https://github.com/Stuk/jszip/blob/main/LICENSE.markdown)|
|[canvas.min.js](https://github.com/LdDl/yolo-ann/blob/master/canvas.min.js)| Help me to find out what is the source...Original repository doesn't have info either |???|

## FEATURES
* Basic Pascal VOC and COCO format support.
* Works in your browser on any platform.
* Complete YOLO format support.
* No need for image upload - everything is done locally!
* Zooming and panning images with guidelines for precise bboxing.
* Fast navigation for quick bboxing.
* Auto save in memory in case of accidental refreshes and crashes.
* Ability to crop your bboxes and save the resulting images.
* Information on both image and current bbox.

## CAVEATS
* Loading many and or big images might take a while. This is because tool needs to figure out image dimensions.  
* Cropping many items might crash your browser. This and above will be fixed at some point.

## CONTRIBUTING
Go nuts! Just don't forget to follow eslint guidelines. Credit will be given where it's due.