import type {
  Ward,
  Nurse,
  Schedule,
  ShiftRequest,
  VacationRequest,
  WardInsert,
  NurseInsert,
  ScheduleInsert,
  ShiftRequestInsert,
  VacationRequestInsert,
} from '@/types/database';
import { generateId } from './utils';

const STORAGE_KEYS = {
  WARDS: 'nurse-scheduler-wards',
  NURSES: 'nurse-scheduler-nurses',
  SCHEDULES: 'nurse-scheduler-schedules',
  SHIFT_REQUESTS: 'nurse-scheduler-shift-requests',
  VACATION_REQUESTS: 'nurse-scheduler-vacation-requests',
} as const;

function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

export const localDb = {
  wards: {
    getAll: (): Ward[] => getFromStorage<Ward>(STORAGE_KEYS.WARDS),
    
    getById: (id: string): Ward | undefined => {
      return localDb.wards.getAll().find(w => w.id === id);
    },
    
    create: (data: WardInsert): Ward => {
      const ward: Ward = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const wards = localDb.wards.getAll();
      wards.push(ward);
      setToStorage(STORAGE_KEYS.WARDS, wards);
      return ward;
    },
    
    update: (id: string, data: Partial<WardInsert>): Ward | undefined => {
      const wards = localDb.wards.getAll();
      const index = wards.findIndex(w => w.id === id);
      if (index === -1) return undefined;
      
      wards[index] = {
        ...wards[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      setToStorage(STORAGE_KEYS.WARDS, wards);
      return wards[index];
    },
    
    delete: (id: string): boolean => {
      const wards = localDb.wards.getAll();
      const filtered = wards.filter(w => w.id !== id);
      if (filtered.length === wards.length) return false;
      setToStorage(STORAGE_KEYS.WARDS, filtered);
      return true;
    },
  },

  nurses: {
    getAll: (): Nurse[] => getFromStorage<Nurse>(STORAGE_KEYS.NURSES),
    
    getByWard: (wardId: string): Nurse[] => {
      return localDb.nurses.getAll().filter(n => n.wardId === wardId && n.isActive);
    },
    
    getById: (id: string): Nurse | undefined => {
      return localDb.nurses.getAll().find(n => n.id === id);
    },
    
    create: (data: NurseInsert): Nurse => {
      const nurse: Nurse = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const nurses = localDb.nurses.getAll();
      nurses.push(nurse);
      setToStorage(STORAGE_KEYS.NURSES, nurses);
      return nurse;
    },
    
    update: (id: string, data: Partial<NurseInsert>): Nurse | undefined => {
      const nurses = localDb.nurses.getAll();
      const index = nurses.findIndex(n => n.id === id);
      if (index === -1) return undefined;
      
      nurses[index] = {
        ...nurses[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      setToStorage(STORAGE_KEYS.NURSES, nurses);
      return nurses[index];
    },
    
    delete: (id: string): boolean => {
      const nurses = localDb.nurses.getAll();
      const index = nurses.findIndex(n => n.id === id);
      if (index === -1) return false;
      
      nurses[index].isActive = false;
      nurses[index].updatedAt = new Date().toISOString();
      setToStorage(STORAGE_KEYS.NURSES, nurses);
      return true;
    },
  },

  schedules: {
    getAll: (): Schedule[] => getFromStorage<Schedule>(STORAGE_KEYS.SCHEDULES),
    
    getByWardAndMonth: (wardId: string, year: number, month: number): Schedule[] => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      return localDb.schedules.getAll().filter(
        s => s.wardId === wardId && s.date >= startDate && s.date <= endDate
      );
    },
    
    getByNurseAndMonth: (nurseId: string, year: number, month: number): Schedule[] => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      return localDb.schedules.getAll().filter(
        s => s.nurseId === nurseId && s.date >= startDate && s.date <= endDate
      );
    },
    
    getById: (id: string): Schedule | undefined => {
      return localDb.schedules.getAll().find(s => s.id === id);
    },
    
    create: (data: ScheduleInsert): Schedule => {
      const schedule: Schedule = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const schedules = localDb.schedules.getAll();
      schedules.push(schedule);
      setToStorage(STORAGE_KEYS.SCHEDULES, schedules);
      return schedule;
    },
    
    upsert: (data: ScheduleInsert): Schedule => {
      const schedules = localDb.schedules.getAll();
      const existingIndex = schedules.findIndex(
        s => s.wardId === data.wardId && s.nurseId === data.nurseId && s.date === data.date
      );
      
      if (existingIndex !== -1) {
        schedules[existingIndex] = {
          ...schedules[existingIndex],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        setToStorage(STORAGE_KEYS.SCHEDULES, schedules);
        return schedules[existingIndex];
      }
      
      return localDb.schedules.create(data);
    },
    
    bulkCreate: (dataList: ScheduleInsert[]): Schedule[] => {
      const schedules = localDb.schedules.getAll();
      const newSchedules = dataList.map(data => ({
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      schedules.push(...newSchedules);
      setToStorage(STORAGE_KEYS.SCHEDULES, schedules);
      return newSchedules;
    },
    
    deleteByWardAndMonth: (wardId: string, year: number, month: number): number => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      const schedules = localDb.schedules.getAll();
      const filtered = schedules.filter(
        s => !(s.wardId === wardId && s.date >= startDate && s.date <= endDate && !s.isLocked)
      );
      
      const deletedCount = schedules.length - filtered.length;
      setToStorage(STORAGE_KEYS.SCHEDULES, filtered);
      return deletedCount;
    },
    
    update: (id: string, data: Partial<ScheduleInsert>): Schedule | undefined => {
      const schedules = localDb.schedules.getAll();
      const index = schedules.findIndex(s => s.id === id);
      if (index === -1) return undefined;
      
      schedules[index] = {
        ...schedules[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      setToStorage(STORAGE_KEYS.SCHEDULES, schedules);
      return schedules[index];
    },
  },

  shiftRequests: {
    getAll: (): ShiftRequest[] => getFromStorage<ShiftRequest>(STORAGE_KEYS.SHIFT_REQUESTS),
    
    getByNurseAndMonth: (nurseId: string, year: number, month: number): ShiftRequest[] => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      return localDb.shiftRequests.getAll().filter(
        r => r.nurseId === nurseId && r.date >= startDate && r.date <= endDate
      );
    },
    
    getByWardAndMonth: (wardId: string, year: number, month: number): ShiftRequest[] => {
      const nurses = localDb.nurses.getByWard(wardId);
      const nurseIds = new Set(nurses.map(n => n.id));
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      return localDb.shiftRequests.getAll().filter(
        r => nurseIds.has(r.nurseId) && r.date >= startDate && r.date <= endDate
      );
    },
    
    create: (data: ShiftRequestInsert): ShiftRequest => {
      const request: ShiftRequest = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const requests = localDb.shiftRequests.getAll();
      requests.push(request);
      setToStorage(STORAGE_KEYS.SHIFT_REQUESTS, requests);
      return request;
    },
    
    update: (id: string, data: Partial<ShiftRequestInsert>): ShiftRequest | undefined => {
      const requests = localDb.shiftRequests.getAll();
      const index = requests.findIndex(r => r.id === id);
      if (index === -1) return undefined;
      
      requests[index] = {
        ...requests[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      setToStorage(STORAGE_KEYS.SHIFT_REQUESTS, requests);
      return requests[index];
    },
    
    delete: (id: string): boolean => {
      const requests = localDb.shiftRequests.getAll();
      const filtered = requests.filter(r => r.id !== id);
      if (filtered.length === requests.length) return false;
      setToStorage(STORAGE_KEYS.SHIFT_REQUESTS, filtered);
      return true;
    },
  },

  vacationRequests: {
    getAll: (): VacationRequest[] => getFromStorage<VacationRequest>(STORAGE_KEYS.VACATION_REQUESTS),
    
    getByNurse: (nurseId: string): VacationRequest[] => {
      return localDb.vacationRequests.getAll().filter(r => r.nurseId === nurseId);
    },
    
    getByWardAndMonth: (wardId: string, year: number, month: number): VacationRequest[] => {
      const nurses = localDb.nurses.getByWard(wardId);
      const nurseIds = new Set(nurses.map(n => n.id));
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      return localDb.vacationRequests.getAll().filter(
        r => nurseIds.has(r.nurseId) && r.startDate <= endDate && r.endDate >= startDate
      );
    },
    
    create: (data: VacationRequestInsert): VacationRequest => {
      const request: VacationRequest = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const requests = localDb.vacationRequests.getAll();
      requests.push(request);
      setToStorage(STORAGE_KEYS.VACATION_REQUESTS, requests);
      return request;
    },
    
    update: (id: string, data: Partial<VacationRequestInsert>): VacationRequest | undefined => {
      const requests = localDb.vacationRequests.getAll();
      const index = requests.findIndex(r => r.id === id);
      if (index === -1) return undefined;
      
      requests[index] = {
        ...requests[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      setToStorage(STORAGE_KEYS.VACATION_REQUESTS, requests);
      return requests[index];
    },
    
    delete: (id: string): boolean => {
      const requests = localDb.vacationRequests.getAll();
      const filtered = requests.filter(r => r.id !== id);
      if (filtered.length === requests.length) return false;
      setToStorage(STORAGE_KEYS.VACATION_REQUESTS, filtered);
      return true;
    },
  },
};
