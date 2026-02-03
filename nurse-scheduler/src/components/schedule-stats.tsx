'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EXPERIENCE_LEVEL_LABELS } from '@/types/database';

interface ScheduleStatsProps {
  wardId: string;
  year: number;
  month: number;
}

export function ScheduleStats({ wardId, year, month }: ScheduleStatsProps) {
  const { nurses, getMonthlyStats } = useAppStore();
  
  const wardNurses = useMemo(() => 
    nurses.filter(n => n.wardId === wardId && n.isActive),
    [nurses, wardId]
  );

  const stats = useMemo(() => 
    getMonthlyStats(wardId, year, month),
    [getMonthlyStats, wardId, year, month]
  );

  if (wardNurses.length === 0 || stats.size === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>근무 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            스케줄을 생성하면 통계가 표시됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const nursesWithStats = wardNurses.map(nurse => ({
    nurse,
    stats: stats.get(nurse.id) || {
      day: 0,
      evening: 0,
      night: 0,
      off: 0,
      split: 0,
      vacation: 0,
      weekendWork: 0,
    },
  }));

  const avgStats = {
    day: nursesWithStats.reduce((sum, n) => sum + n.stats.day, 0) / nursesWithStats.length,
    evening: nursesWithStats.reduce((sum, n) => sum + n.stats.evening, 0) / nursesWithStats.length,
    night: nursesWithStats.reduce((sum, n) => sum + n.stats.night, 0) / nursesWithStats.length,
    weekendWork: nursesWithStats.reduce((sum, n) => sum + n.stats.weekendWork, 0) / nursesWithStats.length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {year}년 {month}월 근무 통계
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2">간호사</th>
                <th className="text-left p-2">경력</th>
                <th className="text-center p-2">Day</th>
                <th className="text-center p-2">Evening</th>
                <th className="text-center p-2">Night</th>
                <th className="text-center p-2">Off</th>
                <th className="text-center p-2">Split</th>
                <th className="text-center p-2">휴가</th>
                <th className="text-center p-2">주말근무</th>
              </tr>
            </thead>
            <tbody>
              {nursesWithStats.map(({ nurse, stats }) => (
                <tr key={nurse.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{nurse.name}</td>
                  <td className="p-2 text-gray-600 text-xs">
                    {EXPERIENCE_LEVEL_LABELS[nurse.experienceLevel]}
                  </td>
                  <td className="text-center p-2">
                    <StatCell value={stats.day} avg={avgStats.day} />
                  </td>
                  <td className="text-center p-2">
                    <StatCell value={stats.evening} avg={avgStats.evening} />
                  </td>
                  <td className="text-center p-2">
                    <StatCell value={stats.night} avg={avgStats.night} />
                  </td>
                  <td className="text-center p-2">{stats.off}</td>
                  <td className="text-center p-2">{stats.split}</td>
                  <td className="text-center p-2">{stats.vacation}</td>
                  <td className="text-center p-2">
                    <StatCell value={stats.weekendWork} avg={avgStats.weekendWork} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-medium">
                <td className="p-2" colSpan={2}>평균</td>
                <td className="text-center p-2">{avgStats.day.toFixed(1)}</td>
                <td className="text-center p-2">{avgStats.evening.toFixed(1)}</td>
                <td className="text-center p-2">{avgStats.night.toFixed(1)}</td>
                <td className="text-center p-2">-</td>
                <td className="text-center p-2">-</td>
                <td className="text-center p-2">-</td>
                <td className="text-center p-2">{avgStats.weekendWork.toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
          <p className="font-medium text-blue-800">균등 분배 상태</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-blue-700">
            <p>야간 근무 편차: {getDeviation(nursesWithStats.map(n => n.stats.night)).toFixed(1)}일</p>
            <p>주말 근무 편차: {getDeviation(nursesWithStats.map(n => n.stats.weekendWork)).toFixed(1)}일</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCell({ value, avg }: { value: number; avg: number }) {
  const diff = value - avg;
  const isHigh = diff > 1;
  const isLow = diff < -1;
  
  return (
    <span
      className={
        isHigh ? 'text-red-600 font-medium' :
        isLow ? 'text-green-600 font-medium' :
        ''
      }
      title={`평균 대비 ${diff > 0 ? '+' : ''}${diff.toFixed(1)}`}
    >
      {value}
    </span>
  );
}

function getDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}
