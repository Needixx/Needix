// components/CalendarClient.tsx
"use client";

import { useState, useMemo } from "react";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useOrders } from "@/lib/useOrders";
import { useExpenses } from "@/lib/useExpenses";
import { isMobileApp } from "@/lib/mobile-auth";
import { useEffect } from "react";

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
      const mobile = isMobileApp() || window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    if (filters.subscriptions) {
      subscriptions?.forEach(sub => {
        if (filters.essentialOnly && !sub.isEssential) return;
        
        const renewalDate = sub.nextBillingDate ? new Date(sub.nextBillingDate) : null;
        if (renewalDate && renewalDate >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)) {
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
        const orderDate = order.scheduledDate ? new Date(order.scheduledDate) : 
                         order.nextDate ? new Date(order.nextDate) : null;
        if (orderDate && orderDate >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)) {
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
        const expenseDate = expense.nextPaymentDate ? new Date(expense.nextPaymentDate) :
                           expense.dueDate ? new Date(expense.dueDate) : null;
        if (expenseDate && expenseDate >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)) {
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
    <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-6`}>
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Financial Calendar</h1>
              <p className="text-gray-300 text-sm md:text-base">
                <span className="text-green-400 font-semibold">${monthTotal.toFixed(0)}</span> total this month
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white hover:bg-slate-600/50 transition-all mobile-touch-target"
              >
                ←
              </button>
              <h2 className="text-lg md:text-xl font-semibold text-white min-w-[160px] text-center">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white hover:bg-slate-600/50 transition-all mobile-touch-target"
              >
                →
              </button>
            </div>
          </div>
          
          {/* Mobile-friendly Filters */}
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
              <span className="font-medium">Subs ({subscriptions?.length || 0})</span>
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
              <span className="font-medium">Orders ({orders?.length || 0})</span>
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
              <span className="font-medium">Expenses ({expenses?.length || 0})</span>
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
                } ${isToday ? 'ring-2 ring-orange-400' : ''} ${
                  hasEvents ? 'cursor-pointer hover:bg-slate-600/50' : ''
                }`}
              >
                <div className={`text-xs md:text-sm font-medium mb-1 md:mb-2 ${
                  day.isCurrentMonth ? 'text-white' : 'text-gray-500'
                }`}>
                  {day.date.getDate()}
                </div>
                
                {dayTotal > 0 && (
                  <div className="text-xs text-green-400 font-semibold mb-1 md:mb-2">
                    ${isMobile ? dayTotal.toFixed(0) : dayTotal.toFixed(0)}
                  </div>
                )}
                
                <div className="space-y-1">
                  {dayEvents.slice(0, isMobile ? 1 : 2).map((event, eventIndex) => (
                    <div
                      key={`${event.id}-${eventIndex}`}
                      className={`text-xs p-1 rounded truncate ${
                        event.type === 'subscription'
                          ? 'bg-blue-500/20 text-blue-300'
                          : event.type === 'order'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}
                    >
                      {isMobile ? event.title.substring(0, 6) + (event.title.length > 6 ? '...' : '') : event.title}
                    </div>
                  ))}
                  {dayEvents.length > (isMobile ? 1 : 2) && (
                    <div className="text-xs text-gray-400 font-medium">
                      +{dayEvents.length - (isMobile ? 1 : 2)} more
                    </div>
                  )}
                </div>
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