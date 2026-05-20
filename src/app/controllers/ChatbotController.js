const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require('mongoose');
const RoomType = require('../models/RoomType');
const Service = require('../models/Service');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Discount = require('../models/Discount');
const ServiceMonAn = require('../models/ServiceMonAn');
const { getPricingContext, calculateStayCost } = require('../utils/pricingEngine');

// =============================================
// PHẦN 1: ĐỊNH NGHĨA TOOLS (FUNCTION DECLARATIONS)
// =============================================
const tools = [{
  functionDeclarations: [
    {
      name: "checkRoomAvailability",
      description: "Kiểm tra phòng trống của khách sạn. Cần cung cấp ngày check-in và check-out để có kết quả chính xác nhất. Có thể lọc theo loại phòng. Trả về số lượng phòng trống, giá động cho khoảng thời gian đó, và thông tin chi tiết phòng.",
      parameters: {
        type: "OBJECT",
        properties: {
          checkIn: {
            type: "STRING",
            description: "Ngày nhận phòng mong muốn (định dạng YYYY-MM-DD). Nếu khách không nói rõ, yêu cầu khách cung cấp."
          },
          checkOut: {
            type: "STRING",
            description: "Ngày trả phòng mong muốn (định dạng YYYY-MM-DD)."
          },
          roomTypeName: {
            type: "STRING",
            description: "Tên loại phòng cần tìm (Standard, Deluxe, VIP, Family...). Bỏ trống để xem tất cả."
          }
        }
      }
    },
    {
      name: "getRoomDetails",
      description: "Lấy thông tin chi tiết về loại phòng: giá cơ bản, tiện ích, số người tối đa, chính sách giường phụ, phụ thu trẻ em, bữa sáng. Bao gồm giá động theo ngày hôm nay (cuối tuần/ngày lễ/mùa cao điểm).",
      parameters: {
        type: "OBJECT",
        properties: {
          roomTypeName: {
            type: "STRING",
            description: "Tên loại phòng muốn xem chi tiết. Bỏ trống để xem tất cả loại phòng."
          }
        }
      }
    },
    {
      name: "calculateRoomPrice",
      description: "Tính toán chi phí lưu trú chính xác theo từng đêm với giá động (cuối tuần/ngày lễ/mùa cao điểm). Dùng khi khách hỏi giá cho khoảng thời gian cụ thể.",
      parameters: {
        type: "OBJECT",
        properties: {
          roomTypeName: {
            type: "STRING",
            description: "Tên loại phòng (bắt buộc)."
          },
          checkIn: {
            type: "STRING",
            description: "Ngày nhận phòng, định dạng YYYY-MM-DD. Ví dụ: 2025-06-15"
          },
          checkOut: {
            type: "STRING",
            description: "Ngày trả phòng, định dạng YYYY-MM-DD. Ví dụ: 2025-06-18"
          }
        },
        required: ["roomTypeName", "checkIn", "checkOut"]
      }
    },
    {
      name: "checkBookingStatus",
      description: "Tra cứu thông tin đặt phòng của khách hàng. Cần ít nhất 1 trong 2: mã đặt phòng hoặc số điện thoại.",
      parameters: {
        type: "OBJECT",
        properties: {
          bookingCode: {
            type: "STRING",
            description: "Mã đặt phòng (Booking ID)."
          },
          phoneNumber: {
            type: "STRING",
            description: "Số điện thoại của người đặt phòng."
          }
        }
      }
    },
    {
      name: "getServicePrice",
      description: "Tra cứu dịch vụ phụ trợ của khách sạn: giá cả, giờ hoạt động, vị trí. Có thể lọc theo tên hoặc danh mục (Ăn uống, Đưa đón, Giặt ủi, Spa & Wellness, Tiện ích, Giải trí).",
      parameters: {
        type: "OBJECT",
        properties: {
          serviceName: {
            type: "STRING",
            description: "Tên dịch vụ cần tìm. Bỏ trống để xem tất cả."
          },
          category: {
            type: "STRING",
            description: "Danh mục dịch vụ: 'Ăn uống', 'Đưa đón', 'Giặt ủi', 'Spa & Wellness', 'Tiện ích', 'Giải trí'. Bỏ trống nếu không lọc."
          }
        }
      }
    },
    {
      name: "getActiveDiscounts",
      description: "Lấy danh sách mã giảm giá (voucher/coupon) đang còn hiệu lực của khách sạn.",
      parameters: {
        type: "OBJECT",
        properties: {}
      }
    },
    {
      name: "getFoodMenu",
      description: "Lấy menu món ăn, đồ uống của nhà hàng khách sạn. Có thể lọc theo loại (Đồ ăn, Đồ uống, Tráng miệng...).",
      parameters: {
        type: "OBJECT",
        properties: {
          foodType: {
            type: "STRING",
            description: "Loại món: ví dụ 'Đồ uống', 'Đồ ăn', 'Tráng miệng'. Bỏ trống để xem tất cả."
          }
        }
      }
    }
  ]
}];

