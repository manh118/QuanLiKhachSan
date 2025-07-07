const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Hàm tạo middleware upload theo thư mục
function uploadTo(subfolder = '') {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const folderPath = path.join(__dirname, `../public/img/${subfolder}`);
      
      // Tạo thư mục nếu chưa có
      fs.mkdirSync(folderPath, { recursive: true });

      cb(null, folderPath);
    },
    filename: function (req, file, cb) {
      const uniqueName = Date.now() + '-' + file.originalname;
      cb(null, uniqueName);
    }
  });

  return multer({ storage });
}


module.exports = uploadTo;

