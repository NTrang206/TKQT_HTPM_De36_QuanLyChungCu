/**
 * Currency, date, and text formatting utilities
 */

// Format number to Vietnamese Dong (VNĐ)
export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return '0 ₫';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

export const formatVND = formatCurrency;

// Format compact currency (e.g., 8.5 Tr, 4.85 Tỷ)
export const formatCompactCurrency = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)} Tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} Tr`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)} K`;
  }
  return `${amount} ₫`;
};

// Format date string to dd/MM/yyyy
export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '---';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
};

// Format datetime string to dd/MM/yyyy HH:mm
export const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '---';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
};

// Mask phone number for privacy e.g. 0912.***.689
export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 7) return phone;
  return `${phone.substring(0, 4)}.***.${phone.substring(phone.length - 3)}`;
};

// Mask Citizen ID e.g. 001201******
export const maskCitizenId = (cid: string): string => {
  if (!cid || cid.length < 8) return cid;
  return `${cid.substring(0, 6)}******`;
};

// Calculate days remaining between today and a target date
export const getDaysRemaining = (targetDate: string): number => {
  const target = new Date(targetDate).getTime();
  const today = new Date().getTime();
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diffDays;
};
