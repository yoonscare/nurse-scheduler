// 근무 유형
export type ShiftType = 'DAY' | 'EVENING' | 'NIGHT' | 'OFF' | 'SPLIT' | 'VACATION' | 'ANNUAL_LEAVE';

// 경력 레벨
export type ExperienceLevel = 'INTERN' | 'JUNIOR' | 'SENIOR' | 'CHARGE';

// 요청 상태
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// 병동 정보
export interface Ward {
  id: string;
  name: string;
  minStaffDay: number;      // Day 근무 최소 인원
  minStaffEvening: number;  // Evening 근무 최소 인원
  minStaffNight: number;    // Night 근무 최소 인원
  maxConsecutiveNights: number;  // 최대 연속 야간 근무 일수
  minRestHours: number;     // 최소 휴식 시간 (Night 후 Day 전)
  requireMixedExperience: boolean; // 경력 혼합 필수 여부
  createdAt: string;
  updatedAt: string;
}

// 간호사 정보
export interface Nurse {
  id: string;
  wardId: string;
  name: string;
  employeeNumber: string;   // 사번
  experienceLevel: ExperienceLevel;
  hireDate: string;
  annualLeaveTotal: number;  // 연차 총일수
  annualLeaveUsed: number;   // 사용한 연차
  isActive: boolean;
  phoneNumber?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

// 근무 스케줄
export interface Schedule {
  id: string;
  wardId: string;
  nurseId: string;
  date: string;             // YYYY-MM-DD
  shiftType: ShiftType;
  isLocked: boolean;        // 수정 불가 여부
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// 근무 요청 (간호사가 특정 날짜에 특정 근무를 요청)
export interface ShiftRequest {
  id: string;
  nurseId: string;
  date: string;
  requestedShift: ShiftType;
  reason?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

// 휴가 신청
export interface VacationRequest {
  id: string;
  nurseId: string;
  startDate: string;
  endDate: string;
  vacationType: 'ANNUAL_LEAVE' | 'SICK_LEAVE' | 'SPECIAL_LEAVE';
  reason?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

// 월별 스케줄 상태
export interface MonthlyScheduleStatus {
  wardId: string;
  year: number;
  month: number;
  isGenerated: boolean;
  isPublished: boolean;
  generatedAt?: string;
  publishedAt?: string;
}

// 근무 통계 (월별)
export interface NurseMonthlyStats {
  nurseId: string;
  year: number;
  month: number;
  dayCount: number;
  eveningCount: number;
  nightCount: number;
  offCount: number;
  splitCount: number;
  weekendCount: number;
  holidayCount: number;
}

// 스케줄 생성 설정
export interface ScheduleGenerationConfig {
  wardId: string;
  year: number;
  month: number;
  // 근무 제약조건
  maxConsecutiveWorkDays: number;    // 최대 연속 근무일
  maxConsecutiveNights: number;       // 최대 연속 야간
  minRestAfterNight: boolean;         // 야간 후 휴식 필수
  // 균등 분배 설정
  balanceWeekends: boolean;           // 주말 근무 균등 분배
  balanceHolidays: boolean;           // 공휴일 근무 균등 분배
  balanceNightShifts: boolean;        // 야간 근무 균등 분배
  // 경력 배치 설정
  requireMixedExperience: boolean;    // 경력 혼합 필수
}

// Supabase에서 사용할 Row 타입 (ID 없는 Insert용)
export type WardInsert = Omit<Ward, 'id' | 'createdAt' | 'updatedAt'>;
export type NurseInsert = Omit<Nurse, 'id' | 'createdAt' | 'updatedAt'>;
export type ScheduleInsert = Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>;
export type ShiftRequestInsert = Omit<ShiftRequest, 'id' | 'createdAt' | 'updatedAt'>;
export type VacationRequestInsert = Omit<VacationRequest, 'id' | 'createdAt' | 'updatedAt'>;

// 근무 타입 라벨 (한글)
export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  DAY: 'Day (주간)',
  EVENING: 'Evening (저녁)',
  NIGHT: 'Night (야간)',
  OFF: 'Off (휴무)',
  SPLIT: 'Split (9-18시)',
  VACATION: '휴가',
  ANNUAL_LEAVE: '연차',
};

// 근무 타입 색상
export const SHIFT_TYPE_COLORS: Record<ShiftType, string> = {
  DAY: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  EVENING: 'bg-orange-100 text-orange-800 border-orange-300',
  NIGHT: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  OFF: 'bg-gray-100 text-gray-800 border-gray-300',
  SPLIT: 'bg-green-100 text-green-800 border-green-300',
  VACATION: 'bg-pink-100 text-pink-800 border-pink-300',
  ANNUAL_LEAVE: 'bg-purple-100 text-purple-800 border-purple-300',
};

// 경력 레벨 라벨
export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  INTERN: '수습',
  JUNIOR: '주니어 (1-3년)',
  SENIOR: '시니어 (3년 이상)',
  CHARGE: '책임간호사',
};
