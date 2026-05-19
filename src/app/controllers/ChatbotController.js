const { GoogleGenerativeAI } = require("@google/generative-ai");
const RoomType = require('../models/RoomType');
const Service = require('../models/Service');
const Room = require('../models/Room');

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
                return res.status(500).json({ 
                    error: "Hệ thống chưa được cấu hình API Key. Vui lòng thêm GEMINI_API_KEY vào file .env." 
                });
            }

            // Khởi tạo Gemini client
            const genAI = new GoogleGenerativeAI(apiKey);
            // Sử dụng model gemini-2.5-flash vì nó nhanh và miễn phí
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            // Lấy dữ liệu Real-time từ Database
            const roomTypes = await RoomType.find({}).lean();
            const services = await Service.find({ isActive: true }).lean();

            // Chuyển đổi dữ liệu thành văn bản dễ đọc cho AI
            const roomDataString = roomTypes.map(r => 
                `- Phòng ${r.name}: Giá ${r.price.toLocaleString('vi-VN')} VNĐ/đêm (Tiêu chuẩn ${r.maxAdults} NL, Tối đa ${r.maxOccupancy} NL)`
            ).join('\\n                ');

            const serviceDataString = services.map(s => 
                `- ${s.name}: ${s.price.toLocaleString('vi-VN')} VNĐ / ${s.unit}`
            ).join('\\n                ');

            const availableRoomsList = await Room.find({ status: 'Trống' }).populate('roomType').lean();
            const availableRoomsByType = {};
            availableRoomsList.forEach(room => {
                if (room.roomType && room.roomType.name) {
                    const typeName = room.roomType.name;
                    if (!availableRoomsByType[typeName]) {
                        availableRoomsByType[typeName] = [];
                    }
                    availableRoomsByType[typeName].push(room.roomNumber);
                }
            });

            let availableString = "";
            if (Object.keys(availableRoomsByType).length === 0) {
                availableString = "Hiện tại khách sạn đã HẾT PHÒNG TRỐNG trong hôm nay.";
            } else {
                for (const [type, roomNumbers] of Object.entries(availableRoomsByType)) {
                    availableString += `- Phòng ${type}: Còn trống ${roomNumbers.length} phòng (Gồm các phòng cụ thể: ${roomNumbers.join(', ')})\\n                `;
                }
            }

            // Cấu hình prompt ngữ cảnh
            const systemPrompt = `
                Bạn là một nhân viên lễ tân và tư vấn viên nhiệt tình, chuyên nghiệp của khách sạn "20Hotel".
                Thông tin khách sạn:
                - Tên: 20Hotel
                - Địa chỉ: 49 P. Trần Quốc Vượng, Dịch Vọng Hậu, Cầu Giấy, Hà Nội
                - Email: 20hotel@gmail.com
                - Số điện thoại: 0983230945
                
                Dữ liệu loại phòng hiện tại (Từ Database):
                ${roomDataString}
                
                Tình trạng phòng trống hôm nay (Từ Database):
                ${availableString}
                
                Dữ liệu dịch vụ phụ trợ hiện tại (Từ Database):
                ${serviceDataString}
                
                Nhiệm vụ của bạn:
                - Trả lời các câu hỏi của khách hàng về khách sạn một cách thân thiện, lịch sự và ngắn gọn.
                - Trả lời bằng tiếng Việt.
                - Nếu khách hỏi những thông tin không liên quan đến khách sạn hoặc du lịch, hãy lịch sự từ chối và hướng họ quay lại chủ đề khách sạn.
                - Nếu bạn không biết câu trả lời chính xác, hãy xin lỗi và đề nghị khách hàng liên hệ trực tiếp qua số điện thoại hoặc email.
                - Câu trả lời KHÔNG ĐƯỢC dùng Markdown phức tạp (như bảng biểu), chỉ dùng in đậm, in nghiêng hoặc gạch đầu dòng cơ bản nếu cần.
                - Xuống dòng rõ ràng cho dễ đọc.
            `;

            // Gửi prompt tổng hợp
            const prompt = `${systemPrompt}\n\nTin nhắn của khách hàng: "${userMessage}"\nTrả lời của bạn:`;
            
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            res.json({ reply: responseText });
            
        } catch (error) {
            console.error("Lỗi Chatbot:", error);
            res.status(500).json({ error: "Xin lỗi, hệ thống AI đang bận hoặc gặp sự cố. Vui lòng thử lại sau." });
        }
    }
}

module.exports = new ChatbotController();
