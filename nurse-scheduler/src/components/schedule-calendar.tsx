'use client';

import { useMemo, useState } from 'react';
import { getDaysInMonth, isWeekend, cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';
import type { ShiftType, Nurse, Schedule } from '@/types/database';
import { SHIFT_TYPE_LABELS, SHIFT_TYPE_COLORS } from '@/types/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ScheduleCalendarProps {
  wardId: string;
  year: number;
  month: number;
}

const SHIFT_OPTIONS: ShiftType[] = ['DAY', 'EVENING', 'NIGHT', 'OFF', 'SPLIT', 'VACATION', 'ANNUAL_LEAVE'];

export function ScheduleCalendar({ wardId, year, month }: ScheduleCalendarProps) {
  const { nurses, schedules, updateSchedule } = useAppStore();
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const wardNurses = useMemo(() => 
    nurses.filter(n => n.wardId === wardId && n.isActive),
    [nurses, wardId]
  );

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  const scheduleMap = useMemo(() => {
    const map = new Map<string, Schedule>();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    schedules
      .filter(s => s.wardId === wardId && s.date >= startDate && s.date <= endDate)
      .forEach(s => {
        map.set(`${s.nurseId}-${s.date}`, s);
      });
    
    return map;
  }, [schedules, wardId, year, month]);

  const getSchedule = (nurseId: string, date: Date): Schedule | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return scheduleMap.get(`${nurseId}-${dateStr}`);
  };

  const handleShiftChange = (scheduleId: string, newShift: ShiftType) => {
    updateSchedule(scheduleId, newShift);
    setEditingCell(null);
  };

  const getCellKey = (nurseId: string, date: Date) => 
    `${nurseId}-${date.toISOString().split('T')[0]}`;

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  if (wardNurses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>이 병동에 등록된 간호사가 없습니다.</p>
        <p className="text-sm mt-2">먼저 간호사를 추가해주세요.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="sticky left-0 z-10 bg-gray-50 border p-2 min-w-[120px]">
              간호사
            </th>
            {days.map((day) => {
              const dayOfWeek = day.getDay();
              const isWeekendDay = isWeekend(day);
              return (
                <th
                  key={day.toISOString()}
                  className={cn(
                    'border p-1 min-w-[50px] text-center',
                    isWeekendDay && 'bg-red-50',
                    dayOfWeek === 0 && 'text-red-600',
                    dayOfWeek === 6 && 'text-blue-600'
                  )}
                >
                  <div className="text-xs">{dayLabels[dayOfWeek]}</div>
                  <div className="font-semibold">{day.getDate()}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {wardNurses.map((nurse) => (
            <tr key={nurse.id} className="hover:bg-gray-50">
              <td className="sticky left-0 z-10 bg-white border p-2 font-medium">
                <div>{nurse.name}</div>
                <div className="text-xs text-gray-500">{nurse.employeeNumber}</div>
              </td>
              {days.map((day) => {
                const schedule = getSchedule(nurse.id, day);
                const cellKey = getCellKey(nurse.id, day);
                const isEditing = editingCell === cellKey;
                const isWeekendDay = isWeekend(day);

                return (
                  <td
                    key={cellKey}
                    className={cn(
                      'border p-0.5 text-center cursor-pointer transition-colors',
                      isWeekendDay && 'bg-red-50/50',
                      !schedule && 'hover:bg-gray-100'
                    )}
                    onClick={() => {
                      if (schedule && !schedule.isLocked) {
                        setEditingCell(cellKey);
                      }
                    }}
                  >
                    {schedule ? (
                      isEditing ? (
                        <Select
                          value={schedule.shiftType}
                          onValueChange={(value: ShiftType) => 
                            handleShiftChange(schedule.id, value)
                          }
                          open={true}
                          onOpenChange={(open) => {
                            if (!open) setEditingCell(null);
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SHIFT_OPTIONS.map((shift) => (
                              <SelectItem key={shift} value={shift}>
                                {SHIFT_TYPE_LABELS[shift]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div
                          className={cn(
                            'px-1 py-0.5 rounded text-xs font-medium border',
                            SHIFT_TYPE_COLORS[schedule.shiftType],
                            schedule.isLocked && 'opacity-60'
                          )}
                          title={schedule.isLocked ? '잠금됨 (휴가)' : '클릭하여 수정'}
                        >
                          {schedule.shiftType === 'DAY' && 'D'}
                          {schedule.shiftType === 'EVENING' && 'E'}
                          {schedule.shiftType === 'NIGHT' && 'N'}
                          {schedule.shiftType === 'OFF' && 'O'}
                          {schedule.shiftType === 'SPLIT' && 'S'}
                          {schedule.shiftType === 'VACATION' && 'V'}
                          {schedule.shiftType === 'ANNUAL_LEAVE' && 'A'}
                        </div>
                      )
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <span className="font-medium">범례:</span>
        {SHIFT_OPTIONS.map((shift) => (
          <span
            key={shift}
            className={cn(
              'px-2 py-1 rounded border',
              SHIFT_TYPE_COLORS[shift]
            )}
          >
            {shift === 'DAY' && 'D'}
            {shift === 'EVENING' && 'E'}
            {shift === 'NIGHT' && 'N'}
            {shift === 'OFF' && 'O'}
            {shift === 'SPLIT' && 'S'}
            {shift === 'VACATION' && 'V'}
            {shift === 'ANNUAL_LEAVE' && 'A'}
            {' = '}
            {SHIFT_TYPE_LABELS[shift]}
          </span>
        ))}
      </div>
    </div>
  );
}
