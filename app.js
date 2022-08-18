/* global bodyPix, requestAnimationFrame, Tone */
const DEBUG = true;

const canvas = document.getElementById('output');
const videoEl = document.getElementById('video');

const mediaConfig = {
  audio: false, video: { width: 320, height: 240, facingMode: 'user' }
};

const config = {
  flipHorizontal: true,
  internalResolution: 'medium',
  segmentationThreshold: 0.7
};

const colors = [
  [110, 64, 170], [110, 64, 170], [64, 64, 64], [64, 64, 64],
  [64, 64, 64], [64, 64, 64], [64, 64, 64], [64, 64, 64],
  [64, 64, 64], [64, 64, 64], [2255, 0, 0], [255, 0, 0],
  [64, 64, 64], [64, 64, 64], [64, 64, 64], [64, 64, 64],
  [64, 64, 64], [64, 64, 64], [64, 64, 64], [64, 64, 64],
  [64, 64, 64], [64, 64, 64], [64, 64, 64], [64, 64, 64]
];

let soundAlarm = true;
let visualAlarm = true;
let performance = 'medium';
let showView = true;
let net, camera, synth;

async function setup () {
  net = await bodyPix.load();
  camera = await getVideo();
  camera.play();
  synth = new Tone.Synth().toMaster();
  const performanceRadioEls = document.querySelectorAll('input[name="performance"]');
  for (let i = 0; i < performanceRadioEls.length; i++) {
    const p = performanceRadioEls[i];
    if (p.hasAttribute('checked')) {
      performance = p.value;
    }
    p.addEventListener('change', (event) => {
      performance = event.target.value;
      config.internalResolution = performance;
    });
  }

  const visualAlarmCheckBoxEl = document.getElementById('visualalarm');
  visualAlarmCheckBoxEl.checked = visualAlarm;
  visualAlarmCheckBoxEl.addEventListener('change', (event) => { visualAlarm = event.target.checked; });

  const soundAlarmCheckBoxEl = document.getElementById('soundalarm');
  soundAlarmCheckBoxEl.checked = soundAlarm;
  soundAlarmCheckBoxEl.addEventListener('change', (event) => { soundAlarm = event.target.checked; });

  const viewCheckBoxEl = document.getElementById('segmentationview');
  viewCheckBoxEl.checked = showView;
  viewCheckBoxEl.addEventListener('change', (event) => {
    const checked = event.target.checked;
    showView = checked;
    canvas.style.visibility = (event.target.checked ? 'visible' : 'hidden');
  });
  
  setTimeout(sayIt(), 2000);
  loop();
}

async function loop () {
  const segmentation = await net.segmentPersonParts(camera, config);

  // values see https://github.com/tensorflow/tfjs-models/tree/master/body-pix#person-body-part-segmentation
  const leftHandId = 10;
  const rightHandId = 11;
  const leftFaceId = 0;
  const rightFaceId = 1;

  function isHand (pixel) {
    return pixel == leftHandId || pixel == rightHandId; // == on purpose
  }

  function isFace (pixel) {
    return pixel == leftFaceId || pixel == rightFaceId; // == on purpose
  }

  const coloredPartImageData = bodyPix.toColoredPartMask(segmentation, colors);
  if (showView) { bodyPix.drawMask(canvas, camera, coloredPartImageData); }

  const current = segmentation.data;
  const w = segmentation.width;
  const radius = 5;
  for (const [i, v] of current.entries()) {
    if (isHand(v)) {
      // crude but quick
      const left = current[i - radius];
      const right = current[i + radius];
      const top = current[i - radius * w]; // TODO, see BUG above
      const bottom = current[i + radius * w]; // TODO, see BUG above

      const topleft = current[i - radius * w - radius];
      const topright = current[i - radius * w + radius];
      const bottomleft = current[i + radius * w - radius];
      const bottomright = current[i + radius * w + radius];

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
    }
  }

  requestAnimationFrame(loop);
}

function buzz () {
  synth.triggerAttackRelease('D3', '8n');
}

function visual (c) {
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.font = 'bold 50px Arial';
  ctx.fillText('DON\'T', c.width / 2, c.height / 4);
  ctx.fillText('TOUCH', c.width / 2, c.height / 2);
  ctx.fillText('MEN', c.width / 2, 3 * c.height / 4);
}

function alarm () {
  if (visualAlarm) {
    visual(canvas);
  }
  if (soundAlarm) {
    buzz();
  }
  if (DEBUG) {
    console.log('alarm');
  }
}

function sayIt(){
  console.log("Saying")
  let speech = new SpeechSynthesisUtterance();
  speech.lang = "en-US";
  
  speech.text = "Please don't touch your face";
  speech.volume = 1;
  speech.rate = 1;
  speech.pitch = 1;
  
  window.speechSynthesis.speak(speech);
}

async function getVideo () {
  const stream = await navigator.mediaDevices.getUserMedia(mediaConfig);
  videoEl.srcObject = stream;
  return new Promise((resolve) => {
    videoEl.onloadeddata = (event) => {
      videoEl.width = videoEl.videoWidth;
      videoEl.height = videoEl.videoHeight;
      resolve(videoEl);
    };
  });
}

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

window.onload = setup;
