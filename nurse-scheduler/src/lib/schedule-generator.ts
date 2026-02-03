import type {
  Ward,
  Nurse,
  Schedule,
  ShiftRequest,
  VacationRequest,
  ShiftType,
  ScheduleInsert,
  ScheduleGenerationConfig,
  ExperienceLevel,
} from '@/types/database';
import { getDaysInMonth, getDateString, isWeekend } from './utils';

interface NurseScheduleState {
  nurse: Nurse;
  consecutiveWorkDays: number;
  consecutiveNights: number;
  lastShift: ShiftType | null;
  monthlyStats: {
    day: number;
    evening: number;
    night: number;
    off: number;
    split: number;
    weekendWork: number;
  };
}

interface DayAssignment {
  date: Date;
  dateString: string;
  dayNurses: string[];
  eveningNurses: string[];
  nightNurses: string[];
  offNurses: string[];
}

const SENIOR_LEVELS: ExperienceLevel[] = ['SENIOR', 'CHARGE'];

export class ScheduleGenerator {
  private ward: Ward;
  private nurses: Nurse[];
  private config: ScheduleGenerationConfig;
  private shiftRequests: Map<string, ShiftRequest>;
  private vacationDates: Map<string, Set<string>>;
  private nurseStates: Map<string, NurseScheduleState>;
  private assignments: Map<string, DayAssignment>;

  constructor(
    ward: Ward,
    nurses: Nurse[],
    config: ScheduleGenerationConfig,
    shiftRequests: ShiftRequest[],
    vacationRequests: VacationRequest[]
  ) {
    this.ward = ward;
    this.nurses = nurses.filter(n => n.isActive);
    this.config = config;
    
    this.shiftRequests = new Map();
    for (const req of shiftRequests) {
      if (req.status === 'APPROVED' || req.status === 'PENDING') {
        this.shiftRequests.set(`${req.nurseId}-${req.date}`, req);
      }
    }
    
    this.vacationDates = new Map();
    for (const vac of vacationRequests) {
      if (vac.status === 'APPROVED') {
        const start = new Date(vac.startDate);
        const end = new Date(vac.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = getDateString(d);
          if (!this.vacationDates.has(vac.nurseId)) {
            this.vacationDates.set(vac.nurseId, new Set());
          }
          this.vacationDates.get(vac.nurseId)!.add(dateStr);
        }
      }
    }
    
    this.nurseStates = new Map();
    this.assignments = new Map();
  }

  private initializeNurseStates(): void {
    for (const nurse of this.nurses) {
      this.nurseStates.set(nurse.id, {
        nurse,
        consecutiveWorkDays: 0,
        consecutiveNights: 0,
        lastShift: null,
        monthlyStats: {
          day: 0,
          evening: 0,
          night: 0,
          off: 0,
          split: 0,
          weekendWork: 0,
        },
      });
    }
  }

  private isNurseOnVacation(nurseId: string, dateStr: string): boolean {
    return this.vacationDates.get(nurseId)?.has(dateStr) ?? false;
  }

  private getNurseRequest(nurseId: string, dateStr: string): ShiftRequest | undefined {
    return this.shiftRequests.get(`${nurseId}-${dateStr}`);
  }

  private canAssignShift(
    nurseId: string,
    shift: ShiftType,
    dateStr: string
  ): { canAssign: boolean; reason?: string } {
    const state = this.nurseStates.get(nurseId)!;
    
    if (this.isNurseOnVacation(nurseId, dateStr)) {
      return { canAssign: false, reason: 'On vacation' };
    }
    
    if (shift !== 'OFF' && state.consecutiveWorkDays >= this.config.maxConsecutiveWorkDays) {
      return { canAssign: false, reason: 'Max consecutive work days reached' };
    }
    
    if (shift === 'NIGHT' && state.consecutiveNights >= this.config.maxConsecutiveNights) {
      return { canAssign: false, reason: 'Max consecutive nights reached' };
    }
    
    if (this.config.minRestAfterNight && state.lastShift === 'NIGHT' && shift === 'DAY') {
      return { canAssign: false, reason: 'Need rest after night shift' };
    }
    
    return { canAssign: true };
  }

