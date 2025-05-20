
// src/lib/razorpay.ts
import Razorpay from 'razorpay';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId) {
  throw new Error('Razorpay Key ID not found. Please set RAZORPAY_KEY_ID in your .env file.');
}

if (!razorpayKeySecret) {
  throw new Error('Razorpay Key Secret not found. Please set RAZORPAY_KEY_SECRET in your .env file.');
}

export const razorpayInstance = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});
