const query = `[out:json][timeout:5];(node(around:5000,-26.2041,28.0473)[amenity~"hospital|clinic"];way(around:5000,-26.2041,28.0473)[amenity~"hospital|clinic"];);out center;`;
fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'data=' + encodeURIComponent(query)
})
  .then(async r => {
    console.log("Status:", r.status);
    console.log("Text:", await r.text());
  })
  .catch(console.error);