  private getShiftPriority(nurseId: string, shift: ShiftType): number {
    const state = this.nurseStates.get(nurseId)!;
    const stats = state.monthlyStats;
    const totalDays = this.nurses.length > 0 
      ? getDaysInMonth(this.config.year, this.config.month).length 
      : 30;
    
    const targetPerNurse = {
      day: Math.floor(totalDays * 0.25),
      evening: Math.floor(totalDays * 0.25),
      night: Math.floor(totalDays * 0.2),
      off: Math.floor(totalDays * 0.3),
    };
    
    switch (shift) {
      case 'DAY':
        return targetPerNurse.day - stats.day;
      case 'EVENING':
        return targetPerNurse.evening - stats.evening;
      case 'NIGHT':
        return targetPerNurse.night - stats.night;
      case 'OFF':
        return stats.off < targetPerNurse.off ? 10 : -10;
      default:
        return 0;
    }
  }

  private selectNursesForShift(
    dateStr: string,
    shift: ShiftType,
    count: number,
    availableNurses: string[],
    isWeekendDay: boolean
  ): string[] {
    const selected: string[] = [];
    
    const nursesWithRequests = availableNurses.filter(id => {
      const request = this.getNurseRequest(id, dateStr);
      return request && request.requestedShift === shift;
    });
    
    for (const nurseId of nursesWithRequests) {
      if (selected.length >= count) break;
      const check = this.canAssignShift(nurseId, shift, dateStr);
      if (check.canAssign) {
        selected.push(nurseId);
      }
    }
    
    if (selected.length < count) {
      const remaining = availableNurses
        .filter(id => !selected.includes(id) && !nursesWithRequests.includes(id))
        .map(id => ({
          id,
          priority: this.getShiftPriority(id, shift),
          weekendWork: this.nurseStates.get(id)!.monthlyStats.weekendWork,
        }))
        .sort((a, b) => {
          if (this.config.balanceWeekends && isWeekendDay) {
            if (a.weekendWork !== b.weekendWork) {
              return a.weekendWork - b.weekendWork;
            }
          }
          return b.priority - a.priority;
        });
      
      for (const { id } of remaining) {
        if (selected.length >= count) break;
        const check = this.canAssignShift(id, shift, dateStr);
        if (check.canAssign) {
          selected.push(id);
        }
      }
    }
    
    return selected;
  }

  private ensureMixedExperience(
    selected: string[],
    shift: ShiftType,
    dateStr: string,
    availableNurses: string[]
  ): string[] {
    if (!this.config.requireMixedExperience || selected.length < 2) {
      return selected;
    }
    
    const hasSenior = selected.some(id => {
      const nurse = this.nurses.find(n => n.id === id);
      return nurse && SENIOR_LEVELS.includes(nurse.experienceLevel);
    });
    
    if (hasSenior) return selected;
    
    const seniorNurses = availableNurses
      .filter(id => !selected.includes(id))
      .filter(id => {
        const nurse = this.nurses.find(n => n.id === id);
        return nurse && SENIOR_LEVELS.includes(nurse.experienceLevel);
      })
      .filter(id => this.canAssignShift(id, shift, dateStr).canAssign);
    
    if (seniorNurses.length > 0) {
      const juniorToReplace = selected.find(id => {
        const nurse = this.nurses.find(n => n.id === id);
        return nurse && !SENIOR_LEVELS.includes(nurse.experienceLevel);
      });
      
      if (juniorToReplace) {
        const idx = selected.indexOf(juniorToReplace);
        selected[idx] = seniorNurses[0];
      }
    }
    
    return selected;
  }

  private updateNurseState(nurseId: string, shift: ShiftType, isWeekendDay: boolean): void {
    const state = this.nurseStates.get(nurseId)!;
    
    if (shift === 'OFF' || shift === 'VACATION' || shift === 'ANNUAL_LEAVE') {
      state.consecutiveWorkDays = 0;
      state.consecutiveNights = 0;
      state.monthlyStats.off++;
    } else {
      state.consecutiveWorkDays++;
      if (isWeekendDay) {
        state.monthlyStats.weekendWork++;
      }
      
      if (shift === 'NIGHT') {
        state.consecutiveNights++;
        state.monthlyStats.night++;
      } else {
        state.consecutiveNights = 0;
        if (shift === 'DAY') state.monthlyStats.day++;
        else if (shift === 'EVENING') state.monthlyStats.evening++;
        else if (shift === 'SPLIT') state.monthlyStats.split++;
      }
    }
    
    state.lastShift = shift;
  }

