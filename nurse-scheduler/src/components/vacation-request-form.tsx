'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { VacationRequestInsert } from '@/types/database';
import { useAppStore } from '@/store/app-store';

interface VacationRequestFormProps {
  nurseId: string;
  open: boolean;
  onClose: () => void;
}

const VACATION_TYPES = {
  ANNUAL_LEAVE: '연차',
  SICK_LEAVE: '병가',
  SPECIAL_LEAVE: '특별휴가',
} as const;

type VacationType = keyof typeof VACATION_TYPES;

export function VacationRequestForm({ nurseId, open, onClose }: VacationRequestFormProps) {
  const { createVacationRequest, nurses, updateNurse } = useAppStore();
  
  const nurse = nurses.find(n => n.id === nurseId);
  
  const [formData, setFormData] = useState<Omit<VacationRequestInsert, 'nurseId'>>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    vacationType: 'ANNUAL_LEAVE',
    reason: '',
    status: 'PENDING',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nurse) return;
    
    createVacationRequest({
      ...formData,
      nurseId,
    });
    
    if (formData.vacationType === 'ANNUAL_LEAVE') {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      updateNurse(nurseId, {
        annualLeaveUsed: nurse.annualLeaveUsed + days,
      });
    }
    
    onClose();
  };

  if (!nurse) return null;

  const remainingLeave = nurse.annualLeaveTotal - nurse.annualLeaveUsed;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>휴가 신청</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>간호사</Label>
            <div className="p-2 bg-gray-100 rounded text-sm">
              {nurse.name} ({nurse.employeeNumber})
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <p className="text-blue-800">
              남은 연차: <span className="font-bold">{remainingLeave}일</span>
              <span className="text-blue-600 ml-2">
                (총 {nurse.annualLeaveTotal}일 중 {nurse.annualLeaveUsed}일 사용)
              </span>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vacationType">휴가 유형</Label>
            <Select
              value={formData.vacationType}
              onValueChange={(value: VacationType) => 
                setFormData({ ...formData, vacationType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(VACATION_TYPES) as VacationType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {VACATION_TYPES[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">종료일</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">사유 (선택)</Label>
            <Input
              id="reason"
              value={formData.reason ?? ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="예: 개인 사유, 건강 검진 등"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">
              신청
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
