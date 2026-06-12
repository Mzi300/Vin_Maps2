async function test() {
  console.time('photon');
  const res = await fetch(`https://photon.komoot.io/api/?q=hospital&lat=-26.2041&lon=28.0473&limit=5`);
  const data = await res.json();
  console.timeEnd('photon');
  console.log(data.features.map(d => d.properties.name));
}
test();
