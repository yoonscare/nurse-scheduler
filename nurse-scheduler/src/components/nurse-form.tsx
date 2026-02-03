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
import type { Nurse, NurseInsert, ExperienceLevel } from '@/types/database';
import { EXPERIENCE_LEVEL_LABELS } from '@/types/database';
import { useAppStore } from '@/store/app-store';

interface NurseFormProps {
  nurse?: Nurse;
  wardId: string;
  open: boolean;
  onClose: () => void;
}

export function NurseForm({ nurse, wardId, open, onClose }: NurseFormProps) {
  const { createNurse, updateNurse } = useAppStore();
  
  const [formData, setFormData] = useState<NurseInsert>({
    wardId: nurse?.wardId ?? wardId,
    name: nurse?.name ?? '',
    employeeNumber: nurse?.employeeNumber ?? '',
    experienceLevel: nurse?.experienceLevel ?? 'JUNIOR',
    hireDate: nurse?.hireDate ?? new Date().toISOString().split('T')[0],
    annualLeaveTotal: nurse?.annualLeaveTotal ?? 15,
    annualLeaveUsed: nurse?.annualLeaveUsed ?? 0,
    isActive: nurse?.isActive ?? true,
    phoneNumber: nurse?.phoneNumber ?? '',
    email: nurse?.email ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (nurse) {
      updateNurse(nurse.id, formData);
    } else {
      createNurse(formData);
    }
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{nurse ? '간호사 정보 수정' : '새 간호사 추가'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="홍길동"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeNumber">사번</Label>
              <Input
                id="employeeNumber"
                value={formData.employeeNumber}
                onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                placeholder="N20240001"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">경력 레벨</Label>
              <Select
                value={formData.experienceLevel}
                onValueChange={(value: ExperienceLevel) => 
                  setFormData({ ...formData, experienceLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="경력 선택" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EXPERIENCE_LEVEL_LABELS) as ExperienceLevel[]).map((level) => (
                    <SelectItem key={level} value={level}>
                      {EXPERIENCE_LEVEL_LABELS[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hireDate">입사일</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="annualLeaveTotal">연차 총일수</Label>
              <Input
                id="annualLeaveTotal"
                type="number"
                min={0}
                value={formData.annualLeaveTotal}
                onChange={(e) => setFormData({ ...formData, annualLeaveTotal: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualLeaveUsed">사용한 연차</Label>
              <Input
                id="annualLeaveUsed"
                type="number"
                min={0}
                value={formData.annualLeaveUsed}
                onChange={(e) => setFormData({ ...formData, annualLeaveUsed: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">전화번호</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber ?? ''}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="010-1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={formData.email ?? ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nurse@hospital.com"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">
              {nurse ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
