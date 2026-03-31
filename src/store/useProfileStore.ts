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
  updateProfile: (id: string, name: string, sportType?: string) => void;
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
  updateProfile: (id, name, sportType) => {
    profileRepo.updateProfile(id, name, sportType);
    const profiles = profileRepo.getProfiles();
    set({ profiles });
  },
  deleteProfile: (id) => {
    profileRepo.deleteProfile(id);
    const profiles = profileRepo.getProfiles();
    set((state) => ({ 
      profiles,
      // Limpar categorias e eventos do perfil excluído
      categories: state.categories.filter((c) => c.profile_id !== id),
      events: state.events.filter((e) => {
        const category = state.categories.find((c) => c.id === e.category_id);
        return category?.profile_id !== id;
      })
    }));
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
    set((state) => ({ 
      categories: state.categories.filter((c) => c.id !== id),
      events: state.events.filter((e) => e.category_id !== id) // Remover eventos da categoria também
    }));
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
    const newEvent: ScoutEvent = { ...event, created_at: new Date().toISOString() };
    set((state) => ({ events: [...state.events, newEvent] }));
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
