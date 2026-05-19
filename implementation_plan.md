# Kế Hoạch Tối Ưu Logic & Giao Diện Modal Đặt Phòng

Chào anh, để giải quyết 2 vấn đề anh đưa ra (Logic số người & Giao diện Modal Đặt Phòng), tôi đề xuất phương án cải tổ toàn diện như sau:

## 1. Đề Xuất Logic Khách Ở & Phụ Thu (Business Logic)
Hiện tại, logic khách sạn đang khá lỏng lẻo. Ở một hệ thống quản lý chuyên nghiệp, ta nên áp dụng quy tắc tiêu chuẩn ngành:

*   **Sức chứa tiêu chuẩn (Standard Capacity):** Phụ thuộc vào từng loại phòng. Ví dụ: Phòng Standard tối đa 2 Người lớn + 1 Trẻ em.
*   **Giới hạn số lượng (Max Occupancy):** Chỉ cho phép thêm **tối đa 1 Người lớn** hoặc **2 Trẻ em** so với sức chứa tiêu chuẩn để đảm bảo chất lượng phòng.
*   **Chính sách phụ thu (Surcharge Policy):**
    *   **Người lớn thứ 3 trở đi:** Phụ thu **200,000 VNĐ/người/đêm** (Bao gồm phí giường phụ - Extra bed).
    *   **Trẻ em (dưới 12 tuổi):** Miễn phí 1 trẻ em đầu tiên ngủ chung giường bố mẹ. Trẻ thứ 2 phụ thu **100,000 VNĐ/người/đêm**.
*   **Cách hoạt động trên UI:** Nếu khách chọn vượt quá số lượng cho phép, hệ thống sẽ báo lỗi và không cho phép chọn tiếp. Nếu chọn người lớn vượt mức tiêu chuẩn nhưng nằm trong giới hạn, tự động cộng tiền phụ thu vào "Tạm tính".

> [!IMPORTANT] 
> **User Review Required:** Anh thấy mức phí phụ thu (200k/người lớn, 100k/trẻ em) và giới hạn người này có phù hợp với thực tế 20Hotel của anh không? 

## 2. Kế Hoạch Làm Mới Giao Diện Modal (UI/UX Redesign)
Giao diện Modal hiện tại đang dàn trải và phần dịch vụ xổ ra (collapse) khá thô. Tôi sẽ thiết kế lại theo tiêu chuẩn của các trang OTA lớn (Booking.com, Traveloka):

### Phân chia lại Layout (2 Cột Rõ Ràng)
*   **Cột Trái (Booking Form):** 
    *   Thông tin ngày Nhận/Trả phòng.
    *   Thông tin khách hàng (Tên, SĐT, Email).
    *   Bộ chọn số lượng Người lớn / Trẻ em (sử dụng nút **[ - ] số lượng [ + ]** thay vì thẻ Select thả xuống, có ghi chú rõ mức phụ thu).
*   **Cột Phải (Order Summary - Tóm tắt đơn hàng):**
    *   Tóm tắt số đêm, tổng tiền phòng, tổng tiền dịch vụ, tổng phụ thu.
    *   Hiển thị chi tiết số tiền cần CỌC (50%) và Mã QR code VietQR thật đẹp, chuyên nghiệp.
    *   Nút **ĐẶT PHÒNG NGAY** to, nổi bật.

### Tối ưu "Chọn Dịch Vụ" (Services Selection)
*   Thay vì dùng `collapse` làm xô lệch layout, tôi sẽ đưa danh sách dịch vụ vào một khối (box) bên dưới form thông tin.
*   Mỗi dịch vụ sẽ là một Card nhỏ gọn nằm ngang gồm: **[Icon] Tên dịch vụ - Giá tiền - Nút Tăng/Giảm số lượng [ - 0 + ]**.
*   Khi tăng số lượng, tiền sẽ tự động nhảy trực tiếp sang cột "Tóm tắt đơn hàng" bên phải, mang lại trải nghiệm Real-time (Thời gian thực) rất mượt.

---

> [!NOTE]
> **Quyết định của anh:** Nếu anh đồng ý với phương án logic phụ thu và hướng thiết kế UI mới này, hãy phản hồi **"Đồng ý"** hoặc đề xuất thay đổi mức giá. Tôi sẽ tiến hành code và cập nhật UI ngay lập tức!