// =============================================
// PHẦN 2: LOGIC TRUY VẤN DATABASE
// =============================================
const dbFunctions = {

  checkRoomAvailability: async ({ roomTypeName, checkIn, checkOut }) => {
    let query = {};
    if (roomTypeName) {
      const rt = await RoomType.findOne({ name: { $regex: new RegExp(roomTypeName, 'i') } });
      if (rt) query.roomType = rt._id;
      else return { error: `Không tìm thấy loại phòng "${roomTypeName}". Hãy dùng tool getRoomDetails để xem danh sách loại phòng.` };
    }

    // 1. Lấy tất cả phòng đang KHÔNG bảo trì
    query.status = { $ne: 'Dọn dẹp' }; // Dọn dẹp/Bảo trì thì không cho thuê, các trạng thái khác xét theo date
    const allRooms = await Room.find(query).populate('roomType').populate('bedType');

    // 2. Nếu khách có cung cấp ngày, lọc các phòng đã bị đặt trong khoảng thời gian đó
    let bookedRoomIds = [];
    if (checkIn && checkOut) {
      const ciDate = new Date(checkIn);
      const coDate = new Date(checkOut);
      if (!isNaN(ciDate) && !isNaN(coDate) && ciDate < coDate) {
        const overlappingBookings = await Booking.find({
          bookingStatus: { $nin: ['Đã hủy', 'Đã trả phòng'] },
          $and: [
            { checkInDate: { $lt: coDate } },
            { checkOutDate: { $gt: ciDate } }
          ]
        });
        bookedRoomIds = overlappingBookings.map(b => b.room?.toString() || b.roomId?.toString()).filter(id => id);
      } else {
        return { error: 'Định dạng ngày không hợp lệ. Vui lòng kiểm tra lại (YYYY-MM-DD) và đảm bảo check-out sau check-in.' };
      }
    } else {
      // Nếu không có ngày, chỉ trả về phòng đang trống hiện tại
      query.status = 'Trống';
    }

    // 3. Lọc ra danh sách phòng thực sự trống
    const availableRooms = allRooms.filter(r => {
      // Nếu có checkIn/Out thì lọc theo ID, nếu không thì đã lọc query.status = 'Trống' ở trên rồi
      if (checkIn && checkOut) {
        return !bookedRoomIds.includes(r._id.toString());
      }
      return r.status === 'Trống';
    });

    if (availableRooms.length === 0) return { message: `Hiện tại không còn phòng trống nào phù hợp cho khoảng thời gian này.` };

    const grouped = {};
    availableRooms.forEach(r => {
      const tName = r.roomType?.name || 'Không rõ';
      if (!grouped[tName]) {
        // Tính giá động nếu có ngày, không thì lấy giá hôm nay
        let pricingInfo = null;
        if (checkIn && checkOut && r.roomType) {
             const result = calculateStayCost(new Date(checkIn), new Date(checkOut), r.roomType);
             pricingInfo = { tongGia: result.totalCost, soDem: result.nights };
        } else if (r.roomType) {
             const p = getPricingContext(r.roomType);
             pricingInfo = { giaToiNay: p.giaToiNay, loaiNgayHomNay: p.loaiNgay };
        }

        grouped[tName] = {
          soPhongTrong: 0,
          giaCoSo: r.roomType?.price || 0,
          thongTinGiaDong: pricingInfo,
          danhSachPhong: []
        };
      }
      grouped[tName].soPhongTrong++;
      grouped[tName].danhSachPhong.push({
        soPhong: r.roomNumber,
        tang: r.floor || null,
        huongNhin: r.view || null,
        banCong: r.hasBalcony || false,
        dienTich: r.area || null,
        loaiGiuong: r.bedType?.name || null,
        kichThuocGiuong: r.bedType?.size || null
      });
    });

    return { tinhTrang: 'Còn phòng trống', chiTiet: grouped };
  },

  getRoomDetails: async ({ roomTypeName }) => {
    let query = {};
    if (roomTypeName) query.name = { $regex: new RegExp(roomTypeName, 'i') };

    const types = await RoomType.find(query);
    if (types.length === 0) return { error: 'Không tìm thấy loại phòng này.' };

    return types.map(t => {
      const pricing = getPricingContext(t);
      return {
        tenLoaiPhong: t.name,
        moTa: t.description,
        moTaNgan: t.shortDescription || '',
        giaCoSo: t.price,
        // Giá động theo thời gian thực
        giaToiNay: pricing.giaToiNay,
        loaiNgayHomNay: pricing.loaiNgay,
        bangHeSo: pricing.chiTietHeSo,
        soNguoiLonToiDa: t.maxAdults,
        soNguoiToiDa: t.maxOccupancy,
        baoGomAnSang: t.includesBreakfast || false,
        choPhepGiuongPhu: t.extraBedAllowed || false,
        phiGiuongPhu: t.extraBedPrice || 0,
        phuThuNguoiLonThem: t.extraAdultPrice || 0,
        treEmMienPhiDuoiTuoi: t.childFreeAge || 6,
        phuThuTreEm: t.childExtraPrice || 0,
        tienIch: t.utilities?.map(u => u.name).join(', ') || 'Chưa cập nhật'
      };
    });
  },

  checkBookingStatus: async ({ bookingCode, phoneNumber }) => {
    let query = {};
    if (bookingCode && mongoose.Types.ObjectId.isValid(bookingCode)) {
      query._id = bookingCode;
    } else if (phoneNumber) {
      query['customer.phone'] = phoneNumber;
    } else {
      return { error: 'Vui lòng cung cấp số điện thoại hoặc mã đặt phòng để tra cứu.' };
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 }).limit(3);
    if (bookings.length === 0) return { error: 'Không tìm thấy đơn đặt phòng nào khớp thông tin.' };

    return bookings.map(b => ({
      maDatPhong: b._id,
      tenKhach: b.customer?.fullName || 'Không rõ',
      soDienThoai: b.customer?.phone || 'Không rõ',
      email: b.customer?.email || '',
      soPhong: b.roomNumber,
      ngayNhanPhong: b.checkInDate,
      ngayTraPhong: b.checkOutDate,
      soNgay: b.soNgay,
      soNguoiLon: b.nguoiLon,
      soTreEm: b.treEm,
      tongTienPhong: b.totalRoomCost,
      tongTienDichVu: b.totalServiceCost,
      giamGia: b.discountAmount,
      phuThuNguoiLon: b.extraAdultSurcharge,
      phiTraPhongTre: b.lateCheckOutFee,
      tongCong: b.totalAmount,
      daThanhToanCoc: b.depositAmount,
      conLai: b.remainingAmount,
      trangThai: b.bookingStatus,
      nguon: b.source
    }));
  },

  calculateRoomPrice: async ({ roomTypeName, checkIn, checkOut }) => {
    if (!roomTypeName || !checkIn || !checkOut) {
      return { error: 'Cần cung cấp tên loại phòng, ngày nhận phòng và ngày trả phòng.' };
    }

    const roomType = await RoomType.findOne({ name: { $regex: new RegExp(roomTypeName, 'i') } });
    if (!roomType) return { error: `Không tìm thấy loại phòng "${roomTypeName}".` };

    const ciDate = new Date(checkIn);
    const coDate = new Date(checkOut);

    if (isNaN(ciDate) || isNaN(coDate) || ciDate >= coDate) {
      return { error: 'Ngày nhận/trả phòng không hợp lệ. Định dạng cần là YYYY-MM-DD.' };
    }

    const result = calculateStayCost(ciDate, coDate, roomType);
    return {
      loaiPhong: roomType.name,
      ...result
    };
  },

  getServicePrice: async ({ serviceName, category }) => {
    let query = { isActive: true };
    if (serviceName) query.name = { $regex: new RegExp(serviceName, 'i') };
    if (category) query.category = { $regex: new RegExp(category, 'i') };

    const services = await Service.find(query).limit(15);
    if (services.length === 0) return { error: 'Không tìm thấy dịch vụ phù hợp.' };

    return services.map(s => ({
      tenDichVu: s.name,
      gia: s.price,
      donVi: s.unit,
      moTa: s.description || '',
      danhMuc: s.category || 'Khác',
      gioHoatDong: s.operatingHours || 'Liên hệ lễ tân',
      viTri: s.location || ''
    }));
  },

  getActiveDiscounts: async () => {
    const now = new Date();
    const discounts = await Discount.find({
      isActive: true,
      startDate: { $lte: now },
      $or: [{ endDate: { $gte: now } }, { endDate: null }]
    }).limit(10);

    if (discounts.length === 0) return { message: 'Hiện tại không có chương trình khuyến mãi nào.' };

    return discounts.map(d => ({
      maGiamGia: d.code,
      moTa: d.description,
      loaiGiam: d.discountType === 'percentage' ? 'Giảm theo %' : 'Giảm số tiền cố định',
      giaTriGiam: d.discountType === 'percentage' ? `${d.discountValue}%` : `${d.discountValue.toLocaleString('vi-VN')} VNĐ`,
      ngayHetHan: d.endDate || 'Không giới hạn',
      donToiThieu: d.minOrderValue > 0 ? `${d.minOrderValue.toLocaleString('vi-VN')} VNĐ` : 'Không yêu cầu',
      soLuotConLai: d.usageLimit > 0 ? (d.usageLimit - d.usageCount) : 'Không giới hạn'
    }));
  },

  getFoodMenu: async ({ foodType }) => {
    let query = {};
    if (foodType) query.type = { $regex: new RegExp(foodType, 'i') };

    const items = await ServiceMonAn.find(query).limit(20);
    if (items.length === 0) return { error: 'Không tìm thấy món ăn/đồ uống phù hợp.' };

    return items.map(m => ({
      tenMon: m.name,
      moTa: m.description,
      gia: m.price,
      loai: m.type
    }));
  }
};

