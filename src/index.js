const path = require('path')
const express = require('express')
const morgan = require('morgan')
const handel = require('express-handlebars').engine
const methodOverride = require('method-override')
const session = require('express-session')
const MongoStore = require('connect-mongo');
const app = express()
const port = 3000

const route = require('./routes')
const db = require('./config/db')

db.connect()

app.use(express.static(path.join(__dirname, 'public')))


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
  res.locals.username = req.session.user?.username || null;
  next();
});

app.use(
  express.urlencoded({
    extended: true,
  })
)
app.use(express.json())

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
            return text.replace(/m2/g, 'm<sup>2</sup>');
        }

    }
  
  })
)

app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'resources/views'))

route(app)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
