import Stripe from 'stripe';
import { env } from '../config/env.js';
import { updateTier } from '../db/repositories/userRepository.js';

const stripe = env.stripeKey ? new Stripe(env.stripeKey, { apiVersion: '2023-10-16' }) : null;

export const createCheckoutSession = async (userId: string) => {
  if (!stripe) {
    return {
      checkoutUrl: 'https://example.com/upgrade-placeholder'
    };
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    success_url: `${process.env.APP_URL ?? 'http://localhost:3000'}/upgrade-success`,
    cancel_url: `${process.env.APP_URL ?? 'http://localhost:3000'}/upgrade-cancelled`,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          recurring: { interval: 'month' },
          unit_amount: 399,
          product_data: {
            name: 'StoryNest Premium',
            description: 'Unlimited story generation with advanced features'
          }
        },
        quantity: 1
      }
    ],
    metadata: { userId }
  });

  return { checkoutUrl: session.url };
};

export const activatePremium = (userId: string) => {
  const updated = updateTier(userId, 'PREMIUM', 30);
  if (!updated) {
    throw new Error('Unable to upgrade user');
  }
  return updated;
};