// =============================================
// PHẦN 3: SYSTEM PROMPT VỚI CONTEXT NGHIỆP VỤ
// =============================================
const SYSTEM_PROMPT = `
Bạn là "Linh" — nhân viên lễ tân ảo (AI Concierge) nhiệt tình, chuyên nghiệp của khách sạn 20Hotel.

═══════════════════════════════════════
THÔNG TIN KHÁCH SẠN
═══════════════════════════════════════
- Tên: 20Hotel (Khách sạn tiêu chuẩn 3 sao)
- Địa chỉ: 49 P. Trần Quốc Vượng, Dịch Vọng Hậu, Cầu Giấy, Hà Nội
- Email: 20hotel@gmail.com | Hotline: 0983 230 945 (24/7)
- Website: 20hotel.com

═══════════════════════════════════════
CHÍNH SÁCH CHECK-IN / CHECK-OUT
═══════════════════════════════════════
- Check-in tiêu chuẩn: 14:00 | Check-out tiêu chuẩn: 12:00
- Check-in sớm (trước 14:00): Tùy tình trạng phòng, phụ thu 50% giá phòng nếu nhận trước 10:00.
- Check-out trễ (sau 12:00):
  + Trước 15:00: phụ thu 30% giá phòng.
  + Trước 18:00: phụ thu 50% giá phòng.
  + Sau 18:00: tính thêm 1 đêm.
- Check-in muộn ban đêm: Lễ tân trực 24/7, khách có thể check-in bất cứ lúc nào.

═══════════════════════════════════════
CHÍNH SÁCH ĐẶT CỌC & THANH TOÁN
═══════════════════════════════════════
- Đặt cọc: 30% tổng tiền phòng qua VNPay khi đặt phòng online.
- Thanh toán phần còn lại: Khi check-in hoặc check-out.
- Phương thức: Tiền mặt, Chuyển khoản ngân hàng, VNPay QR.
- Tiền cọc tại quầy (nếu không đặt trước): 500.000 VNĐ/phòng.
- Xuất hóa đơn VAT (hóa đơn đỏ): Có. Vui lòng thông báo trước khi check-out.

═══════════════════════════════════════
CHÍNH SÁCH HỦY PHÒNG & HOÀN TIỀN
═══════════════════════════════════════
- Hủy trước 3 ngày so với ngày check-in: Hoàn 100% tiền cọc.
- Hủy trước 1-2 ngày: Hoàn 50% tiền cọc.
- Hủy trong ngày check-in hoặc không đến (No-show): Không hoàn tiền cọc.
- Đổi ngày: Miễn phí nếu thông báo trước 2 ngày (tùy tình trạng phòng).

═══════════════════════════════════════
CHÍNH SÁCH TRẺ EM & GIƯỜNG PHỤ
═══════════════════════════════════════
- Trẻ em dưới 6 tuổi: Miễn phí (ngủ chung giường bố mẹ).
- Trẻ em 6-12 tuổi: Có thể phụ thu tùy loại phòng (xem chi tiết trong từng loại phòng).
- Giường phụ (extra bed): Tùy loại phòng cho phép hay không, phí kê thêm xem chi tiết từng loại phòng.
- Nôi em bé (baby cot): Miễn phí, thông báo trước để chuẩn bị.

═══════════════════════════════════════
TIỆN ÍCH CÔNG CỘNG
═══════════════════════════════════════
- Wifi miễn phí toàn khách sạn: Tốc độ 100Mbps, đủ mạnh để họp online và chơi game.
- Hồ bơi: Tầng thượng, hoạt động 06:00 - 21:00 hàng ngày (miễn phí cho khách lưu trú).
- Phòng tập Gym: Tầng 2, hoạt động 05:30 - 22:00 (miễn phí cho khách lưu trú).
- Nhà hàng: Tầng 1, phục vụ từ 06:00 - 22:00.
- Buffet sáng: 06:30 - 09:30 tại nhà hàng Tầng 1 (có bao gồm hoặc không tùy loại phòng).
- Bãi đậu xe: Có bãi đậu xe máy (miễn phí) và ô tô (50.000 VNĐ/đêm). Không cần đặt trước.
- Quầy bar: Tầng thượng, hoạt động 17:00 - 23:00.

═══════════════════════════════════════
CHÍNH SÁCH KHÁC
═══════════════════════════════════════
- Thú cưng: Không cho phép mang thú cưng vào khách sạn.
- Hút thuốc: Chỉ được phép tại khu vực hút thuốc chỉ định (sân thượng). Cấm hút thuốc trong phòng.
- Gửi hành lý: Miễn phí gửi hành lý tại lễ tân trước/sau giờ check-in/check-out.
- An ninh: Camera giám sát 24/7, khóa thẻ từ điện tử, két sắt trong phòng.
- Phòng thông nhau (connecting rooms): Có một số phòng hỗ trợ, vui lòng yêu cầu khi đặt phòng.

═══════════════════════════════════════
QUY TẮC TRẢ LỜI
═══════════════════════════════════════
1. SỬ DỤNG CÁC TOOLS để tra cứu DB khi khách hỏi về: phòng trống, giá phòng, chi tiết phòng, booking, dịch vụ, khuyến mãi, menu đồ ăn. TUYỆT ĐỐI KHÔNG TỰ BỊA dữ liệu.
2. Trả lời bằng tiếng Việt, thân thiện, lịch sự, ngắn gọn.
3. Nếu khách hỏi kiểm tra đặt phòng → yêu cầu họ cung cấp SĐT hoặc mã đơn trước.
4. Nếu câu hỏi không liên quan đến khách sạn/du lịch → lịch sự từ chối, hướng về chủ đề khách sạn.
5. Nếu không chắc chắn → xin lỗi và đề nghị khách liên hệ Hotline 0983 230 945.
6. Định dạng câu trả lời: Dùng **in đậm** cho tiêu đề, dùng danh sách gạch đầu dòng (-) cho liệt kê. Ngắn gọn, súc tích. KHÔNG dùng bảng biểu Markdown.
7. Luôn chủ động gợi ý thêm dịch vụ (upsell) khi phù hợp.
8. Xưng hô: "em" (nhân viên) - "anh/chị" (khách).
`;

