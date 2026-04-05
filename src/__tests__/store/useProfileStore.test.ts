/**
 * Tests for useProfileStore — scout profiles, categories, and events management.
 */
import { useProfileStore } from '@/store/useProfileStore';
import {
  IDS,
  mockProfile,
  mockCategories,
  mockScoutEvents,
} from '../mocks/mockData';

// ─── Mock repository ────────────────────────────────────────────────────────
jest.mock('@/database/repositories/profileRepository', () => ({
  getProfiles: jest.fn().mockReturnValue([]),
  createProfile: jest.fn(),
  updateProfile: jest.fn(),
  deleteProfile: jest.fn(),
  getCategoriesByProfile: jest.fn().mockReturnValue([]),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
  getEventsByCategory: jest.fn().mockReturnValue([]),
  getEventsByProfile: jest.fn().mockReturnValue([]),
  createScoutEvent: jest.fn(),
  updateScoutEvent: jest.fn(),
  deleteScoutEvent: jest.fn(),
}));

const profileRepo = require('@/database/repositories/profileRepository');

describe('useProfileStore', () => {
  beforeEach(() => {
    useProfileStore.setState({
      profiles: [],
      categories: [],
      events: [],
    });
    jest.clearAllMocks();
  });

  // ─── Profiles ───────────────────────────────────────────────────────────
  describe('Profiles', () => {
    it('loadProfiles should populate from repository', () => {
      profileRepo.getProfiles.mockReturnValue([mockProfile]);
      useProfileStore.getState().loadProfiles();
      expect(useProfileStore.getState().profiles).toEqual([mockProfile]);
    });

    it('createProfile should persist and reload', () => {
      profileRepo.getProfiles.mockReturnValue([mockProfile]);
      useProfileStore.getState().createProfile(mockProfile);
      expect(profileRepo.createProfile).toHaveBeenCalledWith(mockProfile);
      expect(useProfileStore.getState().profiles).toHaveLength(1);
    });

    it('updateProfile should persist and reload', () => {
      profileRepo.getProfiles.mockReturnValue([{ ...mockProfile, name: 'Updated' }]);
      useProfileStore.getState().updateProfile(IDS.profile, 'Updated', 'society');
      expect(profileRepo.updateProfile).toHaveBeenCalledWith(IDS.profile, 'Updated', 'society');
    });

    it('deleteProfile should remove and clean up categories and events', () => {
      useProfileStore.setState({
        profiles: [mockProfile],
        categories: mockCategories,
        events: mockScoutEvents,
      });
      profileRepo.getProfiles.mockReturnValue([]);

      useProfileStore.getState().deleteProfile(IDS.profile);

      expect(profileRepo.deleteProfile).toHaveBeenCalledWith(IDS.profile);
      expect(useProfileStore.getState().profiles).toHaveLength(0);
      // Categories belonging to deleted profile should be cleaned up
      expect(useProfileStore.getState().categories).toHaveLength(0);
    });
  });

  // ─── Categories ─────────────────────────────────────────────────────────
  describe('Categories', () => {
    it('loadCategories should fetch by profile', () => {
      profileRepo.getCategoriesByProfile.mockReturnValue(mockCategories);
      useProfileStore.getState().loadCategories(IDS.profile);
      expect(profileRepo.getCategoriesByProfile).toHaveBeenCalledWith(IDS.profile);
      expect(useProfileStore.getState().categories).toEqual(mockCategories);
    });

    it('createCategory should persist and reload', () => {
      profileRepo.getCategoriesByProfile.mockReturnValue(mockCategories);
      useProfileStore.getState().createCategory(mockCategories[0]);
      expect(profileRepo.createCategory).toHaveBeenCalledWith(mockCategories[0]);
    });

    it('updateCategory should update local state', () => {
      useProfileStore.setState({ categories: mockCategories });
      useProfileStore.getState().updateCategory(IDS.category1, 'PASSE ATUALIZADO', 5);
      const updated = useProfileStore.getState().categories.find((c) => c.id === IDS.category1);
      expect(updated?.name).toBe('PASSE ATUALIZADO');
      expect(updated?.order_index).toBe(5);
    });

    it('deleteCategory should remove category and related events', () => {
      useProfileStore.setState({
        categories: mockCategories,
        events: mockScoutEvents,
      });

      useProfileStore.getState().deleteCategory(IDS.category1);

      expect(profileRepo.deleteCategory).toHaveBeenCalledWith(IDS.category1);
      const cats = useProfileStore.getState().categories;
      expect(cats.find((c) => c.id === IDS.category1)).toBeUndefined();
      // Events of category1 (passe_certo, passe_errado) should be removed
      const evts = useProfileStore.getState().events;
      expect(evts.filter((e) => e.category_id === IDS.category1)).toHaveLength(0);
    });
  });

  // ─── Scout Events ──────────────────────────────────────────────────────
  describe('Scout Events', () => {
    it('loadEvents should fetch by category', () => {
      const catEvents = mockScoutEvents.filter((e) => e.category_id === IDS.category1);
      profileRepo.getEventsByCategory.mockReturnValue(catEvents);
      useProfileStore.getState().loadEvents(IDS.category1);
      expect(profileRepo.getEventsByCategory).toHaveBeenCalledWith(IDS.category1);
      expect(useProfileStore.getState().events).toEqual(catEvents);
    });

    it('loadEventsByProfile should fetch all events for a profile', () => {
      profileRepo.getEventsByProfile.mockReturnValue(mockScoutEvents);
      useProfileStore.getState().loadEventsByProfile(IDS.profile);
      expect(profileRepo.getEventsByProfile).toHaveBeenCalledWith(IDS.profile);
      expect(useProfileStore.getState().events).toEqual(mockScoutEvents);
    });

    it('createEvent should persist and append to state', () => {
      useProfileStore.getState().createEvent(mockScoutEvents[0]);
      expect(profileRepo.createScoutEvent).toHaveBeenCalledWith(mockScoutEvents[0]);
      expect(useProfileStore.getState().events).toHaveLength(1);
    });

    it('updateEvent should update locally', () => {
      useProfileStore.setState({ events: mockScoutEvents });
      const updated = { ...mockScoutEvents[0], name: 'Passe perfeito', icon: '🎯' };
      useProfileStore.getState().updateEvent(updated);
      expect(profileRepo.updateScoutEvent).toHaveBeenCalledWith(updated);
      const evt = useProfileStore.getState().events.find((e) => e.id === IDS.event1);
      expect(evt?.name).toBe('Passe perfeito');
    });

    it('deleteEvent should remove from state', () => {
      useProfileStore.setState({ events: mockScoutEvents });
      useProfileStore.getState().deleteEvent(IDS.event1);
      expect(profileRepo.deleteScoutEvent).toHaveBeenCalledWith(IDS.event1);
      expect(useProfileStore.getState().events.find((e) => e.id === IDS.event1)).toBeUndefined();
    });
  });
});
