/**
 * Landing Page Configuration
 * Valentine's Day Countdown
 */

import { content } from './content';

export const landingConfig = {
  // Target date: Valentine's Day 2026
  // Format: 'YYYY-MM-DDTHH:mm:ss' (e.g., '2026-02-14T00:00:00')
  // TIP: Set to a past date like '2024-01-01T00:00:00' to test the enabled state
  targetDate: '2026-02-14T00:00:00',
  
  // Password to access the love counter
  // Injected from environment variable during build
  // Fallback UUID for local dev - replace with GitHub Secret in production
  password: import.meta.env.VITE_PASSWORD || '204ad17f-0196-4ba1-94d4-6811b8f1b5be',
  
  // Page content (references centralized content file)
  content: {
    title: content.landing.title,
    ctaTextEnabled: content.landing.ctaEnabled,
    ctaTextDisabled: content.landing.ctaDisabled,
  },
};
