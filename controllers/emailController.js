// const nodemailer = require('nodemailer');
// require('dotenv').config(); // Load environment variables

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   host: 'smtp.gmail.com',
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// const sendEmail = async (req, res) => {
//   const { to, subject, text, html } = req.body;

//   if (!to || !subject || !text || !html) {
//     return res.status(400).json({
//       success: false,
//       message: 'Missing required fields in the request body'
//     });
//   }

//   try {
//     await transporter.sendMail({
//       from: `BasobasMitra <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       text, // Plain text version
//       html  // HTML version
//     });

//     res.status(200).json({ 
//       success: true, 
//       message: 'Email sent successfully' 
//     });
//   } catch (error) {
//     console.error('Error sending email:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to send email',
//       error: error.message 
//     });
//   }
// };

// module.exports = { sendEmail };

const nodemailer = require('nodemailer');
const config = require('../config/config'); // Import the config file

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: config.emailUser, // Use config instead of process.env
    pass: config.emailPassword // Use config instead of process.env
  }
});

const sendEmail = async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!to || !subject || !text || !html) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields in the request body'
    });
  }

  try {
    await transporter.sendMail({
      from: `BasobasMitra <${config.emailUser}>`, // Use config instead of process.env
      to,
      subject,
      text, // Plain text version
      html  // HTML version
    });

    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email',
      error: error.message 
    });
  }
};

module.exports = { sendEmail };
