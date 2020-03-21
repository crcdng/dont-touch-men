
const handThreshold = 200; // minimum amount of pixels of type hand visible
const faceThreshold = 100; // minimum amount of pixels of type face visible
const radius = 3; // radius in pixels around the hand pixel sampled to look for face pixels 

const options = {
    architecture: 'MobileNetV1',
    multiplier: 0.75, // 0 - 1, defaults to 0.75, higher is slower / more accurate
    outputStride: 16, // 8, 16, or 32, default is 16, higher is faster / less accurate
    segmentationThreshold: 0.5, // 0 - 1, defaults to 0.5 
}

let bodypix, segmentation, sliderPerformance, sliderThreshold, sound, video;
let hand = 0, face = 0;
let clicked = false;

function preload () {
    bodypix = ml5.bodyPix(options);
    sound = loadSound('assets/powerup.mp3');
}

function setup () {
    createCanvas(320, 240);
    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();
    bodypix.segmentWithParts(video, gotResults, options);
}

function alarm () {
    background(255,0,0);
    sound.play();
    console.log("alarm");
}

function touchStarted () { clicked = true; }
function mousePressed ()  { clicked = true; }

function gotResults (err, segmentation) {
    if (err) { 
        console.log(err);
        return;
    }

    const leftHandId = segmentation.bodyParts.leftHand.id;
    const rightHandId = segmentation.bodyParts.rightHand.id;
    const leftFaceId = segmentation.bodyParts.leftFace.id;
    const rightFaceId = segmentation.bodyParts.rightFace.id;
    
    function isFace (pixel) { return pixel == leftHandId || pixel == rightHandId; } 
    function isHand (pixel) {  return pixel == leftFaceId || pixel == rightFaceId; } 
  
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

    image(segmentation.partMask, 0, 0, width, height);

    for (const [i, v] of current.entries()) {
        if (v == leftHandId || v == rightHandId) {
            hand++;

            if (hand > handThreshold && face > faceThreshold) { // minimum amount of hand / face pixels
                // crude but quick     
                let left = current[i-radius];
                let right = current[i+radius];
                let above = current[i-radius*w];   // TODO, see BUG above
                let below = current[i+radius*w];  // TODO, see BUG above
                                
                if ((left && isFace(left)) || (right && isFace(right)) || (above && isFace(above)) || (below && isFace(below))) {
                    alarm();
                    break;
                }
            }
    
        }
        if (v == leftFaceId || v == rightFaceId) {
            face++;
        }        
    }
    // image(video, 0, 0, width, height);

    if (!clicked) { // might need up to 2 clicks to start, focus the canvas and user interaction
        textAlign(CENTER, CENTER);
        textSize(width / 8);
        text('tap/click twice', width/2, height/2);
    }

    bodypix.segmentWithParts(video, gotResults, options);
}

