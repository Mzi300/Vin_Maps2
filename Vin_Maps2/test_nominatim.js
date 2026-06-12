async function test() {
  console.time('nominatim');
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=hospital&lat=-26.2041&lon=28.0473&limit=5`, {
    headers: { 'User-Agent': 'VinMaps/1.0' }
  });
  const data = await res.json();
  console.timeEnd('nominatim');
  console.log(data.map(d => d.display_name));
}
test();
