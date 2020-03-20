let bodypix;
let video;
let segmentation;

const options = {
    outputStride: 8, // 8, 16, or 32, default is 16
    segmentationThreshold: 0.5, // 0 - 1, defaults to 0.5 
}

function preload(){
    bodypix = ml5.bodyPix(options)
}

function setup() {
    createCanvas(320, 240);
    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();
    
    options.palette = bodypix.config.palette;
    Object.keys(options.palette).forEach(part => {
        const r = floor(random(255));
        const g = floor(random(255));
        const b = floor(random(255));
        options.palette[part].color = [r, g, b]
    });

    bodypix.segmentWithParts(video, gotResults, options)

}

function gotResults(err, result) {
    if (err) {
        console.log(err)
        return
    }
    segmentation = result;

    background(255, 0, 0);
    // image(video, 0, 0, width, height)
    image(segmentation.partMask, 0, 0, width, height)

    bodypix.segmentWithParts(video, gotResults, options)

}

