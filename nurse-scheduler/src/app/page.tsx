'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Settings,
  Wand2,
  FileText,
  Trash2,
  Edit,
  CalendarPlus,
  Plane
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WardForm } from '@/components/ward-form';
import { NurseForm } from '@/components/nurse-form';
import { ScheduleCalendar } from '@/components/schedule-calendar';
import { ScheduleStats } from '@/components/schedule-stats';
import { ShiftRequestForm } from '@/components/shift-request-form';
import { VacationRequestForm } from '@/components/vacation-request-form';
import type { Ward, Nurse, ScheduleGenerationConfig } from '@/types/database';
import { EXPERIENCE_LEVEL_LABELS, SHIFT_TYPE_LABELS } from '@/types/database';

export default function HomePage() {
  const {
    wards,
    nurses,
    shiftRequests,
    vacationRequests,
    selectedWardId,
    selectedYear,
    selectedMonth,
    loadAllData,
    setSelectedWard,
    setSelectedMonth,
    deleteWard,
    deleteNurse,
    generateMonthlySchedule,
    deleteShiftRequest,
    updateShiftRequest,
    deleteVacationRequest,
    updateVacationRequest,
    getSchedulesByWardAndMonth,
  } = useAppStore();

  const [isWardFormOpen, setIsWardFormOpen] = useState(false);
  const [isNurseFormOpen, setIsNurseFormOpen] = useState(false);
  const [isShiftRequestFormOpen, setIsShiftRequestFormOpen] = useState(false);
  const [isVacationFormOpen, setIsVacationFormOpen] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | undefined>();
  const [editingNurse, setEditingNurse] = useState<Nurse | undefined>();
  const [selectedNurseId, setSelectedNurseId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const selectedWard = useMemo(() => 
    wards.find(w => w.id === selectedWardId),
    [wards, selectedWardId]
  );

  const wardNurses = useMemo(() => 
    nurses.filter(n => n.wardId === selectedWardId && n.isActive),
    [nurses, selectedWardId]
  );

  const wardShiftRequests = useMemo(() => {
    if (!selectedWardId) return [];
    const nurseIds = new Set(wardNurses.map(n => n.id));
    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`;
    return shiftRequests.filter(
      r => nurseIds.has(r.nurseId) && r.date >= startDate && r.date <= endDate
    );
  }, [shiftRequests, wardNurses, selectedWardId, selectedYear, selectedMonth]);

  const wardVacationRequests = useMemo(() => {
    if (!selectedWardId) return [];
    const nurseIds = new Set(wardNurses.map(n => n.id));
    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`;
    return vacationRequests.filter(
      r => nurseIds.has(r.nurseId) && r.startDate <= endDate && r.endDate >= startDate
    );
  }, [vacationRequests, wardNurses, selectedWardId, selectedYear, selectedMonth]);

  const currentSchedules = useMemo(() => {
    if (!selectedWardId) return [];
    return getSchedulesByWardAndMonth(selectedWardId, selectedYear, selectedMonth);
  }, [getSchedulesByWardAndMonth, selectedWardId, selectedYear, selectedMonth]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(selectedYear - 1, 12);
    } else {
      setSelectedMonth(selectedYear, selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(selectedYear + 1, 1);
    } else {
      setSelectedMonth(selectedYear, selectedMonth + 1);
    }
  };

  const handleGenerateSchedule = () => {
    if (!selectedWard) return;
    
    setIsGenerating(true);
    
    const config: ScheduleGenerationConfig = {
      wardId: selectedWard.id,
      year: selectedYear,
      month: selectedMonth,
      maxConsecutiveWorkDays: 5,
      maxConsecutiveNights: selectedWard.maxConsecutiveNights,
      minRestAfterNight: true,
      balanceWeekends: true,
      balanceHolidays: true,
      balanceNightShifts: true,
      requireMixedExperience: selectedWard.requireMixedExperience,
    };
    
    setTimeout(() => {
      generateMonthlySchedule(config);
      setIsGenerating(false);
    }, 500);
  };

  const handleEditWard = (ward: Ward) => {
    setEditingWard(ward);
    setIsWardFormOpen(true);
  };

  const handleDeleteWard = (wardId: string) => {
    if (confirm('이 병동을 삭제하시겠습니까? 관련된 모든 데이터가 삭제됩니다.')) {
      deleteWard(wardId);
    }
  };

  const handleEditNurse = (nurse: Nurse) => {
    setEditingNurse(nurse);
    setIsNurseFormOpen(true);
  };

  const handleDeleteNurse = (nurseId: string) => {
    if (confirm('이 간호사를 삭제하시겠습니까?')) {
      deleteNurse(nurseId);
    }
  };

  const handleAddShiftRequest = (nurseId: string) => {
    setSelectedNurseId(nurseId);
    setIsShiftRequestFormOpen(true);
  };

  const handleAddVacation = (nurseId: string) => {
    setSelectedNurseId(nurseId);
    setIsVacationFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">간호사 스케줄러</h1>
                <p className="text-sm text-gray-500">병동 근무 스케줄 관리 시스템</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Select
                value={selectedWardId ?? ''}
                onValueChange={setSelectedWard}
              >
                <SelectTrigger className="w-[200px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="병동 선택" />
                </SelectTrigger>
                <SelectContent>
                  {wards.map(ward => (
                    <SelectItem key={ward.id} value={ward.id}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingWard(undefined);
                  setIsWardFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                병동 추가
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!selectedWard ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                병동을 선택하거나 추가해주세요
              </h2>
              <p className="text-gray-500 mb-6">
                스케줄 관리를 시작하려면 먼저 병동을 설정해야 합니다.
              </p>
              <Button onClick={() => {
                setEditingWard(undefined);
                setIsWardFormOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                첫 번째 병동 추가하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-2xl font-bold">
                  {selectedYear}년 {selectedMonth}월
                </h2>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleEditWard(selectedWard)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  병동 설정
                </Button>
                <Button
                  onClick={handleGenerateSchedule}
                  disabled={isGenerating || wardNurses.length === 0}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  {isGenerating ? '생성 중...' : '자동 스케줄 생성'}
                </Button>
              </div>
            </div>

            <Tabs defaultValue="schedule" className="space-y-4">
              <TabsList>
                <TabsTrigger value="schedule">
                  <Calendar className="h-4 w-4 mr-2" />
                  스케줄
                </TabsTrigger>
                <TabsTrigger value="nurses">
                  <Users className="h-4 w-4 mr-2" />
                  간호사 ({wardNurses.length})
                </TabsTrigger>
                <TabsTrigger value="requests">
                  <FileText className="h-4 w-4 mr-2" />
                  근무 요청 ({wardShiftRequests.length})
                </TabsTrigger>
                <TabsTrigger value="vacation">
                  <Plane className="h-4 w-4 mr-2" />
                  휴가 ({wardVacationRequests.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="schedule" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{selectedWard.name} - {selectedYear}년 {selectedMonth}월 스케줄</span>
                      {currentSchedules.length > 0 && (
                        <span className="text-sm font-normal text-gray-500">
                          총 {currentSchedules.length}건의 스케줄
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScheduleCalendar
                      wardId={selectedWard.id}
                      year={selectedYear}
                      month={selectedMonth}
                    />
                  </CardContent>
                </Card>
                
                <ScheduleStats
                  wardId={selectedWard.id}
                  year={selectedYear}
                  month={selectedMonth}
                />
              </TabsContent>

              <TabsContent value="nurses">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>간호사 목록</CardTitle>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingNurse(undefined);
                          setIsNurseFormOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        간호사 추가
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {wardNurses.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">
                        등록된 간호사가 없습니다.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="text-left p-3">이름</th>
                              <th className="text-left p-3">사번</th>
                              <th className="text-left p-3">경력</th>
                              <th className="text-left p-3">입사일</th>
                              <th className="text-center p-3">연차 (잔여/총)</th>
                              <th className="text-center p-3">액션</th>
                            </tr>
                          </thead>
                          <tbody>
                            {wardNurses.map(nurse => (
                              <tr key={nurse.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-medium">{nurse.name}</td>
                                <td className="p-3 text-gray-600">{nurse.employeeNumber}</td>
                                <td className="p-3">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                    {EXPERIENCE_LEVEL_LABELS[nurse.experienceLevel]}
                                  </span>
                                </td>
                                <td className="p-3 text-gray-600">{nurse.hireDate}</td>
                                <td className="p-3 text-center">
                                  {nurse.annualLeaveTotal - nurse.annualLeaveUsed} / {nurse.annualLeaveTotal}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleAddShiftRequest(nurse.id)}
                                      title="근무 요청"
                                    >
                                      <CalendarPlus className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleAddVacation(nurse.id)}
                                      title="휴가 신청"
                                    >
                                      <Plane className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditNurse(nurse)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => handleDeleteNurse(nurse.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requests">
                <Card>
                  <CardHeader>
                    <CardTitle>근무 요청 목록</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {wardShiftRequests.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">
                        이번 달 근무 요청이 없습니다.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {wardShiftRequests.map(request => {
                          const nurse = nurses.find(n => n.id === request.nurseId);
                          return (
                            <div
                              key={request.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div>
                                <span className="font-medium">{nurse?.name}</span>
                                <span className="mx-2 text-gray-400">|</span>
                                <span className="text-gray-600">{request.date}</span>
                                <span className="mx-2 text-gray-400">|</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {SHIFT_TYPE_LABELS[request.requestedShift]}
                                </span>
                                {request.reason && (
                                  <span className="ml-2 text-gray-500 text-sm">
                                    ({request.reason})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                  request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {request.status === 'APPROVED' ? '승인' :
                                   request.status === 'REJECTED' ? '거절' : '대기'}
                                </span>
                                {request.status === 'PENDING' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-green-600"
                                      onClick={() => updateShiftRequest(request.id, { status: 'APPROVED' })}
                                    >
                                      승인
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-600"
                                      onClick={() => updateShiftRequest(request.id, { status: 'REJECTED' })}
                                    >
                                      거절
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-gray-500"
                                  onClick={() => deleteShiftRequest(request.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vacation">
                <Card>
                  <CardHeader>
                    <CardTitle>휴가 신청 목록</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {wardVacationRequests.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">
                        이번 달 휴가 신청이 없습니다.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {wardVacationRequests.map(request => {
                          const nurse = nurses.find(n => n.id === request.nurseId);
                          const vacationTypeLabel = 
                            request.vacationType === 'ANNUAL_LEAVE' ? '연차' :
                            request.vacationType === 'SICK_LEAVE' ? '병가' : '특별휴가';
                          return (
                            <div
                              key={request.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div>
                                <span className="font-medium">{nurse?.name}</span>
                                <span className="mx-2 text-gray-400">|</span>
                                <span className="text-gray-600">
                                  {request.startDate} ~ {request.endDate}
                                </span>
                                <span className="mx-2 text-gray-400">|</span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                  {vacationTypeLabel}
                                </span>
                                {request.reason && (
                                  <span className="ml-2 text-gray-500 text-sm">
                                    ({request.reason})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                  request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {request.status === 'APPROVED' ? '승인' :
                                   request.status === 'REJECTED' ? '거절' : '대기'}
                                </span>
                                {request.status === 'PENDING' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-green-600"
                                      onClick={() => updateVacationRequest(request.id, { status: 'APPROVED' })}
                                    >
                                      승인
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-600"
                                      onClick={() => updateVacationRequest(request.id, { status: 'REJECTED' })}
                                    >
                                      거절
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-gray-500"
                                  onClick={() => deleteVacationRequest(request.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <WardForm
        ward={editingWard}
        open={isWardFormOpen}
        onClose={() => {
          setIsWardFormOpen(false);
          setEditingWard(undefined);
        }}
      />

      {selectedWard && (
        <NurseForm
          nurse={editingNurse}
          wardId={selectedWard.id}
          open={isNurseFormOpen}
          onClose={() => {
            setIsNurseFormOpen(false);
            setEditingNurse(undefined);
          }}
        />
      )}

      {selectedNurseId && selectedWard && (
        <>
          <ShiftRequestForm
            nurseId={selectedNurseId}
            wardId={selectedWard.id}
            year={selectedYear}
            month={selectedMonth}
            open={isShiftRequestFormOpen}
            onClose={() => {
              setIsShiftRequestFormOpen(false);
              setSelectedNurseId(null);
            }}
          />
          <VacationRequestForm
            nurseId={selectedNurseId}
            open={isVacationFormOpen}
            onClose={() => {
              setIsVacationFormOpen(false);
              setSelectedNurseId(null);
            }}
          />
        </>
      )}
    </div>
  );
}
