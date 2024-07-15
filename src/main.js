import * as THREE from "three";

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load("/earth_texture.jpg");
const bumpTexture = textureLoader.load("/earth_bump_texture.png");

let geometry = new THREE.SphereGeometry(5, 64, 64);
let material = new THREE.MeshPhongMaterial({
  map: earthTexture,
  bumpMap: bumpTexture,
  bumpScale: 0.05,
});
let earth = new THREE.Mesh(geometry, material);
scene.add(earth);

let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

camera.position.z = 15;

function animate() {
  requestAnimationFrame(animate);
  earth.rotation.y += 0.001;
  renderer.render(scene, camera);
}

animate();
