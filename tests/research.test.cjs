const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
test('historical observations match Bảng 3 (2017–2021)', () => {
  const rows = fs.readFileSync(path.join(root, 'data/research-table3.csv'), 'utf8')
    .trim().split(/\r?\n/).slice(1).map(line => line.split(',').slice(0,3).map(Number));
  assert.deepEqual(rows, [[2017,75,1180],[2018,650,9100],[2019,800,11200],[2020,1640,28000],[2021,2000,40000]]);
});
test('research targets and mock geometries are clearly labelled', () => {
  for (const key of ['planned2025Ha:4000','planned2025Tons:114000','digitizationScopeHa:1900','SYNTHETIC_GEOMETRY','SYNTHETIC_SCENARIO']) assert.ok(js.includes(key), key);
  assert.ok(html.includes('DEMO GEOMETRY'));
});
test('ten report-aligned GIS layer controls', () => {
  for(const name of ['farms','plans','aquaculture','aquaPlan','parcels','province','district','commune','roads','waters']) assert.ok(html.includes('data-layer="'+name+'"'), name);
});
test('primary geospatial interactions', () => {
  for(const id of ['map','yearRange','fileImport','exportGeojson','exportCsv','mode2d','mode3d','recordList','districtFilter','statusFilter']) assert.ok(html.includes('id="'+id+'"'), id);
});
test('sample GeoJSON contains only well-formed WGS84 reference points', () => {
  const data = JSON.parse(fs.readFileSync(path.join(root,'data/sample-import.geojson'),'utf8'));
  assert.equal(data.type,'FeatureCollection');
  for(const f of data.features){assert.equal(f.geometry.type,'Point');const [x,y]=f.geometry.coordinates;assert.ok(x>105&&x<108);assert.ok(y>9&&y<11)}
});