  generate(): ScheduleInsert[] {
    this.initializeNurseStates();
    
    const days = getDaysInMonth(this.config.year, this.config.month);
    const schedules: ScheduleInsert[] = [];
    
    for (const day of days) {
      const dateStr = getDateString(day);
      const isWeekendDay = isWeekend(day);
      
      const availableNurses = this.nurses
        .filter(n => !this.isNurseOnVacation(n.id, dateStr))
        .map(n => n.id);
      
      for (const nurse of this.nurses) {
        if (this.isNurseOnVacation(nurse.id, dateStr)) {
          schedules.push({
            wardId: this.ward.id,
            nurseId: nurse.id,
            date: dateStr,
            shiftType: 'VACATION',
            isLocked: true,
          });
          this.updateNurseState(nurse.id, 'VACATION', isWeekendDay);
        }
      }
      
      let dayNurses = this.selectNursesForShift(
        dateStr,
        'DAY',
        this.ward.minStaffDay,
        availableNurses,
        isWeekendDay
      );
      dayNurses = this.ensureMixedExperience(dayNurses, 'DAY', dateStr, availableNurses);
      
      const afterDay = availableNurses.filter(id => !dayNurses.includes(id));
      
      let eveningNurses = this.selectNursesForShift(
        dateStr,
        'EVENING',
        this.ward.minStaffEvening,
        afterDay,
        isWeekendDay
      );
      eveningNurses = this.ensureMixedExperience(eveningNurses, 'EVENING', dateStr, afterDay);
      
      const afterEvening = afterDay.filter(id => !eveningNurses.includes(id));
      
      let nightNurses = this.selectNursesForShift(
        dateStr,
        'NIGHT',
        this.ward.minStaffNight,
        afterEvening,
        isWeekendDay
      );
      nightNurses = this.ensureMixedExperience(nightNurses, 'NIGHT', dateStr, afterEvening);
      
      const offNurses = afterEvening.filter(id => !nightNurses.includes(id));
      
      for (const nurseId of dayNurses) {
        const request = this.getNurseRequest(nurseId, dateStr);
        const shiftType = request?.requestedShift === 'SPLIT' ? 'SPLIT' : 'DAY';
        schedules.push({
          wardId: this.ward.id,
          nurseId,
          date: dateStr,
          shiftType,
          isLocked: false,
        });
        this.updateNurseState(nurseId, shiftType, isWeekendDay);
      }
      
      for (const nurseId of eveningNurses) {
        schedules.push({
          wardId: this.ward.id,
          nurseId,
          date: dateStr,
          shiftType: 'EVENING',
          isLocked: false,
        });
        this.updateNurseState(nurseId, 'EVENING', isWeekendDay);
      }
      
      for (const nurseId of nightNurses) {
        schedules.push({
          wardId: this.ward.id,
          nurseId,
          date: dateStr,
          shiftType: 'NIGHT',
          isLocked: false,
        });
        this.updateNurseState(nurseId, 'NIGHT', isWeekendDay);
      }
      
      for (const nurseId of offNurses) {
        schedules.push({
          wardId: this.ward.id,
          nurseId,
          date: dateStr,
          shiftType: 'OFF',
          isLocked: false,
        });
        this.updateNurseState(nurseId, 'OFF', isWeekendDay);
      }
    }
    
    return schedules;
  }

  getStatistics(): Map<string, NurseScheduleState['monthlyStats']> {
    const stats = new Map<string, NurseScheduleState['monthlyStats']>();
    for (const [nurseId, state] of this.nurseStates) {
      stats.set(nurseId, { ...state.monthlyStats });
    }
    return stats;
  }
}

export function generateSchedule(
  ward: Ward,
  nurses: Nurse[],
  config: ScheduleGenerationConfig,
  shiftRequests: ShiftRequest[],
  vacationRequests: VacationRequest[]
): ScheduleInsert[] {
  const generator = new ScheduleGenerator(
    ward,
    nurses,
    config,
    shiftRequests,
    vacationRequests
  );
  return generator.generate();
}
