p5.disableFriendlyErrors = true;

const DEBUG = true; // switch console.log
const handPixelThreshold = 20; // minimum amount of pixels of type hand visible
const facePixelThreshold = 200; // minimum amount of pixels of type face visible
const radius = 5; // radius in pixels around the hand pixel sampled to look for face pixels

const options = {
  architecture: "MobileNetV1",
  multiplier: 0.75, // 0 - 1, defaults to 0.75, higher is slower / more accurate
  outputStride: 16, // 8, 16, or 32, default is 16, higher is faster / less accurate
  segmentationThreshold: 0.5, // 0 - 1, defaults to 0.5
  palette: {
    leftFace: {
      id: 0,
      color: [110, 64, 170]
    },
    rightFace: {
      id: 1,
      color: [110, 64, 170]
    },
    rightUpperLegFront: {
      id: 2,
      color: [64, 64, 64]
    },
    rightLowerLegBack: {
      id: 3,
      color: [64, 64, 64]
    },
    rightUpperLegBack: {
      id: 4,
      color: [64, 64, 64]
    },
    leftLowerLegFront: {
      id: 5,
      color: [64, 64, 64]
    },
    leftUpperLegFront: {
      id: 6,
      color: [64, 64, 64]
    },
    leftUpperLegBack: {
      id: 7,
      color: [64, 64, 64]
    },
    leftLowerLegBack: {
      id: 8,
      color: [64, 64, 64]
    },
    rightFeet: {
      id: 9,
      color: [64, 64, 64]
    },
    rightLowerLegFront: {
      id: 10,
      color: [64, 64, 64]
    },
    leftFeet: {
      id: 11,
      color: [64, 64, 64]
    },
    torsoFront: {
      id: 12,
      color: [64, 64, 64]
    },
    torsoBack: {
      id: 13,
      color: [64, 64, 64]
    },
    rightUpperArmFront: {
      id: 14,
      color: [64, 64, 64]
    },
    rightUpperArmBack: {
      id: 15,
      color: [64, 64, 64]
    },
    rightLowerArmBack: {
      id: 16,
      color: [64, 64, 64]
    },
    leftLowerArmFront: {
      id: 17,
      color: [64, 64, 64]
    },
    leftUpperArmFront: {
      id: 18,
      color: [64, 64, 64]
    },
    leftUpperArmBack: {
      id: 19,
      color: [64, 64, 64]
    },
    leftLowerArmBack: {
      id: 20,
      color: [64, 64, 64]
    },
    rightHand: {
      id: 21,
      color: [255, 0, 0]
    },
    rightLowerArmFront: {
      id: 22,
      color: [64, 64, 64]
    },
    leftHand: {
      id: 23,
      color: [255, 0, 0]
    }
  }
};

let bodypix,
  checkboxSegmentationView,
  checkboxSound,
  checkboxVisual,
  envelope,
  performance,
  segmentation,
  radioPerformance,
  sliderSegmentationThreshold,
  sound,
  uiDiv,
  video;
let facePixels = 0,
  handPixels = 0,
  soundFrequency = 189;

function preload() {
  bodypix = ml5.bodyPix(video, modelReady, options);
}

function modelReady () {
  bodypix.segmentWithParts(video, options, gotResults);
}

function setup() {
  createCanvas(320, 240).parent("canvas-area");
  radioPerformance = selectAll(".performance");
  for (let i = 0; i < radioPerformance.length; i++) {
    let p = radioPerformance[i];
    if (p.elt.hasAttribute("checked")) {
      performance = p.elt.value;
    }
    p.changed(switchPerformance);
  }
  checkboxVisual = select("#visualalarm");
  checkboxSound = select("#soundalarm");
  sliderSegmentationThreshold = select("#segmentationthreshold");
  checkboxSegmentationView = select("#segmentationview");

  sound = new p5.SawOsc();
  envelope = new p5.Env();
  envelope.setADSR(0.001, 0.6, 0.1, 0.5);
  envelope.setRange(1, 0);
  sound.freq(soundFrequency);

  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
}

function switchPerformance(value) {
  performance = value.target.value;
  if (performance === "low") {
    options.multiplier = 0.25;
    options.outputStride = 32;
  } else if (performance === "medium") {
    options.multiplier = 0.5;
    options.outputStride = 16;
  } else if (performance === "high") {
    options.multiplier = 0.75;
    options.outputStride = 0;
  }
}

function alarm() {
  if (checkboxVisual.checked()) {
    background(255, 0, 0);
  }
  if (checkboxSound.checked()) {
    sound.start();
    envelope.play(sound, 0, 0.1);
  }
  if (DEBUG) {
    console.log("alarm");
  }
}

function gotResults(err, segmentation) {
  if (err) {
    console.log(err);
    return;
  }

  const leftHandId = segmentation.bodyParts.leftHand.id;
  const rightHandId = segmentation.bodyParts.rightHand.id;
  const leftFaceId = segmentation.bodyParts.leftFace.id;
  const rightFaceId = segmentation.bodyParts.rightFace.id;

  function isHand(pixel) {
    return pixel == leftHandId || pixel == rightHandId;
  }

  function isFace(pixel) {
    return pixel == leftFaceId || pixel == rightFaceId;
  }

  const h = segmentation.segmentation.height;
  const w = segmentation.segmentation.width;
  const current = segmentation.segmentation.data;

  if (checkboxSegmentationView.checked()) {
    image(segmentation.partMask, 0, 0, width, height);
  } else {
    background(255, 255, 255);
  }

  handPixels = 0;
  facePixels = 0;
  for (const [i, v] of current.entries()) {
    if (isHand(v)) {
      handPixels++;

      let modulo;
      if (performance === "low") {
        modulo = 10;
      } else if (performance === "medium") {
        modulo = 5;
      } else if (performance === "high") {
        modulo = 2;
      }

      if (
        !(i % modulo === 0) ||
        handPixels < handPixelThreshold ||
        facePixels < facePixelThreshold
      ) {
        continue;
      }

      // minimum amount of hand / face pixels
      // crude but quick
      let left = current[i - radius];
      let right = current[i + radius];
      let top = current[i - radius * w]; // TODO, see BUG above
      let bottom = current[i + radius * w]; // TODO, see BUG above

      let topleft = current[i - radius * w - radius];
      let topright = current[i - radius * w + radius];
      let bottomleft = current[i + radius * w - radius];
      let bottomright = current[i + radius * w + radius];

      if (
        (left && isFace(left)) ||
        (right && isFace(right)) ||
        (top && isFace(top)) ||
        (bottom && isFace(bottom)) ||
        (topleft && isFace(topleft)) ||
        (topright && isFace(topright)) ||
        (bottomleft && isFace(bottomleft)) ||
        (bottomright && isFace(bottomright))
      ) {
        alarm();
        break;
      }
    } else if (isFace(v)) {
      facePixels++;
    }
  }

  options.segmentationThreshold = sliderSegmentationThreshold.value();
  bodypix.segmentWithParts(video, options, gotResults);
}
