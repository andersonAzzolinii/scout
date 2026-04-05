import {
  SPORT_TYPES,
  SPORT_CONFIGS,
  SPORT_EVENT_SUGGESTIONS,
  getSportTypeLabel,
  getSportTypeIcon,
  getSportConfig,
} from '@/constants/sport.constants';

describe('Sport Constants', () => {
  describe('SPORT_TYPES', () => {
    it('should have all 4 sport types', () => {
      expect(Object.keys(SPORT_TYPES)).toEqual(['futsal', 'society', 'campo', 'all']);
    });

    it('should have label, icon and description for each type', () => {
      for (const key of Object.keys(SPORT_TYPES) as Array<keyof typeof SPORT_TYPES>) {
        expect(SPORT_TYPES[key]).toHaveProperty('label');
        expect(SPORT_TYPES[key]).toHaveProperty('icon');
        expect(SPORT_TYPES[key]).toHaveProperty('description');
      }
    });
  });

  describe('SPORT_CONFIGS', () => {
    it('futsal should have 5 players per team', () => {
      expect(SPORT_CONFIGS.futsal.playersPerTeam).toBe(5);
    });

    it('society should have 7 players per team', () => {
      expect(SPORT_CONFIGS.society.playersPerTeam).toBe(7);
    });

    it('campo should have 11 players per team', () => {
      expect(SPORT_CONFIGS.campo.playersPerTeam).toBe(11);
    });

    it('futsal should not have offside', () => {
      expect(SPORT_CONFIGS.futsal.hasOffside).toBe(false);
    });

    it('society and campo should have offside', () => {
      expect(SPORT_CONFIGS.society.hasOffside).toBe(true);
      expect(SPORT_CONFIGS.campo.hasOffside).toBe(true);
    });

    it('should have correct default durations', () => {
      expect(SPORT_CONFIGS.futsal.defaultDuration).toBe(40);
      expect(SPORT_CONFIGS.society.defaultDuration).toBe(50);
      expect(SPORT_CONFIGS.campo.defaultDuration).toBe(90);
    });
  });

  describe('SPORT_EVENT_SUGGESTIONS', () => {
    it('each sport should include Gol and Cartão amarelo', () => {
      for (const key of ['futsal', 'society', 'campo', 'all'] as const) {
        expect(SPORT_EVENT_SUGGESTIONS[key]).toContain('Gol');
        expect(SPORT_EVENT_SUGGESTIONS[key]).toContain('Cartão amarelo');
      }
    });

    it('futsal should include sport-specific events', () => {
      expect(SPORT_EVENT_SUGGESTIONS.futsal).toContain('Tiro de 7 metros');
      expect(SPORT_EVENT_SUGGESTIONS.futsal).toContain('Rodízio defensivo');
    });

    it('campo should include sport-specific events', () => {
      expect(SPORT_EVENT_SUGGESTIONS.campo).toContain('Cabeceio');
      expect(SPORT_EVENT_SUGGESTIONS.campo).toContain('Tiro livre direto');
    });
  });

  describe('getSportTypeLabel', () => {
    it('should return correct labels', () => {
      expect(getSportTypeLabel('futsal')).toBe('Futsal');
      expect(getSportTypeLabel('society')).toBe('Society');
      expect(getSportTypeLabel('campo')).toBe('Campo');
      expect(getSportTypeLabel('all')).toBe('Universal');
    });
  });

  describe('getSportTypeIcon', () => {
    it('should return correct icons', () => {
      expect(getSportTypeIcon('futsal')).toBe('soccer');
      expect(getSportTypeIcon('society')).toBe('stadium-variant');
      expect(getSportTypeIcon('campo')).toBe('stadium');
      expect(getSportTypeIcon('all')).toBe('earth');
    });
  });

  describe('getSportConfig', () => {
    it('should return config for futsal', () => {
      const config = getSportConfig('futsal');
      expect(config.playersPerTeam).toBe(5);
      expect(config.courtType).toBe('indoor');
    });

    it('should return config for society', () => {
      const config = getSportConfig('society');
      expect(config.playersPerTeam).toBe(7);
      expect(config.courtType).toBe('synthetic');
    });

    it('should return config for campo', () => {
      const config = getSportConfig('campo');
      expect(config.playersPerTeam).toBe(11);
      expect(config.courtType).toBe('grass');
    });
  });
});
