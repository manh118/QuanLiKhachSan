// app/controllers/ManageDiscountController.js
const Discount = require('../models/Discount');

class ManageDiscountController {

    // Hiển thị form tạo mã mới
    showCreateDiscount(req, res) {
        res.render('manage/quan_li_khuyenmai_create');
    }

    // Xử lý tạo mã mới
    async createDiscount(req, res, next) {
        try {
            const formData = req.body;

            let isActiveValue = formData.isActive;
            if (Array.isArray(isActiveValue)) {
                isActiveValue = isActiveValue[0]; // Lấy 'true'
            }
            // Chuyển đổi thành boolean thực sự
            formData.isActive = (isActiveValue === 'true');

            // Xử lý giá trị trống cho endDate và usageLimit
            if (!formData.endDate) formData.endDate = null;
            if (!formData.usageLimit || parseInt(formData.usageLimit, 10) <= 0) formData.usageLimit = 0;
            else formData.usageLimit = parseInt(formData.usageLimit, 10);

             // Chuyển giá trị discountValue sang số
             formData.discountValue = parseFloat(formData.discountValue);
             if (isNaN(formData.discountValue)) {
                  throw new Error('Giá trị giảm giá không hợp lệ');
             }


            const newDiscount = new Discount(formData);
            await newDiscount.save();
            res.redirect('/manage/quan_li_khuyenmai?success=created');
        } catch (error) {
            console.error("Lỗi tạo mã giảm giá:", error);
            // Bắt lỗi trùng code
            if (error.code === 11000) {
                 return res.render('manage/quan_li_khuyenmai_create', {
                     error: `Mã giảm giá "${req.body.code}" đã tồn tại.`,
                     formData: req.body // Giữ lại dữ liệu đã nhập
                 });
            }
             // Bắt lỗi validation khác
            if (error.name === 'ValidationError') {
                 const messages = Object.values(error.errors).map(val => val.message);
                 return res.render('manage/quan_li_khuyenmai_create', {
                     error: `Dữ liệu không hợp lệ: ${messages.join(', ')}`,
                     formData: req.body
                 });
            }
            // Lỗi chung
            res.render('manage/quan_li_khuyenmai_create', {
                 error: 'Đã có lỗi xảy ra, không thể tạo mã.',
                 formData: req.body
            });
            // next(error); // Hoặc chuyển cho middleware lỗi chung
        }
    }

    // Ví dụ hàm xóa đơn giản:
     async deleteDiscount(req, res, next) {
         try {
             await Discount.deleteOne({ _id: req.params.id });
             res.redirect('/manage/quan_li_khuyenmai?success=deleted');
         } catch (error) {
             console.error('Lỗi khi xóa mã giảm giá:', error);
             res.redirect('/manage/quan_li_khuyenmai?error=deleteFailed');
             // next(error);
         }
     }

}

module.exports = new ManageDiscountController();