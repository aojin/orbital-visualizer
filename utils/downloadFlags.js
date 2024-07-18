import axios from "axios";
import fs from "fs";
import path from "path";
import { OWNER_TO_COUNTRY_CODE_MAP } from "./mappings.js";

// Directory to save the flags
const flagsDir = path.join(process.cwd(), "public", "flags");

// Ensure the directory exists
if (!fs.existsSync(flagsDir)) {
  fs.mkdirSync(flagsDir, { recursive: true });
}

export function getCountryCode(owner) {
  if (!owner) return null;
  const countryCode = OWNER_TO_COUNTRY_CODE_MAP[owner] || null;
  if (countryCode) {
    return countryCode;
  } else {
    console.warn(`No valid country code found for owner: ${owner}`);
    return null;
  }
}

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

export async function downloadFlagOverwrite(owner) {
  const countryCode = getCountryCode(owner);
  if (!countryCode) {
    console.log(`No valid country code found for owner: ${owner}`);
    return null;
  }

  const flagUrl = `https://flagcdn.com/w320/${countryCode}.png`;
  const savePath = path.join(flagsDir, `${countryCode}.png`);

  if (fs.existsSync(savePath)) {
    return savePath; // Return existing path if file already exists
  }

  try {
    const response = await axios({
      url: flagUrl,
      method: "GET",
      responseType: "stream",
    });
    const writer = fs.createWriteStream(savePath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(savePath));
      writer.on("error", (err) => {
        console.error(`Error writing flag to ${savePath}:`, err);
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Error downloading flag for ${owner}:`, error);
    return null;
  }
}

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
