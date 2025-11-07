// app/models/Discount.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DiscountSchema = new Schema({
    code: {type: String,required: true,unique: true,uppercase: true, trim: true},
    description: {type: String,required: true},
    discountType: {type: String,
        required: true,
        enum: ['percentage', 'fixed'] // Loại giảm giá: % hoặc số tiền cố định
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0 // Giá trị giảm không âm
    },
    startDate: {
        type: Date,
        default: Date.now // Mặc định là ngày tạo
    },
    endDate: {
        type: Date // Ngày hết hạn 
    },
    usageLimit: {
        type: Number,
        min: 0,
        default: 0 // Số lần sử dụng tối đa (0 = không giới hạn)
    },
    usageCount: {
        type: Number,
        default: 0 // Số lần đã sử dụng
    },
    minOrderValue: {
        type: Number,
        default: 0 // Giá trị đơn hàng tối thiểu để áp dụng
    },
    isActive: {
        type: Boolean,
        default: true // Trạng thái hoạt động
    }
}, { timestamps: true });

DiscountSchema.pre('save', function(next) {
    if (this.discountType === 'percentage' && this.discountValue > 100) {
        this.discountValue = 100; 
    }
    next();
});

module.exports = mongoose.model('Discount', DiscountSchema);