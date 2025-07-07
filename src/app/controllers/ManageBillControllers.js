const Bill = require('../models/Bill')


class ManageBillController {

  
  CreateBill(req, res, next) {

    const {
        idBill,
        name,
        phone,
        checkIn,
        checkOut,
        roomNumber,
        totalPrice,
    } = req.body;

   const bill = new Bill({
       idBill,
        name,
        phone,
        checkIn,
        checkOut,
        roomNumber,
        totalPrice,
      });
    bill
      .save()
      .then(() => res.json({ message: 'success' }))
      .catch((err) => {
        console.error(err)
        res.status(500).send('Lỗi khi tạo hóa đơn')
      })
  }

   delete(req, res, next) {
      Bill.deleteOne({ _id: req.params.id})
        .then(() => {
          res.redirect('/manage/quan_li_hoadon');
          alert('Trả phòng thành công!');
        })
        .catch(next)
    }
}

module.exports = new ManageBillController()
