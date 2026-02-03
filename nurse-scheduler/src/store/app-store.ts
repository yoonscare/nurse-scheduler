'use client';

import { create } from 'zustand';
import type {
  Ward,
  Nurse,
  Schedule,
  ShiftRequest,
  VacationRequest,
  WardInsert,
  NurseInsert,
  ShiftRequestInsert,
  VacationRequestInsert,
  ScheduleGenerationConfig,
  ShiftType,
} from '@/types/database';
import { localDb } from '@/lib/local-storage';
import { generateSchedule } from '@/lib/schedule-generator';

interface AppState {
  wards: Ward[];
  nurses: Nurse[];
  schedules: Schedule[];
  shiftRequests: ShiftRequest[];
  vacationRequests: VacationRequest[];
  
  selectedWardId: string | null;
  selectedYear: number;
  selectedMonth: number;
  
  isLoading: boolean;
  
  loadAllData: () => void;
  
  setSelectedWard: (wardId: string | null) => void;
  setSelectedMonth: (year: number, month: number) => void;
  
  createWard: (data: WardInsert) => Ward;
  updateWard: (id: string, data: Partial<WardInsert>) => void;
  deleteWard: (id: string) => void;
  
  createNurse: (data: NurseInsert) => Nurse;
  updateNurse: (id: string, data: Partial<NurseInsert>) => void;
  deleteNurse: (id: string) => void;
  getNursesByWard: (wardId: string) => Nurse[];
  
  createShiftRequest: (data: ShiftRequestInsert) => ShiftRequest;
  updateShiftRequest: (id: string, data: Partial<ShiftRequestInsert>) => void;
  deleteShiftRequest: (id: string) => void;
  getShiftRequestsByWardAndMonth: (wardId: string, year: number, month: number) => ShiftRequest[];
  
  createVacationRequest: (data: VacationRequestInsert) => VacationRequest;
  updateVacationRequest: (id: string, data: Partial<VacationRequestInsert>) => void;
  deleteVacationRequest: (id: string) => void;
  
  generateMonthlySchedule: (config: ScheduleGenerationConfig) => Schedule[];
  updateSchedule: (id: string, shiftType: ShiftType) => void;
  getSchedulesByWardAndMonth: (wardId: string, year: number, month: number) => Schedule[];
  
  getMonthlyStats: (wardId: string, year: number, month: number) => Map<string, {
    day: number;
    evening: number;
    night: number;
    off: number;
    split: number;
    vacation: number;
    weekendWork: number;
  }>;
}

