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

export const useRecurringEvents = (
  subscriptions: Subscription[],
  orders: OrderItem[], // Using OrderItem instead of Order
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
            isEssential: true, // Default to true since Subscription doesn't have isEssential
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
          default: // 'custom' - treat as monthly
            currentDate = addMonths(currentDate, 1);
            break;
        }
      }
    });

    // Process orders (using OrderItem type)
    orders.forEach((order) => {
      let orderDate: Date | null = null;
      
      // Try to get date from scheduledDate or nextDate
      if (order.scheduledDate) {
        orderDate = new Date(order.scheduledDate);
      } else if (order.nextDate) {
        orderDate = new Date(order.nextDate);
      }
      
      if (!orderDate || !order.amount) return;

      if (order.type === 'future') {
        // One-time future order
        if (orderDate >= startDate && orderDate <= endDate) {
          events.push({
            id: `order-${order.id}`,
            title: order.title, // OrderItem uses 'title' instead of 'name'
            amount: order.amount,
            date: orderDate,
            type: 'order',
            category: order.category,
            originalId: order.id
          });
        }
      } else if (order.type === 'recurring') {
        // Recurring order
        let currentDate = new Date(orderDate);
        
        while (currentDate <= endDate) {
          if (currentDate >= startDate) {
            events.push({
              id: `${order.id}-${currentDate.toISOString()}`,
              title: order.title, // OrderItem uses 'title' instead of 'name'
              amount: order.amount,
              date: new Date(currentDate),
              type: 'order',
              category: order.category,
              originalId: order.id
            });
          }

          // Calculate next occurrence based on cadence
          if (order.cadence) {
            switch (order.cadence) {
              case 'weekly':
                currentDate = addDays(currentDate, 7);
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
              default:
                currentDate = addMonths(currentDate, 1);
                break;
            }
          } else {
            // Default to monthly if no cadence specified
            currentDate = addMonths(currentDate, 1);
          }
        }
      }
    });

    // Process expenses
    expenses.forEach((expense) => {
      let expenseDate: Date | null = null;
      
      // Try to get date from nextPaymentDate or dueDate
      if (expense.nextPaymentDate) {
        expenseDate = new Date(expense.nextPaymentDate);
      } else if (expense.dueDate) {
        expenseDate = new Date(expense.dueDate);
      }
      
      if (!expenseDate) return;
      
      if (expense.isRecurring) {
        let currentDate = new Date(expenseDate);
        
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