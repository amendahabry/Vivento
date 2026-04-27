require('dotenv').config();

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error(
    'JWT_SECRET is not set. Copy .env.example to .env in the backend folder and set JWT_SECRET.'
  );
}

module.exports = secret;
