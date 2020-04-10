/* global bodyPix, requestAnimationFrame */

const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const videoEl = document.getElementById('video');

let soundAlarm = true;
let visualAlarm = true;
let performance = "medium";
let showView = true;

// face: 110, 64, 170
// hands: 255, 0, 0
// others: 64, 64, 64

const colors = [
  [110, 64, 170],
  [110, 64, 170],
  [110, 64, 170],
  [210, 62, 167],
  [238, 67, 149],
  [255, 78, 125],
  [255, 94, 99],
  [255, 115, 75],
  [255, 140, 56],
  [239, 167, 47],
  [217, 194, 49],
  [194, 219, 64],
  [175, 240, 91],
  [135, 245, 87],
  [96, 247, 96],
  [64, 243, 115],
  [40, 234, 141],
  [28, 219, 169],
  [26, 199, 194],
  [33, 176, 213],
  [47, 150, 224],
  [65, 125, 224],
  [84, 101, 214],
  [99, 81, 195]
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
    p.addEventListener('change', (event) => { performance = event.target.value; });
  }

  const visualAlarmCheckBoxEl = document.getElementById('visualalarm');
  visualAlarmCheckBoxEl.checked = visualAlarm;
  visualAlarmCheckBoxEl.addEventListener('change', (event) => { visualAlarm = event.target.checked; });

  const soundAlarmCheckBoxEl = document.getElementById('soundalarm');
  soundAlarmCheckBoxEl.checked = soundAlarm;
  soundAlarmCheckBoxEl.addEventListener('change', (event) => { soundAlarm = event.target.checked; });

  const viewCheckBoxEl = document.getElementById('segmentationview');
  viewCheckBoxEl.checked = showView;
  viewCheckBoxEl.addEventListener('change', (event) => { showView = event.target.checked; });

  loop();
}

async function loop () {
  const segmentation = await net.segmentPersonParts(camera);
  // const multiPersonPartSegmentation = await estimatePartSegmentation();
  const coloredPartImageData = bodyPix.toColoredPartMask(segmentation);
  if (showView) { bodyPix.drawMask(canvas, camera, coloredPartImageData); }
  // console.log(segmentation);
  requestAnimationFrame(loop);
}

async function getVideo () {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
  videoEl.srcObject = stream;
  return new Promise((resolve) => {
    videoEl.onloadeddata = (event) => {
      videoEl.width = videoEl.videoWidth / 2;
      videoEl.height = videoEl.videoHeight / 2;
      resolve(videoEl);
    };
  });
}

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

setup();
