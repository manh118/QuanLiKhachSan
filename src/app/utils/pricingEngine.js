/**
 * pricingEngine.js
 * Module tính giá phòng động theo thời gian thực.
 * Hỗ trợ: Cuối tuần | Ngày lễ quốc gia | Mùa cao điểm du lịch
 */

// =============================================
// DANH SÁCH NGÀY LỄ CỐ ĐỊNH (DD/MM) VÀ KHOẢNG LỄ
// =============================================
const FIXED_HOLIDAYS = [
  { name: 'Tết Dương lịch',          month: 1,  day: 1  },
  { name: 'Giỗ Tổ Hùng Vương',       month: 4,  day: 18 },
  { name: 'Ngày Giải phóng 30/4',    month: 4,  day: 30 },
  { name: 'Ngày Quốc tế Lao động',   month: 5,  day: 1  },
  { name: 'Ngày Quốc khánh 2/9',     month: 9,  day: 2  },
];

// Khoảng nghỉ lễ dài ngày (tính theo MM/DD)
const HOLIDAY_RANGES = [
  // Tết Nguyên Đán ~27/1 - 5/2 (xấp xỉ, thay đổi hàng năm)
  { name: 'Tết Nguyên Đán', startMonth: 1, startDay: 27, endMonth: 2, endDay: 5 },
];

// =============================================
// MÙA CAO ĐIỂM DU LỊCH (tháng)
// =============================================
const PEAK_SEASON_MONTHS = [6, 7, 8, 12]; // Tháng 6-8 (hè) + Tháng 12 (Giáng sinh/Năm mới)

/**
 * Kiểm tra xem ngày có phải cuối tuần không (Thứ 7, Chủ nhật)
 */
function isWeekend(date) {
  const day = date.getDay(); // 0=CN, 6=T7
  return day === 0 || day === 6;
}
/**
 * Kiểm tra xem ngày có phải ngày lễ quốc gia không
 */
function isHoliday(date) {
  const m = date.getMonth() + 1; // getMonth() trả 0-indexed
  const d = date.getDate();

  // Kiểm tra ngày lễ cố định
  const isFixed = FIXED_HOLIDAYS.some(h => h.month === m && h.day === d);
  if (isFixed) return true;

  // Kiểm tra khoảng lễ dài ngày (Tết Nguyên Đán v.v.)
  const isInRange = HOLIDAY_RANGES.some(r => {
    const startRef = new Date(date.getFullYear(), r.startMonth - 1, r.startDay);
    const endRef   = new Date(date.getFullYear(), r.endMonth   - 1, r.endDay);
    return date >= startRef && date <= endRef;
  });

  return isInRange;
}

/**
 * Kiểm tra xem ngày có nằm trong mùa cao điểm du lịch không
 */
function isPeakSeason(date) {
  const m = date.getMonth() + 1;
  return PEAK_SEASON_MONTHS.includes(m);
}

// =============================================
// HÀM TÍNH GIÁ CHÍNH
// =============================================

/**
 * Xác định loại ngày và hệ số giá tương ứng cho 1 đêm
 * @param {Date}   date       - Ngày cần kiểm tra
 * @param {Object} roomType   - Document RoomType từ Mongoose
 * @returns {{ finalPrice: number, priceType: string, multiplier: number }}
 */
function getPriceForDate(date, roomType) {
  const base = roomType.price;

  if (isHoliday(date)) {
    const m = roomType.holidayMultiplier || 1.5;
    return {
      priceType: 'Ngày lễ/Tết',
      multiplier: m,
      finalPrice: Math.round(base * m)
    };
  }

  if (isPeakSeason(date) && isWeekend(date)) {
    // Cuối tuần + mùa cao điểm → dùng hệ số cao hơn
    const m = Math.max(roomType.weekendMultiplier || 1.2, roomType.peakSeasonMultiplier || 1.3);
    return {
      priceType: 'Cuối tuần mùa cao điểm',
      multiplier: m,
      finalPrice: Math.round(base * m)
    };
  }

  if (isPeakSeason(date)) {
    const m = roomType.peakSeasonMultiplier || 1.3;
    return {
      priceType: 'Mùa cao điểm',
      multiplier: m,
      finalPrice: Math.round(base * m)
    };
  }

  if (isWeekend(date)) {
    const m = roomType.weekendMultiplier || 1.2;
    return {
      priceType: 'Cuối tuần',
      multiplier: m,
      finalPrice: Math.round(base * m)
    };
  }

  return {
    priceType: 'Ngày thường',
    multiplier: 1,
    finalPrice: base
  };
}

/**
 * Tính tổng chi phí cho khoảng thời gian lưu trú
 * @param {Date}   checkIn    - Ngày nhận phòng
 * @param {Date}   checkOut   - Ngày trả phòng
 * @param {Object} roomType   - Document RoomType từ Mongoose
 * @returns {{ totalCost: number, nights: number, breakdown: Array }}
 */
function calculateStayCost(checkIn, checkOut, roomType) {
  const breakdown = [];
  let totalCost = 0;
  let current = new Date(checkIn);
  current.setHours(0, 0, 0, 0);

  const end = new Date(checkOut);
  end.setHours(0, 0, 0, 0);

  while (current < end) {
    const priceInfo = getPriceForDate(current, roomType);
    breakdown.push({
      date: current.toLocaleDateString('vi-VN'),
      dayOfWeek: ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][current.getDay()],
      priceType: priceInfo.priceType,
      price: priceInfo.finalPrice
    });
    totalCost += priceInfo.finalPrice;
    current.setDate(current.getDate() + 1);
  }

  return {
    checkIn: checkIn.toLocaleDateString('vi-VN'),
    checkOut: checkOut.toLocaleDateString('vi-VN'),
    nights: breakdown.length,
    totalCost,
    breakdown
  };
}

/**
 * Trả về thông tin giá hiện tại (hôm nay) cho 1 loại phòng
 * @param {Object} roomType - Document RoomType từ Mongoose
 * @returns {{ priceTonight: number, priceType: string, note: string }}
 */
function getPricingContext(roomType) {
  const today = new Date();
  const info = getPriceForDate(today, roomType);

  return {
    giaCoSo: roomType.price,
    giaToiNay: info.finalPrice,
    loaiNgay: info.priceType,
    heSo: info.multiplier,
    chiTietHeSo: {
      cuoiTuan: `x${roomType.weekendMultiplier || 1.2} (+${Math.round((roomType.weekendMultiplier || 1.2) * 100 - 100)}%)`,
      ngayLe:   `x${roomType.holidayMultiplier || 1.5} (+${Math.round((roomType.holidayMultiplier || 1.5) * 100 - 100)}%)`,
      muaCaoDiem: `x${roomType.peakSeasonMultiplier || 1.3} (+${Math.round((roomType.peakSeasonMultiplier || 1.3) * 100 - 100)}%)`,
    }
  };
}

module.exports = { getPriceForDate, calculateStayCost, getPricingContext, isWeekend, isHoliday, isPeakSeason };
