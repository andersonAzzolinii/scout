import {
  SVG_WIDTH,
  SVG_HEIGHT,
  SVG_ASPECT_RATIO,
  FIXED_POSITIONS,
  POSITION_BUTTON,
  BENCH_PANEL,
  COURT_COLORS,
} from '@/constants/futsal.constants';

describe('Futsal Constants', () => {
  describe('SVG Dimensions', () => {
    it('should have correct SVG dimensions', () => {
      expect(SVG_WIDTH).toBe(400);
      expect(SVG_HEIGHT).toBe(600);
    });

    it('aspect ratio should match width/height', () => {
      expect(SVG_ASPECT_RATIO).toBeCloseTo(SVG_WIDTH / SVG_HEIGHT, 5);
    });
  });

  describe('FIXED_POSITIONS', () => {
    it('should have exactly 5 positions (futsal)', () => {
      expect(Object.keys(FIXED_POSITIONS)).toHaveLength(5);
    });

    it('should have positions 1-5', () => {
      expect(FIXED_POSITIONS[1]).toBeDefined();
      expect(FIXED_POSITIONS[2]).toBeDefined();
      expect(FIXED_POSITIONS[3]).toBeDefined();
      expect(FIXED_POSITIONS[4]).toBeDefined();
      expect(FIXED_POSITIONS[5]).toBeDefined();
    });

    it('each position should have valid xPercent and yPercent (0-100)', () => {
      for (const key of Object.keys(FIXED_POSITIONS)) {
        const pos = FIXED_POSITIONS[Number(key)];
        expect(pos.xPercent).toBeGreaterThanOrEqual(0);
        expect(pos.xPercent).toBeLessThanOrEqual(100);
        expect(pos.yPercent).toBeGreaterThanOrEqual(0);
        expect(pos.yPercent).toBeLessThanOrEqual(100);
      }
    });

    it('GOL should be the deepest position (highest yPercent)', () => {
      const golY = FIXED_POSITIONS[1].yPercent;
      for (let i = 2; i <= 5; i++) {
        expect(golY).toBeGreaterThan(FIXED_POSITIONS[i].yPercent);
      }
    });

    it('PIV should be the most advanced position (lowest yPercent)', () => {
      const pivY = FIXED_POSITIONS[5].yPercent;
      for (let i = 1; i <= 4; i++) {
        expect(pivY).toBeLessThan(FIXED_POSITIONS[i].yPercent);
      }
    });

    it('positions should have correct labels', () => {
      expect(FIXED_POSITIONS[1].label).toBe('GOL');
      expect(FIXED_POSITIONS[2].label).toBe('FIX');
      expect(FIXED_POSITIONS[3].label).toBe('ALA');
      expect(FIXED_POSITIONS[4].label).toBe('ALA');
      expect(FIXED_POSITIONS[5].label).toBe('PIV');
    });

    it('ALA positions should be symmetrical on x-axis', () => {
      const alaLeft = FIXED_POSITIONS[3].xPercent;
      const alaRight = FIXED_POSITIONS[4].xPercent;
      // Both should be equidistant from center (50)
      expect(50 - alaLeft).toBeCloseTo(alaRight - 50, 1);
    });

    it('GOL, FIX, PIV should be centered on x-axis', () => {
      expect(FIXED_POSITIONS[1].xPercent).toBe(50);
      expect(FIXED_POSITIONS[2].xPercent).toBe(50);
      expect(FIXED_POSITIONS[5].xPercent).toBe(50);
    });
  });

  describe('BENCH_PANEL', () => {
    it('expanded should be taller than collapsed', () => {
      expect(BENCH_PANEL.expandedHeight).toBeGreaterThan(BENCH_PANEL.collapsedHeight);
    });

    it('animation duration should be positive', () => {
      expect(BENCH_PANEL.animationDuration).toBeGreaterThan(0);
    });
  });

  describe('POSITION_BUTTON', () => {
    it('occupied size should be larger than empty', () => {
      expect(POSITION_BUTTON.sizeOccupied).toBeGreaterThan(POSITION_BUTTON.size);
    });
  });
});
