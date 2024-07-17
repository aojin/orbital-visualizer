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
export const getCountryCode = (owner) => {
  const countryCode = COUNTRY_CODE_MAP[owner];
  console.log(`getCountryCode: owner = ${owner}, countryCode = ${countryCode}`);
  return countryCode || "unk";
};

// Function to download and save the flag
const downloadFlag = async (countryCode) => {
  if (countryCode === "unk") {
    console.warn(
      `downloadFlag: Skipping download for unknown country code: ${countryCode}`
    );
    return null;
  }

  const url = `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
  const savePath = path.join(flagsDir, `${countryCode.toLowerCase()}.png`);

  console.log(`Requesting flag image from: ${url}`); // Log the URL

  // If flag already exists, no need to download
  if (fs.existsSync(savePath)) {
    console.log(`downloadFlag: Flag already exists at ${savePath}`);
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
      writer.on("finish", () => {
        console.log(
          `downloadFlag: Successfully downloaded flag to ${savePath}`
        );
        resolve(`flags/${countryCode.toLowerCase()}.png`);
      }); // Return relative path
      writer.on("error", (error) => {
        console.error(`downloadFlag: Error writing flag to ${savePath}`, error);
        reject(error);
      });
    });
  } catch (error) {
    console.error(
      `downloadFlag: Error downloading flag for ${countryCode}:`,
      error
    );
    return null;
  }
};

// Function to download and save the flag (overwrite)
export const downloadFlagOverwrite = async (countryCode) => {
  if (countryCode === "unk") {
    console.warn(
      `downloadFlagOverwrite: Skipping download for unknown country code: ${countryCode}`
    );
    return null;
  }

  const url = `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
  const savePath = path.join(flagsDir, `${countryCode.toLowerCase()}.png`);

  console.log(`Requesting flag image from: ${url}`); // Log the URL

  const writer = fs.createWriteStream(savePath);

  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log(
          `downloadFlagOverwrite: Successfully downloaded flag to ${savePath}`
        );
        resolve(`flags/${countryCode.toLowerCase()}.png`);
      }); // Return relative path
      writer.on("error", (error) => {
        console.error(
          `downloadFlagOverwrite: Error writing flag to ${savePath}`,
          error
        );
        reject(error);
      });
    });
  } catch (error) {
    console.error(
      `downloadFlagOverwrite: Error downloading flag for ${countryCode}:`,
      error
    );
    return null;
  }
};

// Function to get the flag path
export const getFlagPath = async (owner) => {
  const countryCode = getCountryCode(owner);
  if (!countryCode || countryCode === "unk") {
    console.warn(
      `getFlagPath: No valid country code found for owner: ${owner}`
    );
    return { flagPath: null, owner };
  }

  try {
    const flagPath = await downloadFlag(countryCode);
    console.log(`getFlagPath: flagPath for owner ${owner} = ${flagPath}`);
    return { flagPath, owner: null };
  } catch (error) {
    console.error(`getFlagPath: Error getting flag for owner ${owner}:`, error);
    return { flagPath: null, owner };
  }
};
