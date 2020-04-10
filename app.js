/* global AudioContext, bodyPix, requestAnimationFrame */
const DEBUG = true;

const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const videoEl = document.getElementById('video');

let soundAlarm = true;
let visualAlarm = true;
let performance = 'medium';
let showView = true;

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

let net, camera;

async function setup () {
  net = await bodyPix.load();
  camera = await getVideo();
  camera.play();

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
  const context = new AudioContext();
  const o = context.createOscillator();
  const g = context.createGain();
  g.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 3);
  o.type = 'sawtooth';
  o.frequency.value = 87.31;
  o.connect(g);
  g.connect(context.destination);
  o.start(0);
}

function alarm () {
  if (visualAlarm) {
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (soundAlarm) {
    buzz();
  }
  if (DEBUG) {
    console.log('alarm');
  }
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

window.AudioContext = window.AudioContext || window.webkitAudioContext;

setup();
