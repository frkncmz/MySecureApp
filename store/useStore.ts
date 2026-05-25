import { create } from 'zustand';
import { Flirt, getAllFlirts, getFlirtsSorted, searchFlirts, getFlirtsCount, getAverageFlirtScore, getTopRatedFlirts } from '@/database/flirts';
import { DateWithFlirt, getAllDates, getUpcomingDates, getUnratedDates, getDatesCount } from '@/database/dates';

export type SortOption = 'score' | 'name' | 'date';
export type FilterOption = 'active' | 'archived';

interface AppState {
  // Flirts
  flirts: Flirt[];
  isLoadingFlirts: boolean;
  sortBy: SortOption;
  filterBy: FilterOption;
  searchQuery: string;

  // Dates
  dates: DateWithFlirt[];
  upcomingDates: DateWithFlirt[];
  unratedDates: DateWithFlirt[];

  // Dashboard stats
  totalFlirts: number;
  averageScore: number;
  totalDates: number;
  topRatedFlirts: Flirt[];

  // Actions
  loadFlirts: () => Promise<void>;
  setSortBy: (sort: SortOption) => void;
  setFilterBy: (filter: FilterOption) => void;
  setSearchQuery: (query: string) => void;
  loadDates: () => Promise<void>;
  loadUpcomingDates: () => Promise<void>;
  loadUnratedDates: () => Promise<void>;
  loadDashboardStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  flirts: [],
  isLoadingFlirts: false,
  sortBy: 'date',
  filterBy: 'active',
  searchQuery: '',

  dates: [],
  upcomingDates: [],
  unratedDates: [],

  totalFlirts: 0,
  averageScore: 0,
  totalDates: 0,
  topRatedFlirts: [],

  // Actions
  loadFlirts: async () => {
    set({ isLoadingFlirts: true });
    try {
      const { sortBy, filterBy, searchQuery } = get();

      let flirts: Flirt[];
      if (searchQuery.trim()) {
        flirts = await searchFlirts(searchQuery);
      } else {
        flirts = await getFlirtsSorted(sortBy, filterBy);
      }

      set({ flirts, isLoadingFlirts: false });
    } catch (error) {
      console.error('Failed to load flirts:', error);
      set({ isLoadingFlirts: false });
    }
  },

  setSortBy: (sortBy: SortOption) => {
    set({ sortBy });
    get().loadFlirts();
  },

  setFilterBy: (filterBy: FilterOption) => {
    set({ filterBy });
    get().loadFlirts();
  },

  setSearchQuery: (searchQuery: string) => {
    set({ searchQuery });
    get().loadFlirts();
  },

  loadDates: async () => {
    try {
      const dates = await getAllDates();
      set({ dates });
    } catch (error) {
      console.error('Failed to load dates:', error);
    }
  },

  loadUpcomingDates: async () => {
    try {
      const upcomingDates = await getUpcomingDates();
      set({ upcomingDates });
    } catch (error) {
      console.error('Failed to load upcoming dates:', error);
    }
  },

  loadUnratedDates: async () => {
    try {
      const unratedDates = await getUnratedDates();
      set({ unratedDates });
    } catch (error) {
      console.error('Failed to load unrated dates:', error);
    }
  },

  loadDashboardStats: async () => {
    try {
      const [totalFlirts, averageScore, totalDates, topRatedFlirts] = await Promise.all([
        getFlirtsCount(),
        getAverageFlirtScore(),
        getDatesCount(),
        getTopRatedFlirts(5),
      ]);
      set({ totalFlirts, averageScore, totalDates, topRatedFlirts });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  },

  refreshAll: async () => {
    const { loadFlirts, loadDates, loadUpcomingDates, loadUnratedDates, loadDashboardStats } = get();
    await Promise.all([
      loadFlirts(),
      loadDates(),
      loadUpcomingDates(),
      loadUnratedDates(),
      loadDashboardStats(),
    ]);
  },
}));
