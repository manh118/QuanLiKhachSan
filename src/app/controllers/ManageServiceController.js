const Service = require('../models/Service')
const Booking = require('../models/Booking');


class ManageServiceController {
    showServiceRoom(req, res) {
        res.render('manage/quan_li_dichvu_create');
  }

  CreateService(req, res, next) {
    const service = new Service(req.body)
    service.save()
      .then(() => res.redirect('/manage/quan_li_dichvu') )
      .catch(next)
  }

  showUpdate(req, res, next) {
    
      Service.findById(req.params.id)
      .lean()
      .then(service => {
        res.render('manage/quan_li_dichvu_update', {service} )
      })
      .catch(next)
  }

  update(req, res, next) {
    const updatedData = {
      idService: req.body.idService,
      name: req.body.name,
      price: req.body.price,
      unit: req.body.unit,
    }

    Service.updateOne({ _id: req.params.id }, updatedData)
      .then(() => {
        res.redirect('/manage/quan_li_dichvu?success=1');
      })
      .catch(next)
  }

   async delete(req, res, next) {
        const serviceIdToDelete = req.params.id;

        try {
            // 1. Kiểm tra xem có booking nào ĐANG HOẠT ĐỘNG sử dụng dịch vụ này không
            const activeBookingUsingService = await Booking.findOne({
                'services.service': serviceIdToDelete, // Tìm trong mảng services
                bookingStatus: { $in: ['Confirmed', 'Checked In'] } // Chỉ kiểm tra booking đang hoạt động
            });

            // 2. Nếu tìm thấy -> Ngăn chặn xóa
            if (activeBookingUsingService) {
                console.warn(`Attempted to delete service ${serviceIdToDelete} which is in use by booking ${activeBookingUsingService._id}`);
                // Chuyển hướng về trang danh sách với thông báo lỗi
                return res.redirect('/manage/quan_li_dichvu?error=serviceInUse');
            }

            // 3. Nếu không tìm thấy booking nào đang dùng -> Tiến hành xóa
            const deleteResult = await Service.deleteOne({ _id: serviceIdToDelete });

            // Kiểm tra xem có xóa được bản ghi nào không (đề phòng ID sai)
            if (deleteResult.deletedCount === 0) {
                 return res.redirect('/manage/quan_li_dichvu?error=notFound');
            }

            console.log(`Đã xóa dịch vụ ID: ${serviceIdToDelete}`);
            res.redirect('/manage/quan_li_dichvu?success=serviceDeleted'); // Thông báo xóa thành công

        } catch (error) {
            console.error('Lỗi khi xóa dịch vụ:', error);
            res.redirect('/manage/quan_li_dichvu?error=deleteFailed');
            // next(error); // Chuyển lỗi nếu cần
        }
    }

   async toggleStatus(req, res, next) {
        try {
            const service = await Service.findById(req.params.id);
            if (!service) {
                return res.redirect('/manage/quan_li_dichvu?error=notFound');
            }

            // Đảo ngược trạng thái
            service.isActive = !service.isActive;
            await service.save();

            const message = service.isActive ? 'activated' : 'deactivated';
            res.redirect(`/manage/quan_li_dichvu?success=${message}`);

        } catch (error) {
            console.error('Lỗi khi thay đổi trạng thái dịch vụ:', error);
            res.redirect('/manage/quan_li_dichvu?error=toggleFailed');
            // next(error);
        }
    } 
}

module.exports = new ManageServiceController()
