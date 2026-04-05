import { EVENT_CATEGORIES } from '@/constants/eventCategories';
import type { EventCategory, EventDefinition } from '@/constants/eventCategories';

describe('Event Categories', () => {
  it('should be a non-empty array', () => {
    expect(Array.isArray(EVENT_CATEGORIES)).toBe(true);
    expect(EVENT_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('each category should have id, name, icon, and events array', () => {
    EVENT_CATEGORIES.forEach((cat: EventCategory) => {
      expect(cat.id).toBeDefined();
      expect(cat.name).toBeDefined();
      expect(cat.icon).toBeDefined();
      expect(Array.isArray(cat.events)).toBe(true);
      expect(cat.events.length).toBeGreaterThan(0);
    });
  });

  it('each event should have id, name, and sentiment', () => {
    EVENT_CATEGORIES.forEach((cat) => {
      cat.events.forEach((evt: EventDefinition) => {
        expect(evt.id).toBeDefined();
        expect(evt.name).toBeDefined();
        expect(['+', '-', '0']).toContain(evt.sentiment);
      });
    });
  });

  it('PASSE category should exist and have pass events', () => {
    const passe = EVENT_CATEGORIES.find((c) => c.id === 'passes');
    expect(passe).toBeDefined();
    expect(passe!.name).toBe('PASSE');
    const passeEvents = passe!.events.map((e) => e.id);
    expect(passeEvents).toContain('passe_certo');
    expect(passeEvents).toContain('passe_errado');
    expect(passeEvents).toContain('assistencia');
  });

  it('FINALIZAÇÃO category should have gol event', () => {
    const fin = EVENT_CATEGORIES.find((c) => c.id === 'finalizacao');
    expect(fin).toBeDefined();
    const evtIds = fin!.events.map((e) => e.id);
    expect(evtIds).toContain('gol');
    expect(evtIds).toContain('finalizacao_no_gol');
    expect(evtIds).toContain('finalizacao_fora');
  });

  it('DEFESA category should exist', () => {
    const def = EVENT_CATEGORIES.find((c) => c.id === 'defesa');
    expect(def).toBeDefined();
    const evtIds = def!.events.map((e) => e.id);
    expect(evtIds).toContain('desarme_com_posse');
    expect(evtIds).toContain('interceptacao');
  });

  it('events with showInHeader should have headerIcon and headerColor', () => {
    EVENT_CATEGORIES.forEach((cat) => {
      cat.events.forEach((evt: EventDefinition) => {
        if (evt.showInHeader) {
          expect(evt.headerIcon).toBeDefined();
          expect(evt.headerColor).toBeDefined();
          expect(evt.headerColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        }
      });
    });
  });

  it('all event IDs should be unique', () => {
    const evtIds = EVENT_CATEGORIES.flatMap((c) => c.events.map((e) => e.id));
    const unique = new Set(evtIds);
    expect(unique.size).toBe(evtIds.length);
  });

  it('all category IDs should be unique', () => {
    const catIds = EVENT_CATEGORIES.map((c) => c.id);
    const unique = new Set(catIds);
    expect(unique.size).toBe(catIds.length);
  });
});
