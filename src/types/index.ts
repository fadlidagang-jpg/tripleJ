// src/types/index.ts

export interface Room {
  id: number;
  roomNumber: string;
  building: string;
  floor: string;
  status: 'kosong' | 'terisi';
  tenantName: string;
  tenantPhone: string;
  rentPrice: string;
  checkInDate: string;
  rentDuration: string;
  rentDurationUnit: 'hari' | 'bulan' | 'tahun';
  notes: string;
}

export interface RoomFormData {
  roomNumber: string;
  building: string;
  floor: string;
  status: 'kosong' | 'terisi';
  tenantName: string;
  tenantPhone: string;
  rentPrice: string;
  checkInDate: string;
  rentDuration: string;
  rentDurationUnit: 'hari' | 'bulan' | 'tahun';
  notes: string;
}

export interface Stats {
  total: number;
  occupied: number;
  vacant: number;
  occupancyRate: string;
}

export interface RemainingTime {
  text: string;
  expired?: boolean;
  warning?: boolean;
  normal?: boolean;
  days: number;
}
