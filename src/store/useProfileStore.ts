import { create } from 'zustand';
import type { ScoutProfile, ScoutCategory, ScoutEvent } from '@/types';
import * as profileRepo from '@/database/repositories/profileRepository';

interface ProfileStore {
  profiles: ScoutProfile[];
  categories: ScoutCategory[];
  events: ScoutEvent[];
  // Profiles
  loadProfiles: () => void;
  createProfile: (profile: Omit<ScoutProfile, 'created_at'>) => void;
  updateProfile: (id: string, name: string) => void;
  deleteProfile: (id: string) => void;
  // Categories
  loadCategories: (profileId: string) => void;
  createCategory: (category: ScoutCategory) => void;
  updateCategory: (id: string, name: string, orderIndex: number) => void;
  deleteCategory: (id: string) => void;
  // Scout Events
  loadEvents: (categoryId: string) => void;
  loadEventsByProfile: (profileId: string) => void;
  createEvent: (event: Omit<ScoutEvent, 'created_at'>) => void;
  updateEvent: (event: Omit<ScoutEvent, 'created_at'>) => void;
  deleteEvent: (id: string) => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profiles: [],
  categories: [],
  events: [],

  loadProfiles: () => {
    const profiles = profileRepo.getProfiles();
    set({ profiles });
  },
  createProfile: (profile) => {
    profileRepo.createProfile(profile);
    const profiles = profileRepo.getProfiles();
    set({ profiles });
  },
  updateProfile: (id, name) => {
    profileRepo.updateProfile(id, name);
    const profiles = profileRepo.getProfiles();
    set({ profiles });
  },
  deleteProfile: (id) => {
    profileRepo.deleteProfile(id);
    const profiles = profileRepo.getProfiles();
    set({ profiles });
  },

  loadCategories: (profileId) => {
    const categories = profileRepo.getCategoriesByProfile(profileId);
    set({ categories });
  },
  createCategory: (category) => {
    profileRepo.createCategory(category);
    const categories = profileRepo.getCategoriesByProfile(category.profile_id);
    set({ categories });
  },
  updateCategory: (id, name, orderIndex) => {
    profileRepo.updateCategory(id, name, orderIndex);
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, name, order_index: orderIndex } : c
      ),
    }));
  },
  deleteCategory: (id) => {
    profileRepo.deleteCategory(id);
    set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
  },

  loadEvents: (categoryId) => {
    const events = profileRepo.getEventsByCategory(categoryId);
    set({ events });
  },
  loadEventsByProfile: (profileId) => {
    const events = profileRepo.getEventsByProfile(profileId);
    set({ events });
  },
  createEvent: (event) => {
    profileRepo.createScoutEvent(event);
    const events = profileRepo.getEventsByCategory(event.category_id);
    set({ events });
  },
  updateEvent: (event) => {
    profileRepo.updateScoutEvent(event);
    set((state) => ({
      events: state.events.map((e) => (e.id === event.id ? { ...e, ...event } : e)),
    }));
  },
  deleteEvent: (id) => {
    profileRepo.deleteScoutEvent(id);
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
  },
}));
