# 2026-10-08, v0.3.0
This release fixes exports and imports and makes loading more forgiving.

Added:
* COCO annotations can be loaded without a classes file: the class list is filled from the json's categories.
* The backup saves the class list too, so Restore only needs the images.
* Files that aren't class lists (COCO json, YOLO labels, ...) are refused by the Classes picker, with a hint
  to use Bboxes instead.
* Warnings for skipped data: boxes of images or classes that aren't loaded, images that fail to decode,
  unreadable annotation files.
* Unit tests for reading and writing annotation files (`tests/`).
* A spinner under Images from the moment the file picker opens, and a progress bar and counter while the
  selected images are read.
* Restore backup asks for confirmation first, showing when the backup was taken and how many boxes and images
  the backup and the current state have.
* The Classes picker reads a YOLO dataset yaml (`data.yaml`): its `names`, as an id map (`0: boat`) or a list
  (`- boat` or `[boat]`), become the class list. `nc`, if present, must match the number of names.
* Loading a class list with other names renames the existing boxes by class id (the old list's id N gets the
  new list's N-th name), after a confirmation that lists the renames. Boxes whose id isn't in the new list
  keep their name.


Changed:
* The canvas follows window resizes and browser zoom, and stays sharp after zooming in.
* A new box can be drawn while another one is selected; pressing inside a box selects it.
* Hints next to Classes and Restore; Save YOLO and Save COCO share a row; the side panel scrolls when needed.
* The image details and the box details share one line under the image list.
* The sidebar can be resized by dragging its border (double-click resets it); the width is remembered.
* A malformed VOC file adds none of its boxes. `.csv` class files are no longer offered (they were never read).
* Annotation file parsing and export moved into `formats.js`.
* Zooming with the scroll wheel is twice as fast (`wheelZoomSpeed` in `index.js`).
* Boxes have no cross in the middle anymore.
* Boxes are colored by class (the bright tab20 colors): the 2 px border, centered on the box edge, the
  translucent fill (20 % opacity, `fillOpacity` in `index.js`) and the label background share the color, so the
  label is a tab on the box. The selected box turns to the light variant of its color instead of red and
  orange. Label text is black or white, whichever reads better on the color.
* From opening the Images picker until the images are read, every other control is disabled. Opening another
  file picker while a Flatpak browser is still exporting the images through its document portal hangs the
  browser.

Fixed:
* Resizing a box no longer scales the width of its border.
* Save YOLO/VOC/COCO and Crop&Save did nothing if the boxes referred to an image that isn't loaded.
* COCO import could put boxes on the wrong image, or stop at an annotation of an unloaded image.
* COCO annotations whose `file_name` includes a folder were not matched.
* Exported boxes are clipped to the image; VOC text is escaped and coordinates are integers.
* YOLO labels are read without rounding and tolerate extra spaces; blank rows in a classes file no longer shift ids.
* Annotation zips with folders, and upper-case file extensions, load correctly.
* Switching images quickly or loading a new image set no longer shows the wrong image.
* One image that fails to decode no longer stops the rest from loading.
* Delete and arrow keys no longer act on boxes and images while typing in a text field.
* After a page reload, Firefox no longer shows the previous file selection or enables Bboxes and Restore
  while no images are loaded.
* Delete no longer removes a box that was already deselected.
* Image names with `&` and other special characters work in the image list.
* Ctrl+click on the selected image or class no longer breaks the arrow keys.
* The canvas redraws after Restore and after loading annotations, even if some files fail.
* Loading hundreds of images, annotation files, or Crop&Save no longer opens every file at once, which could
  freeze the browser (especially Flatpak/Snap browsers or with an on-access virus scanner). Files are read four
  at a time, and Crop&Save releases each decoded image when its crops are done.
* The label of a box drawn right to left or bottom to top stayed at the starting corner until the image was
  changed.

# 2024-03-01, v0.2.6
Since v0.2.5 this fork switched to FabricJS, updated jszip and FileSaver.js, and added BMP images (see README.md).

# 2019-12-02, v0.2.5
Renamed project to make it more fit for professional environment.
Replaced sample image.

# 2019-04-08, v0.2.4
* Fixed VOC format not exporting objects correctly.
* Updated copyrights.

# 2018-12-31, v0.2.3
* Fixed a potential bbox shift when loading bboxes from file.

# 2018-12-31, v0.2.2
* Fixed a warning if Recovery is not supported.
* Added missing changelog from last time :)

# 2018-12-30, v0.2.1
* Added a warning if Recovery is not supported.

# 2018-06-26, v0.2.0
* **NEW! Basic Pascal VOC and COCO format support. EXPERIMENTAL!**
* Some text clarifications.
* Fixed a bug with uppercase extension names on images not working.

# 2018-06-24, v0.1.9
* Fixed issue with newlines in classes for different OS.

# 2018-03-16, v0.1.8
* Some minor refactoring.
* Added ability to fit image into screen. Configurable.
* Fixed bug with images resetting upon not selecting anything from file window.
* Added detailed explanations on the configurable parameters.

# 2018-03-13, v0.1.7
* Changed middle dot to a cross sign. Also made it configurable.
* Added guidelines for cursor. Configurable.
* Updated README.md.

# 2018-03-04, v0.1.6
* Fixed bbox dimension display being affected by zoom.
* Added a middle dot in bboxes for easier center approximation.

# 2018-03-01, v0.1.5
* Fixed canvas not resetting on image mouse select.
* Fixed classes and bboxes not reloading on selecting the same files.
* Added image and current bbox information.
* Updated README.md.

# 2018-02-19, v0.1.4
* Fixed bbox select form name. Not sure if it caused problems.
* Made sure cursor is shown as busy upon crop. (Doesn't work properly - this needs a proper "wait" spinner).
* Fixed crops not working on Linux.
* Updated README.md.

# 2018-02-18, v0.1.3
MAJOR:
* Added ability to crop and saves images from bboxes (experimental).
* Added FileSaver to better handle file downloading.
* Fixed issue where MacBook DELETE key wouldn't work.

MINOR:
* Renamed labels.zip to bboxes.zip.
* Updated screenshot to reflect changes.
* Fixed previous version CHANGELOG typo.
* Added version to footer.

# 2018-02-17, v0.1.2

* Fixed CHANGELOG formatting.
* Fixed select box not auto scrolling to selection.
* Made sure coordinate pixels are without decimal point.
* Canvas now resets on image change to original zoom and position (can be turned off).
* Implemented rudimentary image search by name.
* Added ability to upload unzipped and/or multiple bboxes.
* Fixed mouse cursor not resetting on bbox delete.
* Updated README.md and screenshot to reflect changes.
    
# 2018-02-15, v0.1.1

* Fixed, so that canvas left offset doesn't cause misplacement of bboxes.
* Fixed, that errors won't be thrown in console if image doesn't exist for a bbox.

# 2018-02-14, v0.1.0

* Initial release
