import { describe, expect, it } from 'vitest';

import { targetSize } from './prepareImage';

/**
 * De rekenkant van het verkleinen. Het tekenen zelf hangt aan canvas, dat in
 * een testomgeving zonder browser niet bestaat; wát er getekend moet worden is
 * hier wel te controleren.
 */
describe('targetSize', () => {
  it('laat een afbeelding die al klein genoeg is met rust', () => {
    expect(targetSize(1200, 800, 2000)).toEqual({ width: 1200, height: 800 });
  });

  it('vergroot nooit', () => {
    expect(targetSize(400, 300, 2000)).toEqual({ width: 400, height: 300 });
  });

  it('schaalt terug op de langste zijde, liggend', () => {
    expect(targetSize(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 });
  });

  it('schaalt terug op de langste zijde, staand', () => {
    expect(targetSize(3000, 4000, 2000)).toEqual({ width: 1500, height: 2000 });
  });

  /** Een telefoonfoto van 48 megapixel. */
  it('brengt een enorme foto terug tot werkbare afmetingen', () => {
    const size = targetSize(8160, 6120, 2000);

    expect(Math.max(size.width, size.height)).toBe(2000);
    expect(size).toEqual({ width: 2000, height: 1500 });
  });

  it('houdt de verhouding aan bij een panorama', () => {
    const size = targetSize(6000, 1000, 2000);

    expect(size).toEqual({ width: 2000, height: 333 });
    expect(size.height).toBeGreaterThan(0);
  });

  /** Afronden mag nooit op nul uitkomen; dan is er niets meer te tekenen. */
  it('houdt een extreem smalle afbeelding minstens één pixel hoog', () => {
    expect(targetSize(20000, 3, 2000).height).toBeGreaterThanOrEqual(1);
  });

  it('valt niet om op afmetingen van nul', () => {
    expect(targetSize(0, 0, 2000)).toEqual({ width: 0, height: 0 });
  });
});
