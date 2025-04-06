const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
require('dotenv').config();

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function generateRandomPassword(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function sendEmailWithCredentials(email, password) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"OptiSmart" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OptiSmart Login Credentials',
    text: `You have been approved!\n\nLogin email: ${email}\nPassword: ${password}`,
  });
}

module.exports = { hashPassword, generateRandomPassword, sendEmailWithCredentials };
