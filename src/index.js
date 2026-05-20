require('dotenv').config(); // Load environment variables
const path = require('path')
const express = require('express')
const morgan = require('morgan')
const handel = require('express-handlebars').engine
const methodOverride = require('method-override')
const session = require('express-session')
const MongoStore = require('connect-mongo');
const app = express();
const flash = require('connect-flash');
const port = 3000
const http = require('http'); // Import module http gốc của Node.js
const { Server } = require("socket.io");
const moment = require('moment');
const route = require('./routes')
const db = require('./config/db')

const server = http.createServer(app); // Tạo server HTTP từ app Express
const io = new Server(server, { /* Tùy chọn cấu hình nếu cần */ });

db.connect()

app.use(express.static(path.join(__dirname, 'public')))

app.set('socketio', io);

app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/QuanLyKhachSan',
    ttl: 24 * 60 * 60
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}));


app.use((req, res, next) => {
  res.locals.user = req.session.user || null; 
  res.locals.username = req.session.user?.username || null;
  res.locals.userRole = req.session.user?.role || null;
  next();
});

app.use(
  express.urlencoded({
    extended: true,
  })
)
app.use(express.json());
app.use(flash());

app.use(methodOverride('_method'))

// app.use(morgan('combined'))

app.engine(
  'hbs',
  handel({
    extname: '.hbs',
    defaultLayout: 'main', 
    layoutsDir: path.join(__dirname, 'resources', 'views', 'layouts'),
    helpers: {
      sum: (a,b) => a+b,
      // chuan dang tien VND
      money: (value) => {
        return value?.toLocaleString('vi-VN');
      } ,
      toString: (value) => String(value),
      or: (a,b) => a || b,
      isSelected: (a, b) => a?.toString() === b?.toString() ? 'selected' : '',
      // phan trang
      eq: (a, b) => String(a) === String(b),
      gt: (a, b) => a > b,
      lt: (a, b) => a < b,
      add: (a, b) => a + b,
      subtract: (a, b) => a - b,
      range: function (start, end) {
        const result = [];
        for (let i = start; i <= end; i++) {
          result.push(i);
        }
        return result;
      },

      toFixed: function (value, digits) {
        const numValue = Number(value);
        const numDigits = parseInt(digits, 10) || 0;
        
        if (isNaN(numValue)) {
            return value; // Trả về nguyên bản nếu không phải là số
        }
        return numValue.toFixed(numDigits);
      },

      isoDate: function (date) {
        if (!date) return '';
          const d = new Date(date);
          return d.toISOString().slice(0, 10);   // ví dụ 2025-07-01
      },

      // Date chuẩn
      Date: function(date) {
      if (!date) return '';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
      },
      //String chuan
      eqString: (a, b) => {
        if (typeof a === 'string' && typeof b === 'string') {
          return a.toLowerCase() === b.toLowerCase();
        }
        return String(a) === String(b);
      },

      m2: function (text) {
          if (!text) return '';
          return text.toString().replace(/m2/g, 'm<sup>2</sup>');
      },
      isNotDefined: function (value) {
        return value === undefined || value === null;
      },
      now: function () {
        return moment().format('YYYY-MM-DD');
      },
      DateTime: function(date) {
        if (!date) return '';
        // Định dạng HH:mm DD/MM/YYYY (ví dụ: 14:30 23/10/2025)
        return moment(date).format('HH:mm DD/MM/YYYY');
      },

      // Lấy chữ cái đầu của tên (dùng cho avatar đánh giá)
      initial: function(name) {
        if (!name) return '?';
        return name.trim().charAt(0).toUpperCase();
      },

      // Lặp N lần (dùng cho sao đánh giá)
      times: function(n, options) {
        let result = '';
        for (let i = 0; i < n; i++) result += options.fn(i);
        return result;
      },

      // Định dạng ngày tháng cho đánh giá
      formatDate: function(date) {
        if (!date) return '';
        return moment(date).format('DD/MM/YYYY');
      }

    }
  
  })
)

app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'resources/views'))

io.on('connection', (socket) => {
    console.log('Một người dùng đã kết nối WebSocket:', socket.id);

    socket.on('disconnect', () => {
        console.log('Đã Ngắt');
    });

});

route(app)

server.listen(port, () => {
    console.log(`🚀 App đang chạy tại http://localhost:${port}`);
});
