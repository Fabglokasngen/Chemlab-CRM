// Utility for calculating Indonesian working days (excl. Saturdays, Sundays, and Indonesian National Holidays)

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

// Known Indonesian National Holidays (2025, 2026, 2027)
export const INDONESIAN_HOLIDAYS: Record<string, string> = {
  // 2025
  '2025-01-01': 'Tahun Baru 2025 Masehi',
  '2025-01-27': 'Isra Mikraj Nabi Muhammad SAW',
  '2025-01-29': 'Tahun Baru Imlek 2576 Kongzili',
  '2025-03-29': 'Hari Suci Nyepi Tahun Baru Caka 1947',
  '2025-03-31': 'Hari Raya Idul Fitri 1446 Hijriah',
  '2025-04-01': 'Hari Raya Idul Fitri 1446 Hijriah',
  '2025-04-18': 'Wafat Yesus Kristus',
  '2025-04-20': 'Kebangkitan Yesus Kristus (Paskah)',
  '2025-05-01': 'Hari Buruh Internasional',
  '2025-05-12': 'Hari Raya Waisak 2569 BE',
  '2025-05-29': 'Kenaikan Yesus Kristus',
  '2025-06-01': 'Hari Lahir Pancasila',
  '2025-06-06': 'Hari Raya Idul Adha 1446 Hijriah',
  '2025-06-27': 'Tahun Baru Islam 1447 Hijriah',
  '2025-08-17': 'Hari Kemerdekaan Republik Indonesia',
  '2025-09-05': 'Maulid Nabi Muhammad SAW',
  '2025-12-25': 'Hari Raya Natal',

  // 2026
  '2026-01-01': 'Tahun Baru 2026 Masehi',
  '2026-01-16': 'Isra Mikraj Nabi Muhammad SAW',
  '2026-02-17': 'Tahun Baru Imlek 2577 Kongzili',
  '2026-03-19': 'Hari Suci Nyepi Tahun Baru Caka 1948',
  '2026-03-20': 'Hari Raya Idul Fitri 1447 Hijriah',
  '2026-03-21': 'Hari Raya Idul Fitri 1447 Hijriah',
  '2026-04-03': 'Wafat Yesus Kristus',
  '2026-05-01': 'Hari Buruh Internasional',
  '2026-05-14': 'Kenaikan Yesus Kristus',
  '2026-05-27': 'Hari Raya Idul Adha 1447 Hijriah',
  '2026-05-31': 'Hari Raya Waisak 2570 BE',
  '2026-06-01': 'Hari Lahir Pancasila',
  '2026-06-16': 'Tahun Baru Islam 1448 Hijriah',
  '2026-08-17': 'Hari Kemerdekaan Republik Indonesia',
  '2026-08-25': 'Maulid Nabi Muhammad SAW',
  '2026-12-25': 'Hari Raya Natal',

  // 2027
  '2027-01-01': 'Tahun Baru 2027 Masehi',
  '2027-02-06': 'Isra Mikraj & Imlek',
  '2027-03-09': 'Hari Raya Idul Fitri 1448 Hijriah',
  '2027-03-10': 'Hari Raya Idul Fitri 1448 Hijriah',
  '2027-03-22': 'Hari Suci Nyepi',
  '2027-03-26': 'Wafat Yesus Kristus',
  '2027-05-01': 'Hari Buruh Internasional',
  '2027-05-06': 'Kenaikan Yesus Kristus',
  '2027-05-16': 'Hari Raya Idul Adha 1448 Hijriah',
  '2027-05-20': 'Hari Raya Waisak',
  '2027-06-01': 'Hari Lahir Pancasila',
  '2027-06-06': 'Tahun Baru Islam 1449 Hijriah',
  '2027-08-15': 'Maulid Nabi Muhammad SAW',
  '2027-08-17': 'Hari Kemerdekaan Republik Indonesia',
  '2027-12-25': 'Hari Raya Natal',
};

/**
 * Checks whether a given Date object (or YYYY-MM-DD string) is an Indonesian Working Day.
 * Returns false if it falls on Saturday (6), Sunday (0), or an Indonesian Public Holiday.
 */
export function isIndonesianWorkingDay(dateInput: Date | string): { isWorkingDay: boolean; holidayName?: string; isWeekend?: boolean } {
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : new Date(dateInput);
  const dayOfWeek = dateObj.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isWorkingDay: false, isWeekend: true };
  }

  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  if (INDONESIAN_HOLIDAYS[dateStr]) {
    return { isWorkingDay: false, holidayName: INDONESIAN_HOLIDAYS[dateStr] };
  }

  return { isWorkingDay: true };
}

/**
 * Calculates target Due Date (YYYY-MM-DD) by adding N WORKING DAYS to startDate.
 * Excludes Saturdays, Sundays, and Indonesian National Holidays.
 */
export function addWorkingDays(startDateStr: string, workingDaysNeeded: number): string {
  if (!startDateStr) return '';
  if (workingDaysNeeded <= 0) return startDateStr;

  const current = new Date(startDateStr + 'T00:00:00');
  let added = 0;

  // Advance day by day until we count workingDaysNeeded working days
  while (added < workingDaysNeeded) {
    current.setDate(current.getDate() + 1);
    const check = isIndonesianWorkingDay(current);
    if (check.isWorkingDay) {
      added++;
    }
  }

  const yyyy = current.getFullYear();
  const mm = String(current.getMonth() + 1).padStart(2, '0');
  const dd = String(current.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Counts the number of working days remaining (or overdue working days) between two dates.
 */
export function countWorkingDaysBetween(startDateInput: Date | string, endDateInput: Date | string): number {
  const start = typeof startDateInput === 'string' ? new Date(startDateInput + 'T00:00:00') : new Date(startDateInput);
  const end = typeof endDateInput === 'string' ? new Date(endDateInput + 'T00:00:00') : new Date(endDateInput);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (start.getTime() === end.getTime()) return 0;

  let count = 0;
  const isReverse = start.getTime() > end.getTime();
  const stepDate = new Date(isReverse ? end : start);
  const targetDate = new Date(isReverse ? start : end);

  while (stepDate.getTime() < targetDate.getTime()) {
    stepDate.setDate(stepDate.getDate() + 1);
    const check = isIndonesianWorkingDay(stepDate);
    if (check.isWorkingDay) {
      count++;
    }
  }

  return isReverse ? -count : count;
}
