
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.117/build/three.module.js";

import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.117/examples/jsm/postprocessing/UnrealBloomPass.js";
import { SMAAPass } from "https://cdn.jsdelivr.net/npm/three@0.117/examples/jsm/postprocessing/SMAAPass.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.117/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.117/examples/jsm/postprocessing/RenderPass.js";

import { AfterimagePass } from "./AfterimagePass.js";
import { TTFLoader } from './TTFLoader.js';


// STATE

let camera;
let scene;
let renderer;
let composer;
let material;


// CONFIGURATION

const text = "BLACK\nLIVES\nMATTER";
const curveSegments = 4;
const sizes = new Map([
    [0, 50],
    [480, 75],
    [768, 112.5],
    [1200, 168.75]
]);


const dampening = 0.993;
const columnSize = 128;
const strokeSize = 5;
const cutoff = 0.449;

const bloomStrength = 0.21;
const bloomRadius = 0.1;
const bloomThreshold = 0.85;

const useDevicePixel = false;

init();

/**
 * Initialization logic.
 */
async function init() {
    // create a container element and add it to the body
    const container = document.createElement("div");
    document.body.appendChild(container);

    // get the width and height from the window
    const { innerWidth: width, innerHeight: height } = window;

    // CAMERA
    // create an otherohrapgic camera with the dimentions of the window
    camera = new THREE.OrthographicCamera(
        width / -2, 
        width / 2, 
        height / 2, 
        height / -2, 
        1, 
        1500);

    // put the camera 700 away from the center and point at the center
    camera.position.set(0, 0, 700);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // SCENE
    // create a scene with a white background
    scene = new THREE.Scene;
    scene.background = new THREE.Color(0xFFFFFF);

    // fetch both shaders at the same time
    const [ fragmentShader, vertexShader ] = await Promise.all([
        fetch("bars.frag.glsl").then(res => res.text()),
        fetch("bars.vert.glsl").then(res => res.text())
    ]);

    // create the black bar material
    material = new THREE.ShaderMaterial({
        uniforms: {
            u_time: { value: Date.now() },
            u_resolution: { value: new THREE.Vector2(width, height) },
            u_column_size: { value: columnSize },
            u_stroke_size: { value: strokeSize }
        },

        fragmentShader,
        vertexShader
    });

    // load the font and add it to the scene
    const loader = new TTFLoader;
    loader.load("WorkSans-Black.ttf", json => {
        const font = new THREE.Font(json);
        scene.add(makeTextMesh(text, font));
    });

    // RENDERER

    // create the renderer with antialiasing
    renderer = new THREE.WebGLRenderer({ antialias: true });

    // if we're using device pixels, set the renderer to do so
    if (useDevicePixel) renderer.setPixelRatio(window.devicePixelRatio);

    // set the renderer size to the window size
    renderer.setSize(width, height);

    // add the canvas element to the container
    container.appendChild(renderer.domElement);

    // POSTPROCESSING
    // create a bloom pass
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2( width, height ),
        bloomStrength,
        bloomRadius,
        bloomThreshold);

    // create the pipeline
    composer = new EffectComposer(renderer);
    // add the initial render
    composer.addPass(new RenderPass(scene, camera));
    // add SMAA anti-aliasing
    composer.addPass(new SMAAPass(
        width * renderer.getPixelRatio(),
        height * renderer.getPixelRatio()));
    // add the black fade
    composer.addPass(new AfterimagePass(dampening, cutoff));
    // add the bloom
    composer.addPass(bloomPass);

    // start the draw loop
    animate();
}

/**
 * Create a text mesh from a string and font.
 * @param { string } text - The content to be used in the mesh.
 * @param { THREE.Font } font - The font to be applied to the text.
 * @returns { THREE.Mesh } - A mesh of the text in the font.
 */
function makeTextMesh(text, font) {
    // get the text sizes as a list
    const sizesList = [...sizes.entries()];

    // get the dimentions of the window
    const { innerWidth: width, innerHeight: height } = window;

    // get the current text size for the window
    const size = sizesList.reduce((size, [windowWidth, fontSize]) => {
        return windowWidth <= width 
            ? fontSize
            : size;
    }, 0);

    // create the text geometry
    const textGeo = new THREE.TextBufferGeometry(text, {
        font,
        size,
        height: 1, // flat
        curveSegments
    });

    // compute bounding box
    textGeo.computeBoundingBox();

    // get the max x and min x for the geometery
    const { boundingBox: { max: { x: maxX }, min: { x: minX } }} = textGeo;
    const xLength = maxX - minX;

    // horizontal offset to put this in the center
    var centerOffset = -0.5 * xLength;

    // if on mobile, use three columns, four for tablet sizes, five for desktops
    const columns = width < 768
        ? 3
        : width < 1200
        ? 4
        : 5
    
    // set the column size uniform based off of the size of the mesh
    material.uniforms.u_column_size = { value: xLength / columns };

    // create the mesh to be returned
    const textMesh = new THREE.Mesh(textGeo, material);

    // set the position of the mesh
    textMesh.position.x = centerOffset;
    textMesh.position.y = size;
    textMesh.position.z = 0;

    return textMesh;
}

/**
 * The draw loop.
 * @param { DOMHighResTimeStamp } - The time that the function is called. Comes from window.requestionAnimationFrame()
 */
function animate(time) {
    // provide the bar shader the time in seconds
    material.uniforms.u_time.value = time / 1000;

    // render the scene
    composer.render(scene, camera);

    // queue the next iteration of the draw loop
    requestAnimationFrame(animate);
}
