// lib/migrateEssentialStatus.ts - FIXED TYPE ERRORS
'use client';

import { debug } from '@/lib/debug';
/**
 * Migrate essential status from localStorage to database
 * This should be called once after the database schema is updated
 */
export async function migrateEssentialStatusToDatabase(): Promise<{
  success: boolean;
  migrated: {
    subscriptions: number;
    expenses: number;
    orders: number;
  };
  errors: string[];
}> {
  const results = {
    success: true,
    migrated: {
      subscriptions: 0,
      expenses: 0,
      orders: 0,
    },
    errors: [] as string[],
  };

  try {
    // Get essential status from localStorage
    const subscriptionEssentials = getEssentialStatus('needix-subscriptions-essential');
    const expenseEssentials = getEssentialStatus('needix-expenses-essential');
    const orderEssentials = getEssentialStatus('needix-orders-essential');

    debug.log('🚀 Starting essential status migration...');
    debug.log('📊 Found essential items:', {
      subscriptions: Object.keys(subscriptionEssentials).length,
      expenses: Object.keys(expenseEssentials).length,
      orders: Object.keys(orderEssentials).length,
    });

    // Migrate subscriptions
    for (const [id, isEssential] of Object.entries(subscriptionEssentials)) {
      if (isEssential) {
        try {
          const response = await fetch(`/api/subscriptions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isEssential: true }),
          });
          
          if (response.ok) {
            results.migrated.subscriptions++;
            debug.log(`✅ Migrated subscription ${id} as essential`);
          } else {
            const errorText = await response.text();
            results.errors.push(`Failed to migrate subscription ${id}: ${response.statusText} - ${errorText}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          results.errors.push(`Error migrating subscription ${id}: ${errorMsg}`);
        }
        
        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Migrate expenses
    for (const [id, isEssential] of Object.entries(expenseEssentials)) {
      if (isEssential) {
        try {
          const response = await fetch(`/api/expenses/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isEssential: true }),
          });
          
          if (response.ok) {
            results.migrated.expenses++;
            debug.log(`✅ Migrated expense ${id} as essential`);
          } else {
            const errorText = await response.text();
            results.errors.push(`Failed to migrate expense ${id}: ${response.statusText} - ${errorText}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          results.errors.push(`Error migrating expense ${id}: ${errorMsg}`);
        }
        
        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Migrate orders
    for (const [id, isEssential] of Object.entries(orderEssentials)) {
      if (isEssential) {
        try {
          const response = await fetch(`/api/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isEssential: true }),
          });
          
          if (response.ok) {
            results.migrated.orders++;
            debug.log(`✅ Migrated order ${id} as essential`);
          } else {
            const errorText = await response.text();
            results.errors.push(`Failed to migrate order ${id}: ${response.statusText} - ${errorText}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          results.errors.push(`Error migrating order ${id}: ${errorMsg}`);
        }
        
        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const totalMigrated = results.migrated.subscriptions + results.migrated.expenses + results.migrated.orders;
    
    if (totalMigrated > 0) {
      debug.log('🎉 Migration completed successfully!', results.migrated);
      debug.log(`📈 Total items migrated: ${totalMigrated}`);
    } else {
      debug.log('ℹ️ No essential items found to migrate');
    }

    // Clean up localStorage after successful migration (only if no errors)
    if (results.errors.length === 0 && totalMigrated > 0) {
      localStorage.removeItem('needix-subscriptions-essential');
      localStorage.removeItem('needix-expenses-essential');
      localStorage.removeItem('needix-orders-essential');
      debug.log('🧹 Cleaned up localStorage essential status');
    } else if (results.errors.length > 0) {
      console.warn('⚠️ Keeping localStorage data due to migration errors');
      results.success = false;
    }

  } catch (error) {
    results.success = false;
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.errors.push(`Migration failed: ${errorMsg}`);
    console.error('❌ Migration failed:', error);
  }

  return results;
}

/**
 * Helper to get essential status from localStorage
 */
function getEssentialStatus(key: string): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as Record<string, boolean> : {};
  } catch (error) {
    console.error(`Failed to read ${key} from localStorage:`, error);
    return {};
  }
}

/**
 * Check if there are any essential items in localStorage that need migration
 */
export function hasEssentialDataToMigrate(): boolean {
  const subscriptionEssentials = getEssentialStatus('needix-subscriptions-essential');
  const expenseEssentials = getEssentialStatus('needix-expenses-essential');
  const orderEssentials = getEssentialStatus('needix-orders-essential');
  
  const hasSubscriptions = Object.values(subscriptionEssentials).some(Boolean);
  const hasExpenses = Object.values(expenseEssentials).some(Boolean);
  const hasOrders = Object.values(orderEssentials).some(Boolean);
  
  return hasSubscriptions || hasExpenses || hasOrders;
}

/**
 * Get a summary of what data would be migrated
 */
export function getMigrationSummary(): {
  subscriptions: number;
  expenses: number;
  orders: number;
  total: number;
} {
  const subscriptionEssentials = getEssentialStatus('needix-subscriptions-essential');
  const expenseEssentials = getEssentialStatus('needix-expenses-essential');
  const orderEssentials = getEssentialStatus('needix-orders-essential');
  
  const subscriptions = Object.values(subscriptionEssentials).filter(Boolean).length;
  const expenses = Object.values(expenseEssentials).filter(Boolean).length;
  const orders = Object.values(orderEssentials).filter(Boolean).length;
  
  return {
    subscriptions,
    expenses,
    orders,
    total: subscriptions + expenses + orders,
  };
}

/**
 * Manual migration trigger for console use
 * Usage: Run this in browser console after deploying database changes
 */
export async function runMigration(): Promise<{
  success: boolean;
  migrated: { subscriptions: number; expenses: number; orders: number };
  errors: string[];
}> {
  debug.log('🔄 Starting manual migration...');
  
  const summary = getMigrationSummary();
  if (summary.total === 0) {
    debug.log('ℹ️ No essential data found to migrate.');
    return {
      success: true,
      migrated: { subscriptions: 0, expenses: 0, orders: 0 },
      errors: [],
    };
  }
  
  debug.log('📊 Will migrate:', summary);
  
  const result = await migrateEssentialStatusToDatabase();
  
  if (result.success) {
    debug.log('✅ Migration completed successfully!');
    debug.log('📈 Migrated:', result.migrated);
  } else {
    console.error('❌ Migration failed with errors:');
    result.errors.forEach(error => console.error('  -', error));
  }
  
  return result;
}