require('dotenv').config();
const blockchain = require('./blockchain.config');

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoose: {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/avalanche-real-estate',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES || 30,
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS || 30,
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USERNAME || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    },
    from: process.env.EMAIL_FROM || 'admin@avalanche-real-estate.com',
  },
  blockchain,
}; 