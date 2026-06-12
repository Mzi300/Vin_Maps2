const query = '[out:json][timeout:5];(node(around:5000,-26.2041,28.0473)[amenity~"hospital|clinic"];way(around:5000,-26.2041,28.0473)[amenity~"hospital|clinic"];);out center;';
fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query))
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
