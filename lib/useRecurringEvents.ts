// lib/useRecurringEvents.ts
import { useMemo } from 'react';

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

// Basic types to avoid import conflicts
interface BasicSubscription {
  id: string;
  name: string;
  price: number;
  nextBillingDate?: string;
  period?: string;
  category?: string;
  isEssential?: boolean;
}

interface BasicOrder {
  id: string;
  name: string;
  amount?: number;
  type?: string;
  scheduledDate?: string;
  nextDate?: string;
  category?: string;
  status?: string;
  isEssential?: boolean;
}

interface BasicExpense {
  id: string;
  name: string;
  amount: number;
  nextPaymentDate?: string;
  dueDate?: string;
  frequency?: string;
  isRecurring?: boolean;
  category?: string;
  isEssential?: boolean;
}

// Helper function to parse date strings as local dates (avoiding timezone shifts)
function parseLocalDate(dateString: string): Date {
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  const year = parseInt(parts[0]!, 10);
  const month = parseInt(parts[1]!, 10) - 1; // Month is 0-indexed
  const day = parseInt(parts[2]!, 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  
  return new Date(year, month, day);
}

export const useRecurringEvents = (
  subscriptions: BasicSubscription[],
  orders: BasicOrder[],
  expenses: BasicExpense[],
  startDate: Date,
  endDate: Date
): CalendarEvent[] => {
  return useMemo(() => {
    const events: CalendarEvent[] = [];

    // Smart helper function to add months to a date with proper end-of-month handling
    const addMonthsSmart = (date: Date, months: number): Date => {
      const originalDay = date.getDate();
      const originalMonth = date.getMonth();
      const originalYear = date.getFullYear();
      
      // Calculate target month and year
      let targetMonth = originalMonth + months;
      let targetYear = originalYear;
      
      // Handle year overflow/underflow
      while (targetMonth >= 12) {
        targetMonth -= 12;
        targetYear += 1;
      }
      while (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }
      
      // Get the last day of the target month
      const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      
      // If the original day was the last day of its month, or if the target month 
      // doesn't have enough days, use the last day of the target month
      const lastDayOfOriginalMonth = new Date(originalYear, originalMonth + 1, 0).getDate();
      const isLastDayOfMonth = originalDay === lastDayOfOriginalMonth;
      
      let targetDay: number;
      
      if (isLastDayOfMonth || originalDay > lastDayOfTargetMonth) {
        // Use the last day of the target month
        targetDay = lastDayOfTargetMonth;
      } else {
        // Use the original day
        targetDay = originalDay;
      }
      
      return new Date(targetYear, targetMonth, targetDay);
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
      
      const nextBilling = parseLocalDate(subscription.nextBillingDate);
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
            isEssential: subscription.isEssential ?? false,
            originalId: subscription.id
          });
        }

        // Calculate next occurrence based on billing period
        switch (subscription.period) {
          case 'weekly':
            currentDate = addDays(currentDate, 7);
            break;
          case 'monthly':
            currentDate = addMonthsSmart(currentDate, 1);
            break;
          case 'yearly':
            currentDate = addMonthsSmart(currentDate, 12);
            break;
          default:
            // For custom or unknown periods, add 1 month as fallback
            currentDate = addMonthsSmart(currentDate, 1);
            break;
        }
      }
    });

    // Process orders
    orders.forEach((order) => {
      const orderDate = order.scheduledDate 
        ? parseLocalDate(order.scheduledDate)
        : order.nextDate 
        ? parseLocalDate(order.nextDate)
        : new Date();
      
      if (order.type === 'recurring' && order.nextDate) {
        let currentDate = parseLocalDate(order.nextDate);
        
        while (currentDate <= endDate) {
          if (currentDate >= startDate) {
            events.push({
              id: `${order.id}-${currentDate.toISOString()}`,
              title: order.name,
              amount: order.amount || 0,
              date: new Date(currentDate),
              type: 'order',
              category: order.category,
              isEssential: order.isEssential ?? false,
              originalId: order.id
            });
          }

          // For recurring orders, assume monthly recurrence with smart month handling
          currentDate = addMonthsSmart(currentDate, 1);
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
          isEssential: order.isEssential ?? false,
          originalId: order.id
        });
      }
    });

    // Process expenses
    expenses.forEach((expense) => {
      const expenseDate = expense.dueDate 
        ? parseLocalDate(expense.dueDate)
        : expense.nextPaymentDate 
        ? parseLocalDate(expense.nextPaymentDate)
        : new Date();
      
      if (expense.isRecurring && expense.nextPaymentDate) {
        let currentDate = parseLocalDate(expense.nextPaymentDate);
        
        while (currentDate <= endDate) {
          if (currentDate >= startDate) {
            events.push({
              id: `${expense.id}-${currentDate.toISOString()}`,
              title: expense.name,
              amount: expense.amount,
              date: new Date(currentDate),
              type: 'expense',
              category: expense.category,
              isEssential: expense.isEssential ?? false,
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
              currentDate = addMonthsSmart(currentDate, 1);
              break;
            case 'quarterly':
              currentDate = addMonthsSmart(currentDate, 3);
              break;
            case 'yearly':
              currentDate = addMonthsSmart(currentDate, 12);
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
          isEssential: expense.isEssential ?? false,
          originalId: expense.id
        });
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [subscriptions, orders, expenses, startDate, endDate]);
};