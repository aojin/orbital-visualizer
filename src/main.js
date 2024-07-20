import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import { createTooltip, onMouseMove } from "../utils/Tooltip.js";
import {
  setScene,
  addSatellitesToScene,
  clearPreviousSatellites,
  latLongToCartesian,
} from "../utils/sceneUtils.js";
import {
  populateCountryFilter,
  setOriginalSatellites,
} from "../utils/filterUtils.js";
import { createAccordion } from "../utils/Accordion.js";

const API_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000/api/satellites"
    : "/api/satellites";

let scene, camera, renderer, controls, raycaster, gui;
let loadingItems = 0;
let loadedItems = 0;

function updateProgressBar() {
  const progressBar = document.getElementById("progress");
  const progressPercent = (loadedItems / loadingItems) * 100;
  progressBar.style.width = `${progressPercent}%`;

  if (loadedItems === loadingItems) {
    document.getElementById("progressContainer").style.display = "none";
    document.getElementById("canvasContainer").style.display = "block";
    document.getElementById("countryFilter").style.display = "block";
    document.getElementById("controlsContainer").style.display = "block";
    document.getElementById("dataCard").style.display = "block";
  }
}

function incrementLoadedItems() {
  loadedItems++;
  updateProgressBar();
}

async function init() {
  // Scene
  scene = new THREE.Scene();
  setScene(scene);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 15);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("myCanvas"),
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.debug.checkShaderErrors = true; // Enable shader error logging

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = true;
  controls.enablePan = true; // Enable panning
  controls.enableRotate = true;
  controls.autoRotate = false;
  controls.minDistance = 10;
  controls.maxDistance = 50;

  // Raycaster
  raycaster = new THREE.Raycaster();

  // Tooltip
  createTooltip();

  // Load textures and create the Earth
  loadingItems++;
  loadTextures()
    .then(({ earthTexture, bumpTexture }) => {
      const earthRadius = 5;
      const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
      const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.05,
      });
      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      earth.name = "earth";
      scene.add(earth);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // Get user's location and set initial view
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setInitialView(latitude, longitude);
          },
          () => {
            setInitialView(39.8283, -98.5795); // Fallback location (center of the USA)
          }
        );
      } else {
        setInitialView(39.8283, -98.5795); // Fallback location
      }

      // Add dat.GUI controls
      if (!gui) {
        gui = new GUI({ autoPlace: false });
        document.getElementById("controlsContainer").innerHTML = ""; // Clear existing controls if any
        document
          .getElementById("controlsContainer")
          .appendChild(gui.domElement);

        const controlsFolder = gui.addFolder("Controls");
        controlsFolder.add(controls, "autoRotate").name("Auto Rotate");
        controlsFolder.add(controls, "enableZoom").name("Enable Zoom");
        controlsFolder.add(controls, "enablePan").name("Enable Pan");
        controlsFolder.add(controls, "enableDamping").name("Enable Damping");
        controlsFolder.open();
      }

      // Fetch satellite data and preload flags
      loadingItems++;
      fetchSatellites().then(({ satellites, topOwners }) => {
        if (Array.isArray(satellites)) {
          clearPreviousSatellites();
          setOriginalSatellites(satellites);
          populateCountryFilter(satellites);
          preloadFlags(satellites).then(() => {
            addSatellitesToScene(satellites, earthRadius).then(() => {
              incrementLoadedItems();
              createAccordion(topOwners, satellites.length); // Ensure this is called correctly after satellites are loaded
            });
          });
        } else {
          incrementLoadedItems();
        }
      });

      // Hide spinner once satellites, flags, and orbits are loaded
      incrementLoadedItems();

      // Start animation loop
      animate();
    })
    .catch((err) => {
      console.error("Error loading textures:", err);
      showErrorPage("Error loading textures. Please try again later.");
    });

  // Handle window resize
  window.addEventListener("resize", onWindowResize);

  // Mouse move event listener for tooltips
  window.addEventListener("mousemove", (event) =>
    onMouseMove(event, raycaster, camera, scene, renderer)
  );
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

async function fetchSatellites() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const { satellites, topOwners } = await response.json();

    // Ensure satellites is an array
    return {
      satellites: Array.isArray(satellites) ? satellites : [],
      topOwners,
    };
  } catch (error) {
    console.error("Error fetching satellite data:", error);
    showErrorPage(error.message);
    return { satellites: [], topOwners: [] };
  }
}

async function preloadFlags(satellites) {
  const flagPaths = satellites.map((satellite) => satellite.flagPath);
  loadingItems += flagPaths.length;

  const loadFlag = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        incrementLoadedItems();
        resolve();
      };
      img.onerror = () => {
        console.warn(`Image not found: ${src}, using fallback image.`);
        img.src = "/flags/unknown.png"; // Fallback image
        img.onload = () => {
          incrementLoadedItems();
          resolve();
        };
        img.onerror = reject;
      };
      img.src = src;
    });
  };

  const promises = flagPaths.map(loadFlag);
  await Promise.all(promises);
}

function setInitialView(latitude, longitude) {
  const earthRadius = 5;
  const earthCenter = latLongToCartesian(latitude, longitude, earthRadius);

  camera.position.copy(
    new THREE.Vector3(earthCenter.x, earthCenter.y, controls.maxDistance) // Ensure this value allows a zoomed-out view
  );
  camera.lookAt(new THREE.Vector3(earthCenter.x, earthCenter.y, 0)); // Look at the center of the Earth

  // Update controls if needed
  controls.update();

  adjustEarthRotation(latitude, longitude);
}

function adjustEarthRotation(latitude, longitude) {
  const phi = (90 - latitude) * (Math.PI / 180);
  const theta = (longitude + 180) * (Math.PI / 180);

  const quaternion = new THREE.Quaternion();
  quaternion.setFromEuler(new THREE.Euler(phi, theta, 0));

  const earth = scene.getObjectByName("earth");
  if (earth) {
    earth.setRotationFromQuaternion(quaternion);
  }
}

function loadTextures() {
  return new Promise((resolve, reject) => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/earth_texture.jpg",
      (earthTexture) => {
        textureLoader.load(
          "/earth_bump_texture.png",
          (bumpTexture) => {
            resolve({ earthTexture, bumpTexture });
          },
          undefined,
          (err) => {
            console.error("Error loading bump texture:", err);
            reject(err);
          }
        );
      },
      undefined,
      (err) => {
        console.error("Error loading earth texture:", err);
        reject(err);
      }
    );
  });
}

function showErrorPage(message) {
  const errorPage = document.getElementById("errorPage");
  errorPage.style.display = "block";
  errorPage.textContent = message;
}

document.addEventListener("DOMContentLoaded", init);
