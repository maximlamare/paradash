const axios = require("axios");
const xml2js = require("xml2js");

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

function haversineDistanceM(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
  const toRad = (degrees) => degrees * (Math.PI / 180);

  const lat1 = toRad(lat1Deg);
  const lon1 = toRad(lon1Deg);
  const lat2 = toRad(lat2Deg);
  const lon2 = toRad(lon2Deg);

  const { sin, cos, sqrt, atan2 } = Math;

  const R = 6.3781e6; // earth radius in km
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a =
    sin(dLat / 2) * sin(dLat / 2) +
    cos(lat1) * cos(lat2) * sin(dLon / 2) * sin(dLon / 2);
  const c = 2 * atan2(sqrt(a), sqrt(1 - a));
  const d = R * c;
  return d; // distance in km
}

function getClosestPoint(searchCoords, listOfCoords) {
  const closestPoint = listOfCoords.reduce((minPoint, currentPoint) => {
    const distance = haversineDistanceM(
      searchCoords[0],
      searchCoords[1],
      currentPoint[0],
      currentPoint[1]
    );

    const minDistance = haversineDistanceM(
      searchCoords[0],
      searchCoords[1],
      minPoint[0],
      minPoint[1]
    );

    return distance < minDistance ? currentPoint : minPoint;
  }, listOfCoords[0]);

  return closestPoint;
}

function extractNamesAndCoordinates(objectsArray) {
  const names = objectsArray.map((obj) => `${obj.name}, ${obj.country}`);
  const coordinates = objectsArray.map((obj) => [obj.latitude, obj.longitude]);
  return { names, coordinates };
}

function getStartPlaceName(lat, lon, launchsites) {
  try {
    // Parse databse entries to lists of coordinates and names
    const { names, coordinates } = extractNamesAndCoordinates(launchsites.data);

    // Find info about the closest point
    const closestPoint = getClosestPoint([lat, lon], coordinates);
    const closestIndex = coordinates.findIndex(
      (coord) => coord[0] === closestPoint[0] && coord[1] === closestPoint[1]
    );
    const distance = haversineDistanceM(
      lat,
      lon,
      closestPoint[0],
      closestPoint[1]
    );

    let locationFinalName = names[closestIndex].replace(" Startplatz", "");

    if (distance > 3000) {
      return "Not found in database";
    } else {
      return locationFinalName;
    }
  } catch (error) {
    console.error("Error fetching paragliding data:", error);
    throw error;
  }
}

// async function getDHVStartPlaceName(lat, lon) {
//   try {
//     const filePath = "/Users/mlamare/repos/paradash/backend/launchSites.csv";

//     if (!fs.existsSync(filePath)) {
//       throw new Error(`File not found: ${filePath}`);
//     }

//     const results = await new Promise((resolve, reject) => {
//       const data = [];
//       fs.createReadStream(filePath)
//         .pipe(csv())
//         .on("data", (row) => data.push(row))
//         .on("end", () => resolve(data))
//         .on("error", (error) => reject(error));
//     });
//     const coordinates = results.map((row) => [
//       parseFloat(row.Latitude),
//       parseFloat(row.Longitude),
//     ]);

//     const cP = getClosestPointIndex([lat, lon], coordinates);

//     return results[cP];
//   } catch (error) {
//     console.error("Error fetching paragliding data:", error);
//     throw error;
//   }
// }

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
