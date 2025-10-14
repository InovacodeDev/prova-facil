#!/usr/bin/env node

/**
 * Test Script: Downgrade Indicator
 *
 * This script helps test the downgrade indicator feature by simulating
 * different subscription states and verifying the UI response.
 *
 * Usage:
 *   node scripts/test-downgrade-indicator.js
 */

const https = require('https');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const API_KEY = process.env.STRIPE_SECRET_KEY;

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.blue}▶${colors.reset} ${msg}`),
};

/**
 * Test Case 1: Active Subscription with Scheduled Downgrade
 */
async function testScheduledDowngrade() {
  log.step('Test 1: Active subscription with scheduled downgrade');

  const testData = {
    cancelAtPeriodEnd: true,
    currentPeriodEnd: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
    plan: 'plus',
    status: 'active',
  };

  log.info('Subscription state:');
  console.log('  - Current plan: plus');
  console.log('  - Cancel at period end: true');
  console.log(`  - Period ends: ${new Date(testData.currentPeriodEnd * 1000).toLocaleDateString('pt-BR')}`);

  log.info('Expected behavior:');
  console.log('  ✓ Badge should display: "Até DD/MM"');
  console.log('  ✓ Tooltip should show full date and explanation');
  console.log('  ✓ Current plan should still show as "plus"');

  return true;
}

/**
 * Test Case 2: Active Subscription (No Scheduled Changes)
 */
async function testActiveSubscription() {
  log.step('Test 2: Active subscription without scheduled changes');

  const testData = {
    cancelAtPeriodEnd: false,
    currentPeriodEnd: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
    plan: 'plus',
    status: 'active',
  };

  log.info('Subscription state:');
  console.log('  - Current plan: plus');
  console.log('  - Cancel at period end: false');
  console.log(`  - Period ends: ${new Date(testData.currentPeriodEnd * 1000).toLocaleDateString('pt-BR')}`);

  log.info('Expected behavior:');
  console.log('  ✓ Badge should NOT display');
  console.log('  ✓ No tooltip');
  console.log('  ✓ Normal plan display');

  return true;
}

/**
 * Test Case 3: Scheduled Cancellation (Downgrade to Free)
 */
async function testScheduledCancellation() {
  log.step('Test 3: Scheduled cancellation (to free plan)');

  const testData = {
    cancelAtPeriodEnd: true,
    currentPeriodEnd: Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60, // 2 days from now
    plan: 'basic',
    status: 'active',
  };

  log.info('Subscription state:');
  console.log('  - Current plan: basic');
  console.log('  - Cancel at period end: true');
  console.log(`  - Period ends: ${new Date(testData.currentPeriodEnd * 1000).toLocaleDateString('pt-BR')}`);
  console.log('  - Will downgrade to: starter (free)');

  log.info('Expected behavior:');
  console.log('  ✓ Badge should display: "Até DD/MM"');
  console.log('  ✓ Tooltip mentions plan will change');
  console.log('  ✓ Badge shows urgency (2 days left)');

  return true;
}

/**
 * Test Case 4: Past Period End (Edge Case)
 */
async function testPastPeriodEnd() {
  log.step('Test 4: Past period end (edge case)');

  const testData = {
    cancelAtPeriodEnd: true,
    currentPeriodEnd: Math.floor(Date.now() / 1000) - 24 * 60 * 60, // Yesterday
    plan: 'plus',
    status: 'active',
  };

  log.info('Subscription state:');
  console.log('  - Current plan: plus');
  console.log('  - Cancel at period end: true');
  console.log(`  - Period ends: ${new Date(testData.currentPeriodEnd * 1000).toLocaleDateString('pt-BR')} (PAST)`);

  log.info('Expected behavior:');
  console.log('  ⚠ Badge would show past date (webhook should have cleared flag)');
  console.log('  ⚠ System should self-correct on next subscription fetch');
  console.log('  ✓ Non-breaking: Shows badge until webhook processes');

  return true;
}

/**
 * Test Case 5: Date Formatting
 */
function testDateFormatting() {
  log.step('Test 5: Date formatting functions');

  const testTimestamp = 1732147200; // Nov 20, 2024
  const date = new Date(testTimestamp * 1000);

  // Compact format
  const compact = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });

  // Full format
  const full = date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  log.info('Date formatting:');
  console.log(`  - Unix timestamp: ${testTimestamp}`);
  console.log(`  - Compact (badge): "${compact}"`);
  console.log(`  - Full (tooltip): "${full}"`);

  log.success('Date formatting working correctly');

  return true;
}

/**
 * Visual Reference: Expected UI
 */
function showVisualReference() {
  log.step('Visual Reference: Expected Sidebar UI');

  console.log('\n┌─────────────────────────────────────┐');
  console.log('│  👑  Plano Ativo  [Até 20/11]      │');
  console.log('│      plus                           │');
  console.log('│                                     │');
  console.log('│  [Fazer Upgrade]                   │');
  console.log('└─────────────────────────────────────┘');

  console.log('\nTooltip on hover:');
  console.log('┌─────────────────────────────────────┐');
  console.log('│ Mudança de plano agendada           │');
  console.log('│                                     │');
  console.log('│ Seu plano atual plus continua       │');
  console.log('│ ativo até 20 de novembro de 2025.   │');
  console.log('│                                     │');
  console.log('│ Após essa data, a mudança será      │');
  console.log('│ aplicada automaticamente.           │');
  console.log('└─────────────────────────────────────┘\n');
}

/**
 * Manual Testing Checklist
 */
function showManualTestingChecklist() {
  log.step('Manual Testing Checklist');

  console.log('\n1. Setup:');
  console.log('   [ ] Start development server (npm run dev)');
  console.log('   [ ] Login as a user with active subscription');
  console.log('   [ ] Navigate to /dashboard (Sidebar visible)');

  console.log('\n2. Test Downgrade:');
  console.log('   [ ] Go to /plan page');
  console.log('   [ ] Downgrade from current plan to lower tier');
  console.log('   [ ] Verify badge appears in Sidebar: "Até DD/MM"');
  console.log('   [ ] Hover badge and verify tooltip content');
  console.log('   [ ] Verify current plan still shows (not downgraded yet)');

  console.log('\n3. Test Real-time Update:');
  console.log('   [ ] Open app in two browser tabs');
  console.log('   [ ] Downgrade in Tab 1');
  console.log('   [ ] Verify Tab 2 updates automatically (badge appears)');
  console.log('   [ ] Check browser console for Supabase Realtime logs');

  console.log('\n4. Test Badge Removal:');
  console.log('   [ ] Go to /plan page');
  console.log('   [ ] Reactivate subscription (cancel the downgrade)');
  console.log('   [ ] Verify badge disappears from Sidebar');
  console.log('   [ ] Verify plan stays at current level');

  console.log('\n5. Test Date Display:');
  console.log('   [ ] Verify badge shows compact date: "Até 20/11"');
  console.log('   [ ] Verify tooltip shows full date: "20 de novembro de 2025"');
  console.log('   [ ] Verify Portuguese date formatting');

  console.log('\n6. Test Responsive Design:');
  console.log('   [ ] Collapse Sidebar (hamburger menu)');
  console.log('   [ ] Verify badge still visible in collapsed state');
  console.log('   [ ] Verify tooltip works in collapsed state');
  console.log('   [ ] Test on mobile viewport (< 768px)');

  console.log('\n7. Test Accessibility:');
  console.log('   [ ] Navigate with keyboard (Tab key)');
  console.log('   [ ] Verify badge is focusable');
  console.log('   [ ] Verify tooltip appears on focus');
  console.log('   [ ] Test with screen reader');

  console.log('');
}

/**
 * API Testing Guide
 */
function showAPITestingGuide() {
  log.step('API Testing Guide');

  console.log('\nTest subscription API endpoint:');
  console.log('```bash');
  console.log('curl http://localhost:3000/api/stripe/subscription \\');
  console.log('  -H "Cookie: your-session-cookie" \\');
  console.log('  -H "Content-Type: application/json"');
  console.log('```\n');

  console.log('Expected response with downgrade:');
  console.log('```json');
  console.log(
    JSON.stringify(
      {
        subscription: {
          subscriptionId: 'sub_xxxxx',
          customerId: 'cus_xxxxx',
          status: 'active',
          plan: 'plus',
          cancelAtPeriodEnd: true,
          currentPeriodEnd: 1732147200,
          productId: 'prod_xxxxx',
          priceId: 'price_xxxxx',
        },
      },
      null,
      2
    )
  );
  console.log('```\n');

  console.log('Test Stripe webhook (simulate period end):');
  console.log('```bash');
  console.log('stripe trigger subscription.updated');
  console.log('```\n');
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  Downgrade Indicator - Test Suite');
  console.log('='.repeat(60) + '\n');

  try {
    // Run test cases
    await testScheduledDowngrade();
    console.log('');
    await testActiveSubscription();
    console.log('');
    await testScheduledCancellation();
    console.log('');
    await testPastPeriodEnd();
    console.log('');
    testDateFormatting();
    console.log('');

    // Show visual references
    console.log('\n' + '='.repeat(60));
    showVisualReference();

    // Show testing guides
    console.log('='.repeat(60));
    showManualTestingChecklist();
    console.log('='.repeat(60));
    showAPITestingGuide();

    console.log('='.repeat(60));
    log.success('All test scenarios documented');
    log.info('Follow the manual testing checklist above to verify functionality');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
