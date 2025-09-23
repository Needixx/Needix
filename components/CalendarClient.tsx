// components/CalendarClient.tsx
"use client";

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, DollarSign } from 'lucide-react';
import { useSubscriptions } from '@/lib/useSubscriptions';
import { useOrders } from '@/lib/useOrders';
import { useExpenses } from '@/lib/useExpenses';
import { useRecurringEvents, CalendarEvent } from '@/lib/useRecurringEvents';

interface DayDetailModalProps {
  date: Date;
  events: CalendarEvent[];
  onClose: () => void;
}

function DayDetailModal({ date, events, onClose }: DayDetailModalProps) {
  const dayTotal = events.reduce((sum, event) => sum + event.amount, 0);
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">{formattedDate}</h3>
            <p className="text-gray-400 text-sm">{events.length} events • ${dayTotal.toFixed(2)} total</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors rounded-lg p-2 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-3">
          {events.map((event, index) => (
            <div
              key={`${event.id}-${index}`}
              className={`p-4 rounded-xl border transition-colors ${
                event.type === 'subscription'
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : event.type === 'order'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-purple-500/10 border-purple-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">{event.title}</h4>
                <div className="flex items-center gap-1 text-green-400 font-bold">
                  <DollarSign className="h-4 w-4" />
                  {event.amount.toFixed(2)}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  event.type === 'subscription'
                    ? 'bg-blue-500/20 text-blue-300'
                    : event.type === 'order'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {event.type === 'subscription' ? 'Subscription' : 
                   event.type === 'order' ? 'Order' : 'Expense'}
                </span>
                
                {event.category && (
                  <span className="text-gray-400">{event.category}</span>
                )}
                
                {event.isEssential && (
                  <span className="text-red-400 text-xs">Essential</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-slate-700/50 rounded-xl border border-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 font-medium">Day Total:</span>
            <span className="text-green-400 font-bold text-lg">${dayTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarClient() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filters, setFilters] = useState({
    subscriptions: true,
    orders: true,
    expenses: true,
    essentialOnly: false,
  });

  // Get data from hooks
  const { items: subscriptions } = useSubscriptions();
  const { items: orders } = useOrders();
  const { items: expenses } = useExpenses();

  // Calculate date range for current month + 2 months ahead
  const startDate = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return start;
  }, [currentDate]);

  const endDate = useMemo(() => {
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0);
    return end;
  }, [currentDate]);

  // Get recurring events using actual data types
  const allEvents = useRecurringEvents(subscriptions || [], orders || [], expenses || [], startDate, endDate);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    // Handle case where allEvents might be undefined or not an array
    if (!allEvents || !Array.isArray(allEvents)) {
      return [];
    }
    
    return allEvents.filter(event => {
      // Type filters
      if (!filters.subscriptions && event.type === 'subscription') return false;
      if (!filters.orders && event.type === 'order') return false;
      if (!filters.expenses && event.type === 'expense') return false;
      
      // Essential filter
      if (filters.essentialOnly && event.isEssential === false) return false;
      
      return true;
    });
  }, [allEvents, filters]);

  // Get events for current month display
  const monthEvents = useMemo(() => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    return filteredEvents.filter(event => 
      event.date >= monthStart && event.date <= monthEnd
    );
  }, [filteredEvents, currentDate]);

  // Calculate month totals
  const monthTotal = useMemo(() => {
    return monthEvents.reduce((total, event) => total + event.amount, 0);
  }, [monthEvents]);

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar days
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

  // Helper functions
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Financial Calendar</h1>
              <p className="text-gray-300">
                <span className="text-green-400 font-semibold">${monthTotal.toFixed(2)} total</span>
                <span className="text-gray-400 ml-2">• {monthEvents.length} events</span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10 border border-slate-600 hover:border-slate-500"
              >
                Today
              </button>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-white min-w-[240px] text-center">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            
            <button
              onClick={goToNextMonth}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Filter Toggles */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setFilters(prev => ({ ...prev, subscriptions: !prev.subscriptions }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                filters.subscriptions
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                  : 'bg-slate-700/50 border-slate-600 text-gray-400 hover:border-slate-500'
              }`}
            >
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span className="text-sm font-medium">Subscriptions ({subscriptions?.length || 0})</span>
            </button>
            
            <button
              onClick={() => setFilters(prev => ({ ...prev, orders: !prev.orders }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                filters.orders
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                  : 'bg-slate-700/50 border-slate-600 text-gray-400 hover:border-slate-500'
              }`}
            >
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-sm font-medium">Orders ({orders?.length || 0})</span>
            </button>
            
            <button
              onClick={() => setFilters(prev => ({ ...prev, expenses: !prev.expenses }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                filters.expenses
                  ? 'bg-green-500/20 border-green-500 text-green-300'
                  : 'bg-slate-700/50 border-slate-600 text-gray-400 hover:border-slate-500'
              }`}
            >
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-sm font-medium">Expenses ({expenses?.length || 0})</span>
            </button>
            
            <button
              onClick={() => setFilters(prev => ({ ...prev, essentialOnly: !prev.essentialOnly }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                filters.essentialOnly
                  ? 'bg-red-500/20 border-red-500 text-red-300'
                  : 'bg-slate-700/50 border-slate-600 text-gray-400 hover:border-slate-500'
              }`}
            >
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-sm font-medium">Essential Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-gray-400 font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-4">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDate(day.date);
            const dayTotal = getTotalForDate(day.date);
            const isToday = day.date.toDateString() === new Date().toDateString();
            const hasEvents = dayEvents.length > 0;

            return (
              <div
                key={index}
                onClick={() => handleDayClick(day.date, dayEvents)}
                className={`min-h-[120px] p-2 rounded-lg border transition-all ${
                  day.isCurrentMonth
                    ? 'bg-slate-700/50 border-slate-600'
                    : 'bg-slate-800/30 border-slate-700'
                } ${isToday ? 'ring-2 ring-orange-400' : ''} ${
                  hasEvents ? 'cursor-pointer hover:bg-slate-600/50' : ''
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  day.isCurrentMonth ? 'text-white' : 'text-gray-500'
                }`}>
                  {day.date.getDate()}
                </div>
                
                {dayTotal > 0 && (
                  <div className="text-xs text-green-400 font-semibold mb-2">
                    ${dayTotal.toFixed(0)}
                  </div>
                )}
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event, eventIndex) => (
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
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-400 font-medium">
                      +{dayEvents.length - 2} more
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