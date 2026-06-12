const query = '[out:json][timeout:5];(node(around:5000,-26.2041,28.0473)[amenity=hospital];way(around:5000,-26.2041,28.0473)[amenity=hospital];node(around:5000,-26.2041,28.0473)[amenity=clinic];way(around:5000,-26.2041,28.0473)[amenity=clinic];);out center;';
fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'data=' + encodeURIComponent(query)
}).then(r => r.json()).then(d => console.log(d.elements.length)).catch(console.error);
