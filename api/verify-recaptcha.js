// file: /api/verify-recaptcha.js
const axios = require('axios');

// Vercel sẽ bọc code này thành một serverless function
module.exports = async (req, res) => {
  // Chỉ chấp nhận yêu cầu POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Lấy token từ body của request mà app Android gửi lên
    const { recaptchaToken } = req.body;
    
    // Lấy Secret Key từ Environment Variables của Vercel để bảo mật
    const secretKey = process.env.RECAPTCHA_SECRET_KEY; 

    if (!recaptchaToken) {
      return res.status(400).json({ success: false, message: 'Thiếu reCAPTCHA token.' });
    }

    // URL xác thực của Google
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
    
    // Dùng axios để gọi API của Google
    const response = await axios.post(verificationUrl);

    // Trả kết quả về cho app Android
    if (response.data.success) {
      // Xác thực thành công
      return res.status(200).json({ success: true });
    } else {
      // Xác thực thất bại
      return res.status(400).json({ success: false, message: 'Token không hợp lệ.', errors: response.data['error-codes'] });
    }
  } catch (error) {
    console.error('Lỗi server:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};
