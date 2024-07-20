import * as THREE from "three";
import { OWNER_TO_COUNTRY_CODE_MAP } from "./mappings.js";

let scene;
let instancedMeshData = []; // Keep instancedMeshData accessible

function setScene(newScene) {
  scene = newScene;
}

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

function clearPreviousSatellites() {
  for (let i = scene.children.length - 1; i >= 0; i--) {
    const obj = scene.children[i];
    if (obj instanceof THREE.InstancedMesh) {
      scene.remove(obj);
      disposeResources(obj);
    }
  }
}

async function addSatellitesToScene(satellites, earthRadius) {
  if (!Array.isArray(satellites)) {
    console.error("Expected satellites to be an array, got:", satellites);
    return;
  }

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

  return Promise.resolve(); // Ensure addSatellitesToScene returns a promise
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

export {
  setScene,
  addSatellitesToScene,
  clearPreviousSatellites,
  latLongToCartesian,
};
