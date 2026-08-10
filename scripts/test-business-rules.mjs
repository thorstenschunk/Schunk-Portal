import assert from 'node:assert/strict';

function isQuarter(time) {
  return /^([01]\d|2[0-3]):(00|15|30|45)$/.test(time);
}
function mins(t){ const [h,m]=t.split(':').map(Number); return h*60+m; }
function total(start,end,pause){ return mins(end)-mins(start)-pause; }

assert.equal(isQuarter('07:00'), true);
assert.equal(isQuarter('07:15'), true);
assert.equal(isQuarter('07:10'), false);
assert.equal(isQuarter('24:00'), false);
assert.equal(total('07:00','15:30',30), 480);
assert.equal(total('07:00','15:30',30), 510-30);
// Fahrt-/Rüstzeit ist Bestandteil der Gesamtzeit und wird nicht addiert.
const travelSetup = 60;
assert.equal(total('07:00','15:30',30), 480);
assert.notEqual(total('07:00','15:30',30) + travelSetup, 480);

console.log('SCHUNK PORTAL Geschäftsregeltests: OK');
