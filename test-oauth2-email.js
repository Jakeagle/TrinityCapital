// Minimal test script for Gmail OAuth2
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();

// Replace these with values from your DB or .env
const teacherEmail = 'your-test-email@gmail.com'; // <-- set to the email you want to test
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN; // <-- set to the refresh token from your DB or environment variable

async function sendTestEmail() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.OAUTH2_REDIRECT_URI,
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: teacherEmail,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken,
        accessToken: accessToken.token,
      },
    });
    const mailOptions = {
      from: `OAuth2 Test <${teacherEmail}>`,
      to: teacherEmail, // send to self
      subject: 'OAuth2 Test Email',
      text: 'This is a test email sent using OAuth2 and nodemailer.',
    };
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result.response);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

sendTestEmail();
