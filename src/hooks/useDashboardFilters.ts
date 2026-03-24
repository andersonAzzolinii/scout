import { useState, useEffect } from 'react';
import * as statsRepo from '@/database/repositories/statsRepository';

export function useDashboardFilters() {
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Array<{ id: string; name: string; number: number }>>([]);
  const [availableProfiles, setAvailableProfiles] = useState<Array<{ id: string; name: string }>>([]);
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [availableEvents, setAvailableEvents] = useState<Array<{ id: string; name: string; icon: string }>>([]);
  const [availableOpponents, setAvailableOpponents] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ minDate: string | null; maxDate: string | null }>({ minDate: null, maxDate: null });

  useEffect(() => {
    // Load all filter options
    const teams = statsRepo.getAvailableTeams();
    const players = statsRepo.getAvailablePlayers();
    const profiles = statsRepo.getAvailableProfiles();
    const categories = statsRepo.getAvailableCategories();
    const events = statsRepo.getAvailableEvents();
    const opponents = statsRepo.getAvailableOpponents();
    const locations = statsRepo.getAvailableLocations();
    const range = statsRepo.getDateRange();

    setAvailableTeams(teams);
    setAvailablePlayers(players);
    setAvailableProfiles(profiles);
    setAvailableCategories(categories);
    setAvailableEvents(events);
    setAvailableOpponents(opponents);
    setAvailableLocations(locations);
    setDateRange(range);
  }, []);

  return {
    availableTeams,
    availablePlayers,
    availableProfiles,
    availableCategories,
    availableEvents,
    availableOpponents,
    availableLocations,
    dateRange,
  };
}
