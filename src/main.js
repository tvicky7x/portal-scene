import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Stats from "stats.js";
import GUI from "lil-gui";
import portalVertexShader from "shaders/portal/vertex.glsl";
import portalFragmentShader from "shaders/portal/fragment.glsl";
import firefliesVertexShader from "shaders/fireflies/vertex.glsl";
import firefliesFragmentShader from "shaders/fireflies/fragment.glsl";

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const gui = new GUI({ width: 350 });
gui.close();
const debugObj = {};

const size = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};
window.addEventListener("resize", () => {
  size.width = window.innerWidth;
  size.height = window.innerHeight;
  size.pixelRatio = Math.min(window.devicePixelRatio, 2);
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(size.pixelRatio);
  firefliesMaterial.uniforms.uPixelRatio.value = size.pixelRatio;
});
const canvas = document.querySelector("canvas.webgl");

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
const textureLoader = new THREE.TextureLoader();

const scene = new THREE.Scene();

// Material
const bakedTexture = textureLoader.load("baked.jpg");
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });

debugObj.uColorA = "#298509";
debugObj.uColorB = "#8BF626";
debugObj.uColorOuter = "#A8FF78";

const portalMaterial = new THREE.ShaderMaterial({
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uColorA: new THREE.Uniform(new THREE.Color(debugObj.uColorA)),
    uColorB: new THREE.Uniform(new THREE.Color(debugObj.uColorB)),
    uColorOuter: new THREE.Uniform(new THREE.Color(debugObj.uColorOuter)),
  },
});

gui.addColor(debugObj, "uColorA").onChange(() => {
  portalMaterial.uniforms.uColorA.value.set(debugObj.uColorA);
});
gui.addColor(debugObj, "uColorB").onChange(() => {
  portalMaterial.uniforms.uColorB.value.set(debugObj.uColorB);
});
gui.addColor(debugObj, "uColorOuter").onChange(() => {
  portalMaterial.uniforms.uColorOuter.value.set(debugObj.uColorOuter);
});

// Modal
gltfLoader.load("portal.glb", (gltf) => {
  const bakedMesh = gltf.scene.children.find((child) => child.name === "baked");
  const portalMesh = gltf.scene.children.find(
    (child) => child.name === "portalLight",
  );

  bakedMesh.material = bakedMaterial;
  portalMesh.material = portalMaterial;

  scene.add(gltf.scene);
});

// Fireflies
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 40;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
  positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4;
  positionArray[i * 3 + 1] = Math.random() * 1.5;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;
  scaleArray[i] = Math.random();
}

firefliesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionArray, 3),
);
firefliesGeometry.setAttribute(
  "aScale",
  new THREE.BufferAttribute(scaleArray, 1),
);

debugObj.uFirefliesColor = "#AAFF55";
const firefliesMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: new THREE.Uniform(0),
    uPixelRatio: new THREE.Uniform(size.pixelRatio),
    uSize: new THREE.Uniform(110),
    uColor: new THREE.Uniform(new THREE.Color(debugObj.uFirefliesColor)),
  },
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

gui
  .add(firefliesMaterial.uniforms.uSize, "value")
  .min(0)
  .max(500)
  .step(1)
  .name("firefliesSize");

gui.addColor(debugObj, "uFirefliesColor").onChange(() => {
  firefliesMaterial.uniforms.uColor.value.set(debugObj.uFirefliesColor);
});

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

const camera = new THREE.PerspectiveCamera(
  35,
  size.width / size.height,
  0.1,
  100,
);
camera.position.z = 4.7;
camera.position.y = 2;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.4, 0);
controls.enableDamping = true;
// controls.maxDistance = 5.2;
controls.maxPolarAngle = Math.PI / 2.5;
controls.minAzimuthAngle = -Math.PI / 1.75;
controls.maxAzimuthAngle = Math.PI / 1.75;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(size.pixelRatio);

debugObj.clearColor = "#010B17";
renderer.setClearColor(debugObj.clearColor);
gui.addColor(debugObj, "clearColor").onChange(() => {
  renderer.setClearColor(debugObj.clearColor);
});

const timer = new THREE.Timer();

const animation = () => {
  stats.begin();
  timer.update();
  const elapsedTime = timer.getElapsed();

  portalMaterial.uniforms.uTime.value = elapsedTime;
  firefliesMaterial.uniforms.uTime.value = elapsedTime;

  controls.update();

  renderer.render(scene, camera);
  window.requestAnimationFrame(animation);
  stats.end();
};
animation();
