// src/lib/stripe.ts
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Stripe secret key not found. Please set STRIPE_SECRET_KEY in your .env file.');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20', // Use the latest API version
  typescript: true,
});
