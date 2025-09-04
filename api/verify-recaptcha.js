// file: /api/verify-recaptcha.js
const axios = require('axios');

module.exports = async (req, res) => {
  // Chỉ chấp nhận POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Ưu tiên hcaptchaToken; chấp nhận recaptchaToken để tương thích ngược
    const { hcaptchaToken, recaptchaToken } = req.body || {};
    const token = hcaptchaToken || recaptchaToken;

    // Lấy Secret Key từ biến môi trường (đổi sang HCAPTCHA_SECRET_KEY)
    const secretKey = process.env.HCAPTCHA_SECRET_KEY;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Thiếu hCaptcha token.' });
    }
    if (!secretKey) {
      return res.status(500).json({ success: false, message: 'Thiếu HCAPTCHA_SECRET_KEY trong môi trường.' });
    }

    // Lấy IP client (giúp chống lạm dụng; optional)
    const remoteip = (req.headers['x-forwarded-for'] || '').split(',')[0]?.trim();

    // Gửi form-encoded tới hCaptcha
    const form = new URLSearchParams();
    form.append('secret', secretKey);
    form.append('response', token);
    if (remoteip) form.append('remoteip', remoteip);

    const verifyResp = await axios.post('https://hcaptcha.com/siteverify', form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    });

    const data = verifyResp.data; // { success: boolean, challenge_ts, hostname|apk_package_name, 'error-codes'?: [] }

    if (data.success) {
      return res.status(200).json({
        success: true,
        challenge_ts: data.challenge_ts,
        hostname: data.hostname,
        apk_package_name: data.apk_package_name,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ.',
        errors: data['error-codes'] || [],
      });
    }
  } catch (error) {
    console.error('Lỗi server:', error?.response?.data || error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};
