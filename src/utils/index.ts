// src/utils/index.ts

import type { RemainingTime } from '../types';

export const calculateDuration = (checkInDate: string): string => {
  if (!checkInDate) return '-';
  
  const startDate = new Date(checkInDate);
  const today = new Date();
  
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const days = Math.floor((diffDays % 365) % 30);
  
  if (years > 0) {
    return `${years} tahun ${months} bulan`;
  } else if (months > 0) {
    return `${months} bulan ${days} hari`;
  } else {
    return `${days} hari`;
  }
};

export const calculateRemainingTime = (
  checkInDate: string,
  rentDuration: string,
  rentDurationUnit: 'hari' | 'bulan' | 'tahun'
): RemainingTime | null => {
  if (!checkInDate || !rentDuration) return null;
  
  const startDate = new Date(checkInDate);
  const today = new Date();
  const endDate = new Date(startDate);
  
  // Hitung tanggal berakhir sewa
  if (rentDurationUnit === 'hari') {
    endDate.setDate(endDate.getDate() + parseInt(rentDuration));
  } else if (rentDurationUnit === 'bulan') {
    endDate.setMonth(endDate.getMonth() + parseInt(rentDuration));
  } else if (rentDurationUnit === 'tahun') {
    endDate.setFullYear(endDate.getFullYear() + parseInt(rentDuration));
  }
  
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { text: 'Sudah berakhir', expired: true, days: Math.abs(diffDays) };
  } else if (diffDays === 0) {
    return { text: 'Berakhir hari ini', warning: true, days: 0 };
  } else if (diffDays <= 7) {
    return { text: `${diffDays} hari lagi`, warning: true, days: diffDays };
  } else if (diffDays <= 30) {
    return { text: `${diffDays} hari lagi`, normal: true, days: diffDays };
  } else {
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    if (months > 0) {
      return { text: `${months} bulan ${days} hari lagi`, normal: true, days: diffDays };
    } else {
      return { text: `${days} hari lagi`, normal: true, days: diffDays };
    }
  }
};
