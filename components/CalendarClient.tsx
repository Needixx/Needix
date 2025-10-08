// components/CalendarClient.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useOrders } from "@/lib/useOrders";
import { useExpenses } from "@/lib/useExpenses";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  amount: number;
  type: "subscription" | "order" | "expense";
  essential?: boolean;
}

interface DayDetailModalProps {
  date: Date;
  events: CalendarEvent[];
  onClose: () => void;
}

// Helper function to parse date strings in local timezone
function parseLocalDate(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;
  
  // If it's just a date string (YYYY-MM-DD), parse it as local time
  if (dateString.includes('T')) {
    return new Date(dateString);
  }
  
  // Parse as local date to avoid timezone shift
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function DayDetailModal({ date, events, onClose }: DayDetailModalProps) {
  const total = events.reduce((sum, event) => sum + event.amount, 0);
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
        
        {total > 0 && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="text-green-400 font-semibold">
              Total: ${total.toFixed(2)}
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {events.map((event, index) => (
            <div
              key={`${event.id}-${index}`}
              className={`p-3 rounded-lg ${
                event.type === 'subscription'
                  ? 'bg-blue-500/10 border border-blue-500/20'
                  : event.type === 'order'
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-purple-500/10 border border-purple-500/20'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className={`font-medium ${
                    event.type === 'subscription' ? 'text-blue-300' :
                    event.type === 'order' ? 'text-green-300' : 'text-purple-300'
                  }`}>
                    {event.title}
                  </div>
                  <div className="text-sm text-gray-400 capitalize">
                    {event.type}
                    {event.essential && ' • Essential'}
                  </div>
                </div>
                <div className="text-white font-semibold">
                  ${event.amount.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarClient() {
  const { items: subscriptions } = useSubscriptions();
  const { items: orders } = useOrders();
  const { items: expenses } = useExpenses();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState({
    subscriptions: true,
    orders: true,
    expenses: true,
    essentialOnly: false,
  });

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    
    // Get the start and end of the current month being viewed
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    if (filters.subscriptions) {
      subscriptions?.forEach(sub => {
        if (filters.essentialOnly && !sub.isEssential) return;
        
        const renewalDate = parseLocalDate(sub.nextBillingDate);
        
        if (renewalDate && renewalDate >= monthStart && renewalDate <= monthEnd) {
          events.push({
            id: `sub-${sub.id}`,
            title: sub.name,
            date: renewalDate,
            amount: typeof sub.price === 'number' ? sub.price : 0,
            type: 'subscription',
            essential: sub.isEssential,
          });
        }
      });
    }

    if (filters.orders) {
      orders?.forEach(order => {
        const orderDate = parseLocalDate(order.scheduledDate) || parseLocalDate(order.nextDate);
        
        if (orderDate && orderDate >= monthStart && orderDate <= monthEnd) {
          events.push({
            id: `order-${order.id}`,
            title: order.name,
            date: orderDate,
            amount: order.amount || 0,
            type: 'order',
          });
        }
      });
    }

    if (filters.expenses) {
      expenses?.forEach(expense => {
        const expenseDate = parseLocalDate(expense.nextPaymentDate) || parseLocalDate(expense.dueDate);
        
        if (expenseDate && expenseDate >= monthStart && expenseDate <= monthEnd) {
          events.push({
            id: `expense-${expense.id}`,
            title: expense.name,
            date: expenseDate,
            amount: expense.amount || 0,
            type: 'expense',
          });
        }
      });
    }

    return events;
  }, [subscriptions, orders, expenses, filters, currentDate]);

  // Calculate current/active counts for filter buttons (only today and future)
  const currentCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeSubscriptions = subscriptions?.filter(sub => {
      const date = parseLocalDate(sub.nextBillingDate);
      return date && date >= today;
    }).length || 0;
    
    const activeOrders = orders?.filter(order => {
      const date = parseLocalDate(order.scheduledDate) || parseLocalDate(order.nextDate);
      return date && date >= today;
    }).length || 0;
    
    const activeExpenses = expenses?.filter(expense => {
      const date = parseLocalDate(expense.nextPaymentDate) || parseLocalDate(expense.dueDate);
      return date && date >= today;
    }).length || 0;
    
    return {
      subscriptions: activeSubscriptions,
      orders: activeOrders,
      expenses: activeExpenses,
    };
  }, [subscriptions, orders, expenses]);

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const days = [];
    
    // Add previous month's days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Add current month's days
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  const calendarDays = getCalendarDays();

  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter(event => {
      return event.date.toDateString() === date.toDateString();
    });
  };

  const getTotalForDate = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    return dayEvents.reduce((total, event) => total + event.amount, 0);
  };

  const handleDayClick = (date: Date, dayEvents: CalendarEvent[]) => {
    if (dayEvents.length > 0) {
      setSelectedDate(date);
    }
  };

  const navigateMonth = (direction: 1 | -1) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const monthTotal = calendarEvents
    .filter(event => event.date.getMonth() === currentDate.getMonth())
    .reduce((total, event) => total + event.amount, 0);

  return (
    <div className={`${isMobile ? 'p-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10'} space-y-6`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-white`}>Financial Calendar</h1>
          <p className="text-gray-400 text-sm mt-1">
            Track upcoming subscriptions, orders, and expenses
          </p>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2">
          <div className="text-sm text-gray-400">Month Total</div>
          <div className="text-2xl font-bold text-white">${monthTotal.toFixed(2)}</div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors mobile-touch-target"
        >
          <span className="text-white text-xl">←</span>
        </button>
        
        <h2 className="text-xl font-semibold text-white">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors mobile-touch-target"
        >
          <span className="text-white text-xl">→</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilters(prev => ({ ...prev, subscriptions: !prev.subscriptions }))}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm mobile-touch-target ${
              filters.subscriptions
                ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                : 'bg-slate-700/50 border-slate-600 text-gray-400 hover:border-slate-500'
            }`}
          >
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="font-medium">Subscriptions ({currentCounts.subscriptions})</span>
          </button>
          
          <button
            onClick={() => setFilters(prev => ({ ...prev, orders: !prev.orders }))}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm mobile-touch-target ${
              filters.orders
                ? 'bg-green-500/20 border-green-500 text-green-300'
                : 'bg-slate-700/50 border-slate-600 text-gray-400 hover:border-slate-500'
            }`}
          >
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="font-medium">Orders ({currentCounts.orders})</span>
          </button>
          
          <button
            onClick={() => setFilters(prev => ({ ...prev, expenses: !prev.expenses }))}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm mobile-touch-target ${
              filters.expenses
                ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                : 'bg-slate-700/50 border-slate-600 text-gray-400 hover:border-slate-500'
            }`}
          >
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span className="font-medium">Expenses ({currentCounts.expenses})</span>
          </button>
          
          <button
            onClick={() => setFilters(prev => ({ ...prev, essentialOnly: !prev.essentialOnly }))}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm mobile-touch-target ${
              filters.essentialOnly
                ? 'bg-red-500/20 border-red-500 text-red-300'
                : 'bg-slate-700/50 border-slate-600 text-gray-400 hover:border-slate-500'
            }`}
          >
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="font-medium">Essential</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-3 md:p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 md:gap-4 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-gray-400 font-medium py-2 text-xs md:text-sm">
              {isMobile ? day.charAt(0) : day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 md:gap-4">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDate(day.date);
            const dayTotal = getTotalForDate(day.date);
            const isToday = day.date.toDateString() === new Date().toDateString();
            const hasEvents = dayEvents.length > 0;

            return (
              <div
                key={index}
                onClick={() => handleDayClick(day.date, dayEvents)}
                className={`${isMobile ? 'min-h-[80px]' : 'min-h-[120px]'} p-1 md:p-2 rounded-lg border transition-all ${
                  day.isCurrentMonth
                    ? 'bg-slate-700/50 border-slate-600'
                    : 'bg-slate-800/30 border-slate-700'
                } ${isToday ? 'ring-2 ring-blue-500' : ''} ${
                  hasEvents ? 'cursor-pointer hover:bg-slate-600/50' : ''
                }`}
              >
                <div className={`text-xs md:text-sm font-medium mb-1 ${
                  day.isCurrentMonth ? 'text-white' : 'text-gray-500'
                } ${isToday ? 'text-blue-400' : ''}`}>
                  {day.date.getDate()}
                </div>
                
                {hasEvents && (
                  <div className="space-y-1">
                    {dayEvents.slice(0, isMobile ? 2 : 3).map((event, i) => (
                      <div
                        key={i}
                        className={`text-xs p-1 rounded ${
                          event.type === 'subscription'
                            ? 'bg-blue-500/20 text-blue-300'
                            : event.type === 'order'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        <div className="truncate">{event.title}</div>
                        {!isMobile && <div className="font-semibold">${event.amount.toFixed(2)}</div>}
                      </div>
                    ))}
                    {dayEvents.length > (isMobile ? 2 : 3) && (
                      <div className="text-xs text-gray-400 text-center">
                        +{dayEvents.length - (isMobile ? 2 : 3)} more
                      </div>
                    )}
                    {dayTotal > 0 && !isMobile && (
                      <div className="text-xs font-bold text-white mt-1 pt-1 border-t border-gray-600">
                        ${dayTotal.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          events={getEventsForDate(selectedDate)}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}