// =============================================
// PHẦN 4: CONTROLLER
// =============================================
class ChatbotController {
  // [POST] /api/chatbot
  async chat(req, res) {
    try {
      const userMessage = req.body.message;
      if (!userMessage) {
        return res.status(400).json({ error: "Nội dung tin nhắn không được để trống" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'your_api_key_here') {
        return res.status(500).json({ error: "Hệ thống chưa cấu hình API Key." });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite",
        tools: tools,
        generationConfig: {
          maxOutputTokens: 700,  // Giới hạn độ dài để trả lời nhanh hơn
          temperature: 0.5,      // Bớt sáng tạo, tập trung vào task
        }
      });

      const userHistory = req.body.history || [];

      // Nhận diện khách hàng đã đăng nhập
      let dynamicSystemPrompt = SYSTEM_PROMPT;
      if (req.session && req.session.user) {
        const u = req.session.user;
        const name = u.fullName || u.username || 'Quý khách';
        dynamicSystemPrompt += `\n\n[QUAN TRỌNG: NGỮ CẢNH HIỆN TẠI]
Khách hàng đang chat với bạn ĐÃ ĐĂNG NHẬP vào hệ thống tài khoản của khách sạn.
- Tên khách hàng: ${name}
- Số điện thoại: ${u.phone || 'Chưa cập nhật'}
- Email: ${u.email || 'Chưa cập nhật'}

Yêu cầu hành vi:
1. Luôn xưng hô bằng tên riêng "${name}" một cách lịch sự, thân thiện (ví dụ: "Dạ chào anh/chị ${name}").
2. NẾU khách yêu cầu kiểm tra/hủy/đổi lịch đặt phòng, BẮT BUỘC tự động sử dụng Số điện thoại (${u.phone}) để gọi hàm checkBookingStatus MÀ KHÔNG CẦN HỎI LẠI số điện thoại.`;
      }

      // Khởi tạo history bắt buộc (System Prompt + Lời chào)
      const formattedHistory = [
        { role: "user", parts: [{ text: dynamicSystemPrompt }] },
        { role: "model", parts: [{ text: "Dạ em đã sẵn sàng hỗ trợ anh/chị. Em là Linh, lễ tân ảo của 20Hotel ạ! Anh/chị cần em tư vấn gì ạ?" }] }
      ];

      // Đưa lịch sử chat từ frontend vào
      userHistory.forEach(msg => {
        formattedHistory.push({
          role: msg.role === 'bot' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        });
      });

      const chatSession = model.startChat({
        history: formattedHistory,
      });

      let result = await chatSession.sendMessage(userMessage);

      // Vòng lặp Function Calling (tối đa 5 lần để xử lý trường hợp AI gọi nhiều tool liên tiếp)
      let callCount = 0;
      while (result.response.functionCalls() && callCount < 5) {
        const functionCalls = result.response.functionCalls();
        const functionResponses = [];

        // Xử lý tất cả function calls song song
        for (const call of functionCalls) {
          console.log(`[Chatbot] AI gọi hàm: ${call.name}`, call.args);

          let apiResponse;
          try {
            if (dbFunctions[call.name]) {
              apiResponse = await dbFunctions[call.name](call.args || {});
            } else {
              apiResponse = { error: `Hàm ${call.name} không tồn tại.` };
            }
          } catch (err) {
            console.error(`[Chatbot] Lỗi hàm ${call.name}:`, err.message);
            apiResponse = { error: "Lỗi hệ thống khi tra cứu dữ liệu." };
          }

          // Gemini proto requires `response` to be a plain object, not an array.
          // Wrap arrays in { result: [...] } to avoid "cannot start list" error.
          const responsePayload = Array.isArray(apiResponse)
            ? { result: apiResponse }
            : apiResponse;

          functionResponses.push({
            functionResponse: { name: call.name, response: responsePayload }
          });
        }

        result = await chatSession.sendMessage(functionResponses);
        callCount++;
      }

      const responseText = result.response.text();
      res.json({ reply: responseText });

    } catch (error) {
      console.error("[Chatbot] Lỗi:", error.message);

      if (error.status === 429) {
        return res.status(429).json({
          error: "Hệ thống AI đang quá tải. Vui lòng thử lại sau vài giây."
        });
      }

      res.status(500).json({
        error: "Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ Hotline 0983 230 945."
      });
    }
  }
}

module.exports = new ChatbotController();
