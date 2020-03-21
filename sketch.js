let bodypix;
let video;
let segmentation;
let hand = 0, face = 0;
let clicked = false;

const options = {
    architecture: 'MobileNetV1',
    multiplier: 0.75, // 0 - 1, defaults to 0.75, higher is slower / more accurate
    outputStride: 16, // 8, 16, or 32, default is 16, higher is faster / less accurate
    segmentationThreshold: 0.75, // 0 - 1, defaults to 0.5 
}

function preload(){
    bodypix = ml5.bodyPix(options);
}

function setup() {
    createCanvas(320, 240);
    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();

    bodypix.segmentWithParts(video, gotResults, options);
}

function touchStarted() { clicked = true; }
function mousePressed()  { clicked = true; }

function gotResults(err, segmentation) {
    if (err) { 
        console.log(err);
        return;
    }

    // console.log(segmentation.segmentation.data);
    const leftHandId = segmentation.bodyParts.leftHand.id;
    const rightHandId = segmentation.bodyParts.rightHand.id;
    const leftFaceId = segmentation.bodyParts.leftFace.id;
    const rightFaceId = segmentation.bodyParts.rightFace.id;
    
    const h = segmentation.raw.partMask.height;
    const w = segmentation.raw.partMask.width;
    const current = segmentation.segmentation.data;
    // appears to be a BUG, dimensions dont match, the array should be of size w * h
    // console.log(w, h, current.length, clicked);

    hand = 0;
    face = 0;
    
    for (let i of current) {
        // console.log(i);

        // false positives galore 
        if (i == leftHandId || i == rightHandId) {
            hand++;
        }
        if (i == leftFaceId || i == rightFaceId) {
            face++;
        }
        
    }
    
    console.log(hand, face);
    background(255, 0, 0);
    // image(video, 0, 0, width, height);
    image(segmentation.partMask, 0, 0, width, height);

    if (!clicked) { // might need up to 2 clicks to start, focus the canvas and user interaction
        textAlign(CENTER, CENTER);
        textSize(width / 8);
        text('tap/click twice', width/2, height/2);
    }

    bodypix.segmentWithParts(video, gotResults, options);
}

