
const handThreshold = 200; // minimum amount of pixels of type hand visible
const faceThreshold = 100; // minimum amount of pixels of type face visible
const radius = 3; // radius in pixels around the hand pixel sampled to look for face pixels 

const options = {
    architecture: 'MobileNetV1',
    multiplier: 0.75, // 0 - 1, defaults to 0.75, higher is slower / more accurate
    outputStride: 16, // 8, 16, or 32, default is 16, higher is faster / less accurate
    segmentationThreshold: 0.5, // 0 - 1, defaults to 0.5 
}

let bodypix, checkboxSegmentation, checkboxSound, checkboxVisual, segmentation, radioPerformance, sliderThreshold, sound, uiDiv, video;
let hand = 0, face = 0;
let clicked = false;

function preload() {
    bodypix = ml5.bodyPix(options);
    sound = loadSound('assets/powerup.mp3');
}

function setup() {
    createCanvas(320, 240);

    uiDiv = createDiv();
    createP('Alerts you if you touch MEN Mouth Eyes Nose').parent(uiDiv);
    createSpan('Performance').parent(uiDiv);
    radioPerformance = createRadio().parent(uiDiv);
    radioPerformance.option('low');
    radioPerformance.option('medium');
    radioPerformance.selected('medium')
    radioPerformance.option('high');
    radioPerformance.style('width', '300px');
    radioPerformance.changed(switchPerformace);
    createSpan('Alarm').parent(uiDiv);
    checkboxVisual = createCheckbox('Visual', true).parent(uiDiv);
    checkboxSound = createCheckbox('Sound', true).parent(uiDiv);
    createSpan('Segmentation Threshold').parent(uiDiv);
    sliderThreshold = createSlider(0, 1, 0.5, 0).parent(uiDiv);
    checkboxSegmentation = createCheckbox('Show Segmentation', true).parent(uiDiv);

    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();
    bodypix.segmentWithParts(video, gotResults, options);
}

function switchPerformace(value) {
    const val = value.target.value;
    if (val === 'low') {
        options.multiplier = 0.25;
        options.outputStride = 32;
    } else if (val === 'medium') {
        options.multiplier = 0.5;
        options.outputStride = 16;
    } else if (val === 'high') {
        options.multiplier = 0.75;
        options.outputStride = 0;
    }

}

function alarm() {
    if (checkboxVisual.checked()) { background(255, 0, 0); }
    if (checkboxSound.checked()) { sound.play(); }
    console.log("alarm");
}

function touchStarted() { clicked = true; }
function mousePressed() { clicked = true; }

function gotResults(err, segmentation) {
    if (err) {
        console.log(err);
        return;
    }

    const leftHandId = segmentation.bodyParts.leftHand.id;
    const rightHandId = segmentation.bodyParts.rightHand.id;
    const leftFaceId = segmentation.bodyParts.leftFace.id;
    const rightFaceId = segmentation.bodyParts.rightFace.id;

    function isFace(pixel) { return pixel == leftHandId || pixel == rightHandId; }
    function isHand(pixel) { return pixel == leftFaceId || pixel == rightFaceId; }

    let h = segmentation.raw.partMask.height;
    let w = segmentation.raw.partMask.width;
    const current = segmentation.segmentation.data;

    // console.log(segmentation.segmentation.data);
    // TODO appears to be a BUG, segmentation data array seems to be fixed length 640 * 480 should be of size w * h ?
    // console.log(w, h, current.length, clicked);
    h = 480;
    w = 640;

    hand = 0;
    face = 0;

    if (checkboxSegmentation.checked()) {
        image(segmentation.partMask, 0, 0, width, height);
    } else {
        background(255, 255, 255);
    }

    for (const [i, v] of current.entries()) {
        if (isHand(v)) {
            hand++;

            if (hand > handThreshold && face > faceThreshold) { // minimum amount of hand / face pixels
                // crude but quick     
                let left = current[i - radius];
                let right = current[i + radius];
                let above = current[i - radius * w];   // TODO, see BUG above
                let below = current[i + radius * w];  // TODO, see BUG above

                if ((left && isFace(left)) || (right && isFace(right)) || (above && isFace(above)) || (below && isFace(below))) {
                    alarm();
                    break;
                }
            }

        }
        else if (isFace(v)) { face++; }
    }
    // image(video, 0, 0, width, height);

    if (!clicked) { // might need up to 2 clicks to start, focus the canvas and user interaction
        textAlign(CENTER, CENTER);
        textSize(width / 8);
        text('tap/click twice', width / 2, height / 2);
    }

    options.segmentationThreshold = sliderThreshold.value();
    bodypix.segmentWithParts(video, gotResults, options);
}

