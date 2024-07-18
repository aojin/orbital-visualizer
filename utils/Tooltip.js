import * as THREE from "three";

let tooltip;
let tooltipTimeout;
const tooltipDelay = 200; // Delay before showing tooltip (ms)

export function createTooltip() {
  tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.background = "rgba(0, 0, 0, 0.7)";
  tooltip.style.color = "white";
  tooltip.style.padding = "5px";
  tooltip.style.borderRadius = "5px";
  tooltip.style.pointerEvents = "none";
  tooltip.style.display = "none";
  document.body.appendChild(tooltip);
}

export function showTooltip(event, satellite) {
  clearTimeout(tooltipTimeout);
  tooltipTimeout = setTimeout(() => {
    tooltip.innerHTML = `
      <div><strong>Name:</strong> ${satellite.name}</div>
      <div><strong>Catalog Number:</strong> ${satellite.catalogNumber}</div>
      <div><strong>COSPAR ID:</strong> ${satellite.cosparId}</div>
      <div><strong>Latitude:</strong> ${satellite.latitude.toFixed(2)}</div>
      <div><strong>Longitude:</strong> ${satellite.longitude.toFixed(2)}</div>
      <div><strong>Altitude:</strong> ${satellite.altitude.toFixed(2)} km</div>
      <div><strong>Country:</strong> ${satellite.country}</div>
      <div><strong>Object Type:</strong> ${satellite.objectType}</div>
      <div><strong>Owner:</strong> ${satellite.owner}</div>
    `;
    tooltip.style.left = event.clientX + "px";
    tooltip.style.top = event.clientY + 20 + "px"; // Move tooltip down by 20px
    tooltip.style.display = "block";
  }, tooltipDelay);
}

export function hideTooltip() {
  clearTimeout(tooltipTimeout);
  tooltip.style.display = "none";
}

export function onMouseMove(event, raycaster, camera, scene) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const instanceId = intersects[0].instanceId;
    const object = intersects[0].object;
    if (object instanceof THREE.InstancedMesh && instanceId !== undefined) {
      const satellite = object.satellites[instanceId];
      if (satellite) {
        showTooltip(event, satellite);
        return;
      }
    }
  }

  hideTooltip();
}
