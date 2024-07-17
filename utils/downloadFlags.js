import axios from "axios";
import fs from "fs";
import path from "path";
import { COUNTRY_CODE_MAP } from "./mappings.js";

// Directory to save the flags
const flagsDir = path.join(process.cwd(), "public", "flags");

// Ensure the directory exists
if (!fs.existsSync(flagsDir)) {
  fs.mkdirSync(flagsDir, { recursive: true });
}

// Function to get country code from the owner
const getCountryCode = (owner) => {
  const countryCode = COUNTRY_CODE_MAP[owner];
  return countryCode || null;
};

// Function to download and save the flag
const downloadFlag = async (countryCode) => {
  const url = `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
  const savePath = path.join(flagsDir, `${countryCode.toLowerCase()}.png`);

  // If flag already exists, no need to download
  if (fs.existsSync(savePath)) {
    return `flags/${countryCode.toLowerCase()}.png`; // Return relative path
  }

  const writer = fs.createWriteStream(savePath);

  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () =>
        resolve(`flags/${countryCode.toLowerCase()}.png`)
      ); // Return relative path
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Error downloading flag for ${countryCode}:`, error);
    return null;
  }
};

// Function to get the flag path
export const getFlagPath = async (owner) => {
  const countryCode = getCountryCode(owner);
  if (!countryCode) {
    console.warn(`No country code found for owner: ${owner}`);
    return { flagPath: null, owner };
  }

  try {
    const flagPath = await downloadFlag(countryCode);
    return { flagPath, owner: null };
  } catch (error) {
    console.error(`Error getting flag for owner ${owner}:`, error);
    return { flagPath: null, owner };
  }
};
