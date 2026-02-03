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
import type { Ward, WardInsert } from '@/types/database';
import { useAppStore } from '@/store/app-store';

interface WardFormProps {
  ward?: Ward;
  open: boolean;
  onClose: () => void;
}

export function WardForm({ ward, open, onClose }: WardFormProps) {
  const { createWard, updateWard } = useAppStore();
  
  const [formData, setFormData] = useState<WardInsert>({
    name: ward?.name ?? '',
    minStaffDay: ward?.minStaffDay ?? 3,
    minStaffEvening: ward?.minStaffEvening ?? 2,
    minStaffNight: ward?.minStaffNight ?? 2,
    maxConsecutiveNights: ward?.maxConsecutiveNights ?? 3,
    minRestHours: ward?.minRestHours ?? 8,
    requireMixedExperience: ward?.requireMixedExperience ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (ward) {
      updateWard(ward.id, formData);
    } else {
      createWard(formData);
    }
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{ward ? '병동 수정' : '새 병동 추가'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">병동 이름</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: 내과 3병동"
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minStaffDay">Day 최소 인원</Label>
              <Input
                id="minStaffDay"
                type="number"
                min={1}
                value={formData.minStaffDay}
                onChange={(e) => setFormData({ ...formData, minStaffDay: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStaffEvening">Evening 최소 인원</Label>
              <Input
                id="minStaffEvening"
                type="number"
                min={1}
                value={formData.minStaffEvening}
                onChange={(e) => setFormData({ ...formData, minStaffEvening: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStaffNight">Night 최소 인원</Label>
              <Input
                id="minStaffNight"
                type="number"
                min={1}
                value={formData.minStaffNight}
                onChange={(e) => setFormData({ ...formData, minStaffNight: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxConsecutiveNights">최대 연속 야간</Label>
              <Input
                id="maxConsecutiveNights"
                type="number"
                min={1}
                max={7}
                value={formData.maxConsecutiveNights}
                onChange={(e) => setFormData({ ...formData, maxConsecutiveNights: parseInt(e.target.value) || 3 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minRestHours">최소 휴식 시간</Label>
              <Input
                id="minRestHours"
                type="number"
                min={0}
                value={formData.minRestHours}
                onChange={(e) => setFormData({ ...formData, minRestHours: parseInt(e.target.value) || 8 })}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              id="requireMixedExperience"
              type="checkbox"
              checked={formData.requireMixedExperience}
              onChange={(e) => setFormData({ ...formData, requireMixedExperience: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="requireMixedExperience">
              경력 혼합 배치 필수 (신입만 근무 방지)
            </Label>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">
              {ward ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
