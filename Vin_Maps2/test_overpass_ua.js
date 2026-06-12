const query = `[out:json][timeout:15];(node(around:5000,-26.2041,28.0473)["amenity"~"hospital|clinic"];way(around:5000,-26.2041,28.0473)["amenity"~"hospital|clinic"];);out center;`;
fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': '*/*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  },
  body: 'data=' + encodeURIComponent(query)
}).then(r => r.json()).then(d => console.log('Elements found:', d.elements.length)).catch(console.error);
