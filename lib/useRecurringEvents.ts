// lib/useRecurringEvents.ts
import { useMemo } from 'react';
import type { Subscription, Expense } from '@/lib/types';
import type { OrderItem } from '@/lib/types-orders';

export interface CalendarEvent {
  id: string;
  title: string;
  amount: number;
  date: Date;
  type: 'subscription' | 'order' | 'expense';
  category?: string;
  isEssential?: boolean;
  originalId: string;
}

// Extended types with isEssential property
interface SubscriptionWithEssential extends Subscription {
  isEssential?: boolean;
}

interface OrderWithEssential extends OrderItem {
  isEssential?: boolean;
}

export const useRecurringEvents = (
  subscriptions: Subscription[],
  orders: OrderItem[],
  expenses: Expense[],
  startDate: Date,
  endDate: Date
): CalendarEvent[] => {
  return useMemo(() => {
    const events: CalendarEvent[] = [];

    // Helper function to add months to a date
    const addMonths = (date: Date, months: number): Date => {
      const newDate = new Date(date);
      newDate.setMonth(newDate.getMonth() + months);
      return newDate;
    };

    // Helper function to add days to a date
    const addDays = (date: Date, days: number): Date => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    };

    // Process subscriptions
    subscriptions.forEach((subscription) => {
      if (!subscription.nextBillingDate) return;
      
      const subscriptionWithEssential = subscription as SubscriptionWithEssential;
      const nextBilling = new Date(subscription.nextBillingDate);
      let currentDate = new Date(nextBilling);

      while (currentDate <= endDate) {
        if (currentDate >= startDate) {
          events.push({
            id: `${subscription.id}-${currentDate.toISOString()}`,
            title: subscription.name,
            amount: subscription.price,
            date: new Date(currentDate),
            type: 'subscription',
            category: subscription.category,
            isEssential: subscriptionWithEssential.isEssential ?? false, // Default to false
            originalId: subscription.id
          });
        }

        // Calculate next occurrence based on billing period
        switch (subscription.period) {
          case 'weekly':
            currentDate = addDays(currentDate, 7);
            break;
          case 'monthly':
            currentDate = addMonths(currentDate, 1);
            break;
          case 'yearly':
            currentDate = addMonths(currentDate, 12);
            break;
          default:
            // For custom or unknown periods, add 1 month as fallback
            currentDate = addMonths(currentDate, 1);
            break;
        }
      }
    });

    // Process orders
    orders.forEach((order) => {
      const orderWithEssential = order as OrderWithEssential;
      const orderDate = new Date(order.scheduledDate || order.nextDate || new Date());
      
      if (order.type === 'recurring' && order.nextDate) {
        let currentDate = new Date(order.nextDate);
        
        while (currentDate <= endDate) {
          if (currentDate >= startDate) {
            events.push({
              id: `${order.id}-${currentDate.toISOString()}`,
              title: order.name,
              amount: order.amount || 0,
              date: new Date(currentDate),
              type: 'order',
              category: order.category,
              isEssential: orderWithEssential.isEssential ?? false, // Default to false
              originalId: order.id
            });
          }

          // For recurring orders, assume monthly recurrence if no specific interval is defined
          currentDate = addMonths(currentDate, 1);
        }
      } else if (orderDate >= startDate && orderDate <= endDate) {
        // One-time order
        events.push({
          id: `order-${order.id}`,
          title: order.name,
          amount: order.amount || 0,
          date: orderDate,
          type: 'order',
          category: order.category,
          isEssential: orderWithEssential.isEssential ?? false, // Default to false
          originalId: order.id
        });
      }
    });

    // Process expenses
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.dueDate || expense.nextPaymentDate || new Date());
      
      if (expense.isRecurring && expense.nextPaymentDate) {
        let currentDate = new Date(expense.nextPaymentDate);
        
        while (currentDate <= endDate) {
          if (currentDate >= startDate) {
            events.push({
              id: `${expense.id}-${currentDate.toISOString()}`,
              title: expense.name,
              amount: expense.amount,
              date: new Date(currentDate),
              type: 'expense',
              category: expense.category,
              isEssential: expense.isEssential,
              originalId: expense.id
            });
          }

          // Calculate next occurrence based on frequency
          switch (expense.frequency) {
            case 'weekly':
              currentDate = addDays(currentDate, 7);
              break;
            case 'bi-weekly':
              currentDate = addDays(currentDate, 14);
              break;
            case 'monthly':
              currentDate = addMonths(currentDate, 1);
              break;
            case 'quarterly':
              currentDate = addMonths(currentDate, 3);
              break;
            case 'yearly':
              currentDate = addMonths(currentDate, 12);
              break;
            default: // 'one-time'
              break;
          }
          
          // Break if it's one-time frequency
          if (expense.frequency === 'one-time') break;
        }
      } else if (expenseDate >= startDate && expenseDate <= endDate) {
        // One-time expense
        events.push({
          id: `expense-${expense.id}`,
          title: expense.name,
          amount: expense.amount,
          date: expenseDate,
          type: 'expense',
          category: expense.category,
          isEssential: expense.isEssential,
          originalId: expense.id
        });
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [subscriptions, orders, expenses, startDate, endDate]);
};