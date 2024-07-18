import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import { createAccordion } from "../utils/Accordion.js";
import { showErrorPage } from "../utils/showErrorPage.js";
import { OWNER_TO_COUNTRY_CODE_MAP } from "../utils/mappings.js";
import {
  createTooltip,
  showTooltip,
  hideTooltip,
  onMouseMove,
} from "../utils/Tooltip.js";

let scene, camera, renderer, controls, raycaster, mouse;
let previousScene;
let initialized = false;
let tooltip, tooltipTimeout;
const tooltipDelay = 200; // Delay before showing tooltip (ms)

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
    const response = await fetch("http://localhost:3000/api/satellites");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const { satellites, topOwners } = await response.json();

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

function populateCountryFilter(satellites) {
  const countrySelect = document.getElementById("countrySelect");
  const countryCounts = satellites.reduce((acc, sat) => {
    acc[sat.country] = (acc[sat.country] || 0) + 1;
    return acc;
  }, {});
  const uniqueCountries = Object.keys(countryCounts).sort();

  uniqueCountries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = `${country} (${countryCounts[country]})`;
    countrySelect.appendChild(option);
  });

  countrySelect.addEventListener("change", () => {
    const selectedCountry = countrySelect.value;
    filterSatellitesByCountry(selectedCountry);
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
      });
      const earth = new THREE.Mesh(geometry, material);
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

      // Function to convert latitude and longitude to Cartesian coordinates
      const latLongToCartesian = (lat, lon, radius) => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        return new THREE.Vector3(x, y, z);
      };

      const setInitialView = (latitude, longitude) => {
        const earthCenter = latLongToCartesian(
          latitude,
          longitude,
          earthRadius
        );

        camera.position.copy(
          earthCenter.clone().add(new THREE.Vector3(0, 0, controls.maxDistance)) // Ensure this value allows a zoomed-out view
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
          // console.log("Fetched satellite data:", data);
          addSatellitesToScene(data, earthRadius)
            .then(() => {
              // Hide spinner once satellites are added to the scene
              spinner.style.display = "none";
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

let allSatellites = [];
let instancedMeshData = []; // Move this declaration outside of the function to be accessible

async function addSatellitesToScene(satellites, earthRadius) {
  allSatellites = satellites; // Store all satellites for filtering
  instancedMeshData = []; // Clear existing data

  const satelliteGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const textureLoader = new THREE.TextureLoader();

  const fallbackMaterial = new THREE.MeshBasicMaterial({
    color: 0xb22222,
    transparent: true,
    opacity: 0.5,
  }); // Red color for fallback

  const satelliteMaterialMap = {}; // Cache materials to avoid loading textures multiple times

  console.log({ satelliteMaterialMap });

  const warningTexturePath = "/warning.png";
  let warningMaterial;

  // Load warning texture once
  try {
    const warningTexture = await new Promise((resolve, reject) => {
      textureLoader.load(
        warningTexturePath,
        (texture) => {
          console.log("Successfully loaded warning texture");
          resolve(texture);
        },
        undefined,
        (err) => {
          console.error("Error loading warning texture:", err);
          reject(err);
        }
      );
    });
    warningMaterial = new THREE.MeshBasicMaterial({
      map: warningTexture,
      transparent: true,
      opacity: 0.5,
    });
  } catch (error) {
    console.error(
      "Error loading warning texture, using fallback material:",
      error
    );
    warningMaterial = fallbackMaterial;
  }

  for (const satellite of satellites) {
    const { country, objectType } = satellite;

    // Check for specific object types and use warning.png
    if (objectType === "R/B" || objectType === "DEB" || objectType === "UNK") {
      addSatelliteToInstancedMesh(
        instancedMeshData,
        warningMaterial,
        satellite,
        earthRadius
      );
      continue;
    }

    const countryCode = OWNER_TO_COUNTRY_CODE_MAP[country] || "unknown";
    const flagPath = `/flags/${countryCode}.png`; // Construct the flag path based on the country code

    try {
      if (!satelliteMaterialMap[flagPath]) {
        const flagTexture = await new Promise((resolve, reject) => {
          textureLoader.load(
            flagPath,
            (texture) => {
              console.log(
                `Successfully loaded texture for satellite ${satellite.name} from ${flagPath}`
              );
              resolve(texture);
            },
            undefined,
            (err) => {
              console.error(
                `Error loading texture for satellite ${satellite.name} from ${flagPath}:`,
                err
              );
              reject(err);
            }
          );
        });

        if (flagTexture) {
          satelliteMaterialMap[flagPath] = new THREE.MeshBasicMaterial({
            map: flagTexture,
            transparent: true,
            opacity: 0.5,
          });
        } else {
          satelliteMaterialMap[flagPath] = fallbackMaterial; // Use fallback material if texture loading fails
        }
      }

      addSatelliteToInstancedMesh(
        instancedMeshData,
        satelliteMaterialMap[flagPath],
        satellite,
        earthRadius
      );
    } catch (error) {
      console.error(`Texture load error for ${satellite.name}:`, error);
      satelliteMaterialMap[flagPath] = fallbackMaterial; // Use fallback material if texture loading fails
      addSatelliteToInstancedMesh(
        instancedMeshData,
        fallbackMaterial,
        satellite,
        earthRadius
      );
    }
  }

  // Create and add instanced meshes to the scene
  instancedMeshData.forEach(({ material, positions, satellites }) => {
    const instancedMesh = new THREE.InstancedMesh(
      satelliteGeometry,
      material,
      positions.length
    );
    instancedMesh.satellites = satellites; // Store satellites data in instancedMesh
    const dummy = new THREE.Object3D();

    positions.forEach((position, index) => {
      dummy.position.copy(position);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(index, dummy.matrix);
    });

    scene.add(instancedMesh);
  });
}

function filterSatellitesByCountry(selectedCountry) {
  const filteredSatellites =
    selectedCountry === "all"
      ? allSatellites
      : allSatellites.filter((sat) => sat.country === selectedCountry);

  // Remove existing satellites
  clearPreviousSatellites();

  // Add filtered satellites to scene
  addSatellitesToScene(filteredSatellites, 5); // Assuming earthRadius is 5
}

function clearPreviousSatellites() {
  for (let i = scene.children.length - 1; i >= 0; i--) {
    const obj = scene.children[i];
    if (obj instanceof THREE.InstancedMesh) {
      scene.remove(obj);
      disposeResources(obj);
    }
  }
}

function addSatelliteToInstancedMesh(
  instancedMeshData,
  material,
  satellite,
  earthRadius
) {
  const { latitude, longitude, altitude } = satellite;
  const altitudeScaleFactor = 0.01; // Adjust this factor as needed
  const position = latLongToCartesian(
    latitude,
    longitude,
    earthRadius + altitude * altitudeScaleFactor
  ); // Adjust radius to place satellites in orbit

  let data = instancedMeshData.find((data) => data.material === material);
  if (!data) {
    data = { material, positions: [], satellites: [] };
    instancedMeshData.push(data);
  }

  data.positions.push(position);
  data.satellites.push(satellite); // Store satellite data
}

// Function to convert latitude and longitude to Cartesian coordinates
function latLongToCartesian(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

// Initialize the scene when the DOM content is loaded
document.addEventListener("DOMContentLoaded", init);
