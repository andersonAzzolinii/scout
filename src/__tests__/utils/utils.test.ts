import { generateId, formatTime, formatDate } from '@/utils';

describe('Utils', () => {
  describe('generateId', () => {
    it('should generate a UUID v4-like string', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });

    it('should always have version 4 marker', () => {
      for (let i = 0; i < 50; i++) {
        const id = generateId();
        expect(id[14]).toBe('4');
      }
    });

    it('should always have correct variant bits', () => {
      for (let i = 0; i < 50; i++) {
        const id = generateId();
        expect(['8', '9', 'a', 'b']).toContain(id[19]);
      }
    });
  });

  describe('formatTime', () => {
    it('should format 0 seconds as 00:00', () => {
      expect(formatTime(0)).toBe('00:00');
    });

    it('should format 65 seconds as 01:05', () => {
      expect(formatTime(65)).toBe('01:05');
    });

    it('should format 600 seconds as 10:00', () => {
      expect(formatTime(600)).toBe('10:00');
    });

    it('should format 1200 seconds (20 min) as 20:00', () => {
      expect(formatTime(1200)).toBe('20:00');
    });

    it('should handle large values (90 min half)', () => {
      expect(formatTime(5400)).toBe('90:00');
    });

    it('should pad minutes and seconds with leading zeros', () => {
      expect(formatTime(9)).toBe('00:09');
      expect(formatTime(61)).toBe('01:01');
    });
  });

  describe('formatDate', () => {
    it('should format ISO datetime to pt-BR format (DD/MM/YYYY)', () => {
      const result = formatDate('2024-03-20T12:00:00.000Z');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should return a string with slashes', () => {
      const result = formatDate('2024-01-15T10:00:00.000Z');
      expect(result.split('/')).toHaveLength(3);
    });
  });
});
