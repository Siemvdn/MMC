import { describe, expect, it } from 'vitest';

import { safeWebsite } from './safeWebsite';

describe('safeWebsite', () => {
  it('laat een gewoon http- of https-adres door', () => {
    expect(safeWebsite('https://voorbeeld.nl')).toBe('https://voorbeeld.nl/');
    expect(safeWebsite('http://voorbeeld.nl/werk')).toBe('http://voorbeeld.nl/werk');
  });

  it('maakt geen link van een leeg veld', () => {
    expect(safeWebsite('')).toBeNull();
    expect(safeWebsite('   ')).toBeNull();
  });

  it('weigert adressen die script kunnen uitvoeren', () => {
    expect(safeWebsite('javascript:alert(1)')).toBeNull();
    expect(safeWebsite('JavaScript:alert(1)')).toBeNull();
    expect(safeWebsite('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('weigert een onvolledig adres', () => {
    expect(safeWebsite('www.voorbeeld.nl')).toBeNull();
  });
});
