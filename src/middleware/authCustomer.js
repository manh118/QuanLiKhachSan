// middleware/authCustomer.js
module.exports = function (req, res, next) {
    // Nếu có session, và role là 'user' (hoặc 'quanli' cũng được xem)
    if (req.session.user && (req.session.user.role === 'user' ||  req.session.user.role === 'admin')) {
        return next(); 
    }
        res.redirect('/account/login');
};