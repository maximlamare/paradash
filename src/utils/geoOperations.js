const axios = require("axios");
const xml2js = require("xml2js");
const fs = require("fs");
const csv = require("csv-parser");

// function getClosestPoint(searchCoords, listOfCoords) {
//   const closestPoint = listOfCoords.reduce((minPoint, currentPoint) => {
//     const distance = (point) =>
//       Math.pow(point[0] - searchCoords[0], 2) +
//       Math.pow(point[1] - searchCoords[1], 2);

//     return distance(currentPoint) < distance(minPoint)
//       ? currentPoint
//       : minPoint;
//   }, listOfCoords[0]);

//   return closestPoint;
// }

function getClosestPointIndex(searchCoords, listOfCoords) {
  const closestIndex = listOfCoords.reduce(
    (minIndex, currentPoint, currentIndex) => {
      const distance = (point) =>
        Math.pow(point[0] - searchCoords[0], 2) +
        Math.pow(point[1] - searchCoords[1], 2);

      return distance(currentPoint) < distance(listOfCoords[minIndex])
        ? currentIndex
        : minIndex;
    },
    0
  );

  return closestIndex;
}

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

async function getDHVStartPlaceName(lat, lon) {
  try {
    const filePath = "/Users/mlamare/repos/paradash/backend/launchSites.csv";

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const results = await new Promise((resolve, reject) => {
      const data = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => data.push(row))
        .on("end", () => resolve(data))
        .on("error", (error) => reject(error));
    });
    const coordinates = results.map((row) => [
      parseFloat(row.Latitude),
      parseFloat(row.Longitude),
    ]);

    const cP = getClosestPointIndex([lat, lon], coordinates);

    return results[cP];
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

module.exports = { getStartPlaceName, getOSMPlaceName, getDHVStartPlaceName };
