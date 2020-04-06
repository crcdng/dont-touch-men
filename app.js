/* global requestAnimationFrame */

const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const videoEl = document.getElementById('video');

// face: 110, 64, 170
// hands: 255, 0, 0
// others: 64, 64, 64

const colors = [
  [110, 64, 170],
  [143, 61, 178],
  [178, 60, 178],
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
  loop();
}

async function loop () {
  const segmentation = await net.segmentPersonParts(camera);
  // const multiPersonPartSegmentation = await estimatePartSegmentation();
  const coloredPartImageData = bodyPix.toColoredPartMask(segmentation);
  bodyPix.drawMask(
    canvas, camera, coloredPartImageData);
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
