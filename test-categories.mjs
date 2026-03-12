#!/usr/bin/env node

// Polyfill navigator BEFORE any imports
if (typeof navigator === 'undefined') {
  globalThis.navigator = {
    platform: process.platform === 'win32' ? 'Win32' : 'Linux',
  };
}

import 'dotenv/config';
import actual from '@actual-app/api';
import fs from 'fs';

(async () => {
  try {
    console.log('🔌 Connecting to ActualBudget...\n');
    
    await actual.init({
      dataDir: '/tmp/actual-test/',
      serverURL: process.env.ACTUAL_SERVER_URL,
      password: process.env.ACTUAL_SERVER_PASSWORD,
    });

    console.log('📥 Downloading budget...\n');
    await actual.downloadBudget(process.env.BUDGET_ID, {
      password: process.env.ACTUAL_E2E_PASSWORD,
    });

    console.log('📋 Fetching categories...\n');
    const categories = await actual.getCategories();

    console.log(`✅ Got ${categories.length} categories\n`);
    console.log('='.repeat(80));
    console.log('ALL CATEGORIES (with all fields):');
    console.log('='.repeat(80));
    console.log(JSON.stringify(categories, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('ANALYSIS:');
    console.log('='.repeat(80));

    // Group analysis
    const groupIds = new Set();
    categories.forEach(cat => {
      if (cat.group_id) {
        groupIds.add(cat.group_id);
      }
    });

    console.log(`\n📊 Unique group_ids found: ${groupIds.size}`);
    console.log('Group IDs:', Array.from(groupIds));

    // Check if any category ID matches a group_id (meaning it's a group)
    console.log('\n🔍 Looking for categories that ARE groups...');
    const categoryIds = new Set(categories.map(c => c.id));
    const groupsAsCategories = Array.from(groupIds).filter(gid => categoryIds.has(gid));
    
    if (groupsAsCategories.length > 0) {
      console.log(`Found ${groupsAsCategories.length} categories that are groups:`);
      groupsAsCategories.forEach(groupId => {
        const group = categories.find(c => c.id === groupId);
        console.log(`  - ${group?.name} (${groupId})`);
      });
    } else {
      console.log('❌ No categories found with IDs matching group_ids');
      console.log('   (Groups are not included in getCategories() response)');
    }

    // Check for categories without group_id (potential groups)
    console.log('\n🔍 Categories without group_id:');
    const noGroup = categories.filter(c => !c.group_id);
    if (noGroup.length > 0) {
      noGroup.forEach(cat => {
        console.log(`  - ${cat.name} (id: ${cat.id})`);
      });
    } else {
      console.log('  None - all categories have a group_id');
    }

    // Try getCategoriesGrouped
    console.log('\n' + '='.repeat(80));
    console.log('Trying getCategoriesGrouped()...');
    console.log('='.repeat(80));
    try {
      const grouped = await actual.getCategoriesGrouped?.();
      if (grouped) {
        console.log('Result:', JSON.stringify(grouped, null, 2));
      } else {
        console.log('getCategoriesGrouped returned:', grouped);
      }
    } catch (e) {
      console.log('Error:', e.message);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Test complete!');
    console.log('='.repeat(80));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
