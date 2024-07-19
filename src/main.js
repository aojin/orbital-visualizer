import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import { createAccordion } from "../utils/Accordion.js";
import { showErrorPage } from "../utils/showErrorPage.js";
import { createTooltip, onMouseMove } from "../utils/Tooltip.js";
import {
  populateCountryFilter,
  setOriginalSatellites,
} from "../utils/filterUtils.js";
import {
  setScene,
  addSatellitesToScene,
  clearPreviousSatellites,
  latLongToCartesian,
} from "../utils/sceneUtils.js";

const API_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000/api/satellites"
    : "/api/satellites";

let scene, camera, renderer, controls, raycaster, mouse;
let previousScene;
let initialized = false;

function disposeResources(object) {
  if (object.geometry) object.geometry.dispose();
  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach((material) => material.dispose());
    } else {
      object.material.dispose();
    }
  }
}

function clearPreviousScene() {
  if (previousScene) {
    previousScene.traverse(disposeResources);
    previousScene = null;
  }
}

async function fetchSatellites() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const { satellites, topOwners } = await response.json();

    // Store the original fetched satellites
    setOriginalSatellites(satellites);

    // Create accordion
    createAccordion(topOwners, satellites.length);

    // Populate country filter
    populateCountryFilter(satellites);

    return satellites;
  } catch (error) {
    console.error("Error fetching satellite data:", error);
    showErrorPage(error.message);
  }
}

async function preloadFlags(satellites) {
  const flagPaths = satellites.map((satellite) => satellite.flagPath);
  const loadFlag = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = () => {
        console.warn(`Image not found: ${src}, using fallback image.`);
        img.src = "/flags/unknown.png"; // Fallback image
        img.onload = resolve;
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
    earthCenter.clone().add(new THREE.Vector3(0, 0, controls.maxDistance)) // Ensure this value allows a zoomed-out view
  );
  camera.lookAt(earthCenter); // Look at the center of the Earth

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

function init() {
  if (initialized) return; // Prevent multiple initializations
  initialized = true;

  // Show spinner
  const spinner = document.getElementById("spinner");
  const canvasContainer = document.getElementById("canvasContainer");

  // Dispose of previous scene if it exists
  clearPreviousScene();

  // Scene
  scene = new THREE.Scene();
  previousScene = scene;
  setScene(scene); // Set the scene in sceneUtils

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

  // Raycaster and mouse
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Tooltip
  createTooltip();

  loadTextures()
    .then(({ earthTexture, bumpTexture }) => {
      // Create Earth
      const earthRadius = 5; // Earth radius in scene units
      const geometry = new THREE.SphereGeometry(earthRadius, 64, 64);
      const material = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.05,
      });
      const earth = new THREE.Mesh(geometry, material);
      earth.name = "earth";
      scene.add(earth);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

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

      // Get user's location and set initial view
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log(
              `User's location: latitude ${latitude}, longitude ${longitude}`
            );
            setInitialView(latitude, longitude);
          },
          (error) => {
            console.error("Error getting user's location:", error);
            // Fallback to a default location if geolocation fails
            setInitialView(39.8283, -98.5795); // Center of the USA
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
        // Fallback to a default location if geolocation is not supported
        setInitialView(39.8283, -98.5795); // Center of the USA
      }

      // Add dat.GUI controls
      const gui = new GUI();
      const controlsFolder = gui.addFolder("Controls");
      controlsFolder
        .add(controls, "autoRotate")
        .name("Auto Rotate")
        .onChange((value) => {
          controls.autoRotate = value;
        });
      controlsFolder
        .add(controls, "enableZoom")
        .name("Enable Zoom")
        .onChange((value) => {
          controls.enableZoom = value;
        });
      controlsFolder
        .add(controls, "enablePan")
        .name("Enable Pan")
        .onChange((value) => {
          controls.enablePan = value;
        });
      controlsFolder
        .add(controls, "enableDamping")
        .name("Enable Damping")
        .onChange((value) => {
          controls.enableDamping = value;
        });
      controlsFolder.open();

      // Fetch satellite data and preload flags
      fetchSatellites().then((data) => {
        if (data) {
          preloadFlags(data)
            .then(() => addSatellitesToScene(data, earthRadius))
            .then(() => {
              // Hide spinner once satellites and flags are loaded
              spinner.style.display = "none";
              // Show canvas
              canvasContainer.style.visibility = "visible";
            })
            .catch((err) => {
              console.error("Error adding satellites to scene:", err);
              showErrorPage(
                "Error adding satellites to scene. Please try again later."
              );
            });
        }
      });

      // Render loop
      function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }

      // Handle window resize
      window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      // Mouse move event listener for tooltips
      window.addEventListener("mousemove", (event) =>
        onMouseMove(event, raycaster, camera, scene)
      );

      // Start the animation loop
      animate();
    })
    .catch((err) => {
      console.error("Error loading textures:", err);
      showErrorPage("Error loading textures. Please try again later.");
    });
}

// Initialize the scene when the DOM content is loaded
document.addEventListener("DOMContentLoaded", init);
