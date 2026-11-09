import { describe, expect, it } from 'vitest';

import { phoneHref } from './phoneHref';

describe('phoneHref', () => {
  it('houdt alleen cijfers over', () => {
    expect(phoneHref('06-12 34 56 78')).toBe('tel:0612345678');
    expect(phoneHref('030 123 4567')).toBe('tel:0301234567');
  });

  it('laat de (0) na het landnummer weg in plaats van hem mee te bellen', () => {
    expect(phoneHref('+31 (0)6 12 34 56 78')).toBe('tel:+31612345678');
  });
});
