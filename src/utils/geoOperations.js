const axios = require("axios");
const xml2js = require("xml2js");

async function getStartPlaceName(lat, lon) {
  try {
    const response = await axios.get(
      `http://localhost:3002/api/getAroundLatLngSites.php?lat=${lat}&lng=${lon}&distance=5&limit=2`,
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    const name = result.search.takeoff[0].name[0];
    console.log("Location name:", name);
    return name;
  } catch (error) {
    console.error("Error fetching paragliding data:", error);
    throw error;
  }
}

async function getOSMPlaceName(lat, lon) {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}`, // Add &format=json
      {
        headers: {
          accept: "application/json", // Ensure Accept header is correct
          "Content-Type": "application/json",
        },
      }
    );

    const parser = new xml2js.Parser({ ignoreAttrs: true });
    const result = await parser.parseStringPromise(response.data);
    const city = result.reversegeocode.addressparts[0].city[0];
    const country = result.reversegeocode.addressparts[0].country[0];

    return { city, country };
  } catch (error) {
    console.error("Error fetching paragliding data:", error);
    throw error;
  }
}

module.exports = { getStartPlaceName, getOSMPlaceName };
