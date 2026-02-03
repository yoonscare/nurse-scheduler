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
import type { ShiftType, ShiftRequestInsert } from '@/types/database';
import { SHIFT_TYPE_LABELS } from '@/types/database';
import { useAppStore } from '@/store/app-store';

interface ShiftRequestFormProps {
  nurseId: string;
  wardId: string;
  year: number;
  month: number;
  open: boolean;
  onClose: () => void;
}

const REQUEST_SHIFT_OPTIONS: ShiftType[] = ['DAY', 'EVENING', 'NIGHT', 'OFF', 'SPLIT'];

export function ShiftRequestForm({ nurseId, wardId, year, month, open, onClose }: ShiftRequestFormProps) {
  const { createShiftRequest, nurses } = useAppStore();
  
  const nurse = nurses.find(n => n.id === nurseId);
  
  const [formData, setFormData] = useState<Omit<ShiftRequestInsert, 'nurseId'>>({
    date: `${year}-${String(month).padStart(2, '0')}-01`,
    requestedShift: 'OFF',
    reason: '',
    status: 'PENDING',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createShiftRequest({
      ...formData,
      nurseId,
    });
    
    onClose();
  };

  if (!nurse) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>근무 요청 등록</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>간호사</Label>
            <div className="p-2 bg-gray-100 rounded text-sm">
              {nurse.name} ({nurse.employeeNumber})
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">요청 날짜</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              min={`${year}-${String(month).padStart(2, '0')}-01`}
              max={`${year}-${String(month).padStart(2, '0')}-31`}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="requestedShift">요청 근무</Label>
            <Select
              value={formData.requestedShift}
              onValueChange={(value: ShiftType) => 
                setFormData({ ...formData, requestedShift: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="근무 선택" />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_SHIFT_OPTIONS.map((shift) => (
                  <SelectItem key={shift} value={shift}>
                    {SHIFT_TYPE_LABELS[shift]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">사유 (선택)</Label>
            <Input
              id="reason"
              value={formData.reason ?? ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="예: 가족 행사, 병원 예약 등"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">
              요청 등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
