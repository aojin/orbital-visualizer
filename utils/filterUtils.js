import { OWNER_MAP, OWNER_TO_COUNTRY_CODE_MAP } from "./mappings.js";
import { addSatellitesToScene, clearPreviousSatellites } from "./sceneUtils.js";

// Create a reverse mapping from country codes to owner keys
const REVERSE_OWNER_MAP = Object.entries(OWNER_TO_COUNTRY_CODE_MAP).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {}
);

let originalSatellites = [];
let filteredSatellites = [];

function setOriginalSatellites(satellites) {
  originalSatellites = satellites;
}

function populateCountryFilter(satellites) {
  const countrySelect = document.getElementById("countrySelect");
  const countryCounts = satellites.reduce((acc, sat) => {
    const ownerKey = sat.country;
    acc[ownerKey] = (acc[ownerKey] || 0) + 1;
    return acc;
  }, {});

  const uniqueOwners = Object.keys(countryCounts).sort();

  uniqueOwners.forEach((ownerKey) => {
    const displayName = OWNER_MAP[ownerKey] || ownerKey;
    const option = document.createElement("option");
    option.value = ownerKey;
    option.textContent = `${displayName} (${countryCounts[ownerKey]})`;
    countrySelect.appendChild(option);
  });

  countrySelect.addEventListener("change", () => {
    const selectedCountry = countrySelect.value;
    filterSatellitesByCountry(selectedCountry);
  });
}

function filterSatellitesByCountry(selectedCountry) {
  filteredSatellites =
    selectedCountry === "all"
      ? originalSatellites
      : originalSatellites.filter((sat) => sat.country === selectedCountry);

  // Remove existing satellites
  clearPreviousSatellites();

  // Add filtered satellites to scene
  addSatellitesToScene(filteredSatellites, 5); // Assuming earthRadius is 5
}

export {
  populateCountryFilter,
  filterSatellitesByCountry,
  setOriginalSatellites,
};
