import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";

let scene, camera, renderer, controls;
let previousScene;

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

function showErrorPage(errorMessage) {
  const canvasContainer = document.getElementById("canvasContainer");
  canvasContainer.innerHTML = ""; // Clear the existing content

  const errorDiv = document.createElement("div");
  errorDiv.style.position = "absolute";
  errorDiv.style.top = "50%";
  errorDiv.style.left = "50%";
  errorDiv.style.transform = "translate(-50%, -50%)";
  errorDiv.style.textAlign = "center";
  errorDiv.style.color = "red";
  errorDiv.style.fontSize = "20px";
  errorDiv.style.padding = "20px";
  errorDiv.style.border = "1px solid red";
  errorDiv.style.backgroundColor = "white";
  errorDiv.innerText = "An error occurred:\n" + errorMessage;

  canvasContainer.appendChild(errorDiv);
  // Hide spinner if there's an error
  const spinner = document.getElementById("spinner");
  spinner.style.display = "none";
}

function logShaderErrors() {
  const gl = renderer.getContext();
  const programs = renderer.info.programs;
  programs.forEach((program) => {
    const { cacheKey, usedTimes, vertexShader, fragmentShader } = program;
    console.log(`Program CacheKey: ${cacheKey}`);
    console.log(`Used Times: ${usedTimes}`);
    if (vertexShader) {
      const status = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
      const source = gl.getShaderSource(vertexShader);
      console.log("Vertex Shader Compile Status:", status);
      console.log("Vertex Shader Source:", source);
    }
    if (fragmentShader) {
      const status = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
      const source = gl.getShaderSource(fragmentShader);
      console.log("Fragment Shader Compile Status:", status);
      console.log("Fragment Shader Source:", source);
    }
    const linkStatus = gl.getProgramParameter(program.program, gl.LINK_STATUS);
    console.log("Program Link Status:", linkStatus);
    if (!linkStatus) {
      const infoLog = gl.getProgramInfoLog(program.program);
      console.error("Program Info Log:", infoLog);
    }
  });
}

async function fetchSatellites() {
  try {
    const response = await fetch("http://localhost:3000/api/satellites");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    console.log("Satellite data:", data); // Log the data to verify it
    return data;
  } catch (error) {
    console.error("Error fetching satellite data:", error);
  }
}

function init() {
  // Show spinner
  const spinner = document.getElementById("spinner");
  const canvasContainer = document.getElementById("canvasContainer");

  // Dispose of previous scene if it exists
  clearPreviousScene();

  // Scene
  scene = new THREE.Scene();
  previousScene = scene;

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

  // Load textures
  const textureLoader = new THREE.TextureLoader();
  let earthTexture, bumpTexture;

  const loadTextures = () => {
    return new Promise((resolve, reject) => {
      earthTexture = textureLoader.load(
        "/earth_texture.jpg",
        () => {
          console.log("Earth texture loaded successfully.");
          bumpTexture = textureLoader.load(
            "/earth_bump_texture.png",
            () => {
              resolve();
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
  };

  loadTextures()
    .then(() => {
      // Create Earth
      const earthRadius = 5; // Earth radius in scene units
      const geometry = new THREE.SphereGeometry(earthRadius, 64, 64);
      const material = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.05,
        onBeforeCompile: (shader) => {
          // Log the uniforms for debugging
          console.log("Shader Uniforms:", shader.uniforms);
          // Adding custom shader code to catch errors
          shader.vertexShader = `#define ORIGINAL
            ${shader.vertexShader}`;
          shader.fragmentShader = `#define ORIGINAL
            ${shader.fragmentShader}`;
        },
      });
      const earth = new THREE.Mesh(geometry, material);
      scene.add(earth);

      // Log the program info after the shaders are compiled and linked
      setTimeout(() => {
        logShaderErrors();
      }, 1000); // Adjust timeout as needed

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

      // Function to convert latitude and longitude to Cartesian coordinates
      const latLongToCartesian = (lat, lon) => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);

        const x = -(earthRadius * Math.sin(phi) * Math.cos(theta));
        const y = earthRadius * Math.cos(phi);
        const z = earthRadius * Math.sin(phi) * Math.sin(theta);

        return new THREE.Vector3(x, y, z);
      };

      const setInitialView = (latitude, longitude) => {
        const earthCenter = latLongToCartesian(latitude, longitude);

        camera.position.copy(
          earthCenter.clone().add(new THREE.Vector3(0, 0, 10)) // Ensure this value allows a zoomed-out view
        );
        camera.lookAt(earthCenter); // Look at the center of the Earth

        // Update controls if needed
        controls.update();

        // Adjust Earth rotation if necessary
        adjustEarthRotation(latitude, longitude);
      };

      // Function to adjust the rotation of the Earth mesh using quaternions
      const adjustEarthRotation = (latitude, longitude) => {
        const phi = (90 - latitude) * (Math.PI / 180);
        const theta = (longitude + 180) * (Math.PI / 180);

        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(new THREE.Euler(phi, theta, 0));

        earth.setRotationFromQuaternion(quaternion);
      };

      // Get user's location and set initial view
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log(
              `User's location: latitude ${latitude}, longitude ${longitude}`
            );
            setInitialView(latitude, longitude);
            // Hide spinner and show canvas
            spinner.style.display = "none";
            canvasContainer.style.visibility = "visible";
          },
          (error) => {
            console.error("Error getting user's location:", error);
            // Fallback to a default location if geolocation fails
            setInitialView(39.8283, -98.5795); // Center of the USA
            // Hide spinner and show canvas
            spinner.style.display = "none";
            canvasContainer.style.visibility = "visible";
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
        // Fallback to a default location if geolocation is not supported
        setInitialView(39.8283, -98.5795); // Center of the USA
        // Hide spinner and show canvas
        spinner.style.display = "none";
        canvasContainer.style.visibility = "visible";
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

      // Fetch satellite data
      fetchSatellites().then((data) => {
        if (data) {
          console.log("Fetched satellite data:", data);
          // Process the satellite data as needed
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
