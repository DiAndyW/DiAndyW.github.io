import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectedGlass, directShadow, lightAt } from './windowLight.ts';

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
test('glass corners project onto actual model heights, not SVG table/rug heights', () => {
    const floor = projectedGlass('day', 0);
    assert.deepEqual(floor, [[1.1, 2.7], [2.64, 3.4000000000000004], [2.64, 6.8], [1.1, 6.1]]);
    const table = projectedGlass('day', 1.625);
    close(table[0][0], 0.20625); close(table[0][1], 2.29375);
    close(table[2][0], 1.74625); close(table[2][1], 6.39375);
    const rug = projectedGlass('dawn', 0.125);
    close(rug[0][0], 2.34375); close(rug[0][1], 2.7625);
    close(rug[2][0], 5.84375); close(rug[2][1], 7.0025);
});

test('analytic cutouts cover bars, model table shadow, pole and bowl, leaving adjacent beam lit', () => {
    assert.equal(directShadow([1.87, 4.75], 'floor', 'day'), true); // z=3.4 bar
    assert.equal(directShadow([1.4, 4.536363636363636], 'floor', 'day'), true); // depth=3.9 bar
    assert.equal(directShadow([2.82375, 5.63625], 'floor', 'day'), true); // model table centre
    assert.equal(directShadow([2.2, 5.352727272727273], 'floor', 'day'), true); // pole capsule
    assert.equal(directShadow([2.1225, 5.3175], 'table', 'day'), true); // bowl
    assert.equal(directShadow([1.3, 3.2], 'floor', 'day'), false);
    assert.equal(lightAt([1.3, 3.2], 'floor', { weather: 'clear', time: 'day' }), 'direct');
});

test('only dawn beam reaches model rug; diffuse steps never light table or rug', () => {
    assert.equal(lightAt([5.5, 5.8], 'rug', { weather: 'clear', time: 'dawn' }), 'direct');
    assert.equal(lightAt([5.4, 5.2], 'rug', { weather: 'clear', time: 'day' }), null);
    assert.equal(lightAt([1.93, 5.23], 'table', { weather: 'rainy', time: 'night' }), null);
    assert.equal(lightAt([0.5, 3.4], 'floor', { weather: 'rainy', time: 'night' }), 'inner');
    assert.equal(lightAt([1.5, 3.4], 'floor', { weather: 'rainy', time: 'night' }), 'outer');
    assert.equal(lightAt([2.2, 3.4], 'floor', { weather: 'rainy', time: 'night' }), null);
    assert.equal(lightAt([6, 7.5], 'rug', { weather: 'clear', time: 'dawn' }), null);
});