export const useAppStore = create<AppState>((set, get) => ({
  wards: [],
  nurses: [],
  schedules: [],
  shiftRequests: [],
  vacationRequests: [],
  
  selectedWardId: null,
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1,
  
  isLoading: false,
  
  loadAllData: () => {
    set({ isLoading: true });
    const wards = localDb.wards.getAll();
    const nurses = localDb.nurses.getAll();
    const schedules = localDb.schedules.getAll();
    const shiftRequests = localDb.shiftRequests.getAll();
    const vacationRequests = localDb.vacationRequests.getAll();
    
    set({
      wards,
      nurses,
      schedules,
      shiftRequests,
      vacationRequests,
      selectedWardId: wards.length > 0 ? wards[0].id : null,
      isLoading: false,
    });
  },
  
  setSelectedWard: (wardId) => set({ selectedWardId: wardId }),
  
  setSelectedMonth: (year, month) => set({ selectedYear: year, selectedMonth: month }),
  
  createWard: (data) => {
    const ward = localDb.wards.create(data);
    set(state => ({ wards: [...state.wards, ward] }));
    return ward;
  },
  
  updateWard: (id, data) => {
    const updated = localDb.wards.update(id, data);
    if (updated) {
      set(state => ({
        wards: state.wards.map(w => w.id === id ? updated : w),
      }));
    }
  },
  
  deleteWard: (id) => {
    localDb.wards.delete(id);
    set(state => ({
      wards: state.wards.filter(w => w.id !== id),
      selectedWardId: state.selectedWardId === id ? null : state.selectedWardId,
    }));
  },
  
  createNurse: (data) => {
    const nurse = localDb.nurses.create(data);
    set(state => ({ nurses: [...state.nurses, nurse] }));
    return nurse;
  },
  
  updateNurse: (id, data) => {
    const updated = localDb.nurses.update(id, data);
    if (updated) {
      set(state => ({
        nurses: state.nurses.map(n => n.id === id ? updated : n),
      }));
    }
  },
  
  deleteNurse: (id) => {
    localDb.nurses.delete(id);
    set(state => ({
      nurses: state.nurses.map(n => n.id === id ? { ...n, isActive: false } : n),
    }));
  },
  
  getNursesByWard: (wardId) => {
    return get().nurses.filter(n => n.wardId === wardId && n.isActive);
  },
  
  createShiftRequest: (data) => {
    const request = localDb.shiftRequests.create(data);
    set(state => ({ shiftRequests: [...state.shiftRequests, request] }));
    return request;
  },
  
  updateShiftRequest: (id, data) => {
    const updated = localDb.shiftRequests.update(id, data);
    if (updated) {
      set(state => ({
        shiftRequests: state.shiftRequests.map(r => r.id === id ? updated : r),
      }));
    }
  },
  
  deleteShiftRequest: (id) => {
    localDb.shiftRequests.delete(id);
    set(state => ({
      shiftRequests: state.shiftRequests.filter(r => r.id !== id),
    }));
  },
  
  getShiftRequestsByWardAndMonth: (wardId, year, month) => {
    const nurses = get().getNursesByWard(wardId);
    const nurseIds = new Set(nurses.map(n => n.id));
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    return get().shiftRequests.filter(
      r => nurseIds.has(r.nurseId) && r.date >= startDate && r.date <= endDate
    );
  },
  
  createVacationRequest: (data) => {
    const request = localDb.vacationRequests.create(data);
    set(state => ({ vacationRequests: [...state.vacationRequests, request] }));
    return request;
  },
  
  updateVacationRequest: (id, data) => {
    const updated = localDb.vacationRequests.update(id, data);
    if (updated) {
      set(state => ({
        vacationRequests: state.vacationRequests.map(r => r.id === id ? updated : r),
      }));
    }
  },
  
  deleteVacationRequest: (id) => {
    localDb.vacationRequests.delete(id);
    set(state => ({
      vacationRequests: state.vacationRequests.filter(r => r.id !== id),
    }));
  },
  
  generateMonthlySchedule: (config) => {
    const { wards, nurses, shiftRequests, vacationRequests } = get();
    const ward = wards.find(w => w.id === config.wardId);
    if (!ward) return [];
    
    const wardNurses = nurses.filter(n => n.wardId === config.wardId && n.isActive);
    const wardShiftRequests = localDb.shiftRequests.getByWardAndMonth(
      config.wardId,
      config.year,
      config.month
    );
    const wardVacationRequests = localDb.vacationRequests.getByWardAndMonth(
      config.wardId,
      config.year,
      config.month
    );
    
    localDb.schedules.deleteByWardAndMonth(config.wardId, config.year, config.month);
    
    const scheduleInserts = generateSchedule(
      ward,
      wardNurses,
      config,
      wardShiftRequests,
      wardVacationRequests
    );
    
    const newSchedules = localDb.schedules.bulkCreate(scheduleInserts);
    
    set(state => {
      const otherSchedules = state.schedules.filter(s => {
        const scheduleMonth = parseInt(s.date.split('-')[1]);
        const scheduleYear = parseInt(s.date.split('-')[0]);
        return !(s.wardId === config.wardId && scheduleYear === config.year && scheduleMonth === config.month);
      });
      return { schedules: [...otherSchedules, ...newSchedules] };
    });
    
    return newSchedules;
  },
  
  updateSchedule: (id, shiftType) => {
    const updated = localDb.schedules.update(id, { shiftType });
    if (updated) {
      set(state => ({
        schedules: state.schedules.map(s => s.id === id ? updated : s),
      }));
    }
  },
  
  getSchedulesByWardAndMonth: (wardId, year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    return get().schedules.filter(
      s => s.wardId === wardId && s.date >= startDate && s.date <= endDate
    );
  },
  
  getMonthlyStats: (wardId, year, month) => {
    const schedules = get().getSchedulesByWardAndMonth(wardId, year, month);
    const stats = new Map<string, {
      day: number;
      evening: number;
      night: number;
      off: number;
      split: number;
      vacation: number;
      weekendWork: number;
    }>();
    
    for (const schedule of schedules) {
      if (!stats.has(schedule.nurseId)) {
        stats.set(schedule.nurseId, {
          day: 0,
          evening: 0,
          night: 0,
          off: 0,
          split: 0,
          vacation: 0,
          weekendWork: 0,
        });
      }
      
      const nurseStats = stats.get(schedule.nurseId)!;
      const date = new Date(schedule.date);
      const isWeekendDay = date.getDay() === 0 || date.getDay() === 6;
      
      switch (schedule.shiftType) {
        case 'DAY':
          nurseStats.day++;
          break;
        case 'EVENING':
          nurseStats.evening++;
          break;
        case 'NIGHT':
          nurseStats.night++;
          break;
        case 'OFF':
          nurseStats.off++;
          break;
        case 'SPLIT':
          nurseStats.split++;
          break;
        case 'VACATION':
        case 'ANNUAL_LEAVE':
          nurseStats.vacation++;
          break;
      }
      
      if (isWeekendDay && schedule.shiftType !== 'OFF' && schedule.shiftType !== 'VACATION') {
        nurseStats.weekendWork++;
      }
    }
    
    return stats;
  },
}));
