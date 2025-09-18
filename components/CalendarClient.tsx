// components/CalendarClient.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { useSubscriptions } from '@/lib/useSubscriptions';
import { useOrders } from '@/lib/useOrders';
import { useExpenses } from '@/lib/useExpenses';
import { useRecurringEvents, CalendarEvent } from '@/lib/useRecurringEvents';

interface FilterState {
  subscriptions: boolean;
  orders: boolean;
  expenses: boolean;
  essentialOnly: boolean;
}

const CalendarClient: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    subscriptions: true,
    orders: true,
    expenses: true,
    essentialOnly: false
  });

  // Get data from your actual hooks
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
  const allEvents = useRecurringEvents(subscriptions, orders, expenses, startDate, endDate);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      // Type filters
      if (!filters.subscriptions && event.type === 'subscription') return false;
      if (!filters.orders && event.type === 'order') return false;
      if (!filters.expenses && event.type === 'expense') return false;
      
      // Essential only filter
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

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return monthEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  // Get total amount for a specific date
  const getTotalForDate = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    return dayEvents.reduce((total, event) => total + event.amount, 0);
  };

  const calendarDays = getCalendarDays();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <CalendarIcon className="h-8 w-8 text-orange-400" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Financial Calendar
              </h1>
            </div>
            <div className="text-right">
              <p className="text-gray-300 text-sm">Monthly Total</p>
              <p className="text-2xl font-bold text-green-400">${monthTotal.toFixed(2)}</p>
              <p className="text-xs text-gray-400">{monthEvents.length} events this month</p>
            </div>
          </div>

          {/* Navigation and Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Month Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-orange-400 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-300" />
              </button>
              
              <h2 className="text-xl font-semibold text-white min-w-[200px] text-center">
                {monthName}
              </h2>
              
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-orange-400 transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </button>
              
              <button
                onClick={goToToday}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
              >
                Today
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.subscriptions}
                    onChange={(e) => setFilters(prev => ({ ...prev, subscriptions: e.target.checked }))}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-gray-300">Subscriptions ({subscriptions.length})</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.orders}
                    onChange={(e) => setFilters(prev => ({ ...prev, orders: e.target.checked }))}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-gray-300">Orders ({orders.length})</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.expenses}
                    onChange={(e) => setFilters(prev => ({ ...prev, expenses: e.target.checked }))}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-gray-300">Expenses ({expenses.length})</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.essentialOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, essentialOnly: e.target.checked }))}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-gray-300">Essential Only</span>
                </label>
              </div>
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

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 rounded-lg border transition-colors ${
                    day.isCurrentMonth
                      ? 'bg-slate-700/50 border-slate-600'
                      : 'bg-slate-800/30 border-slate-700'
                  } ${isToday ? 'ring-2 ring-orange-400' : ''}`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    day.isCurrentMonth ? 'text-white' : 'text-gray-500'
                  }`}>
                    {day.date.getDate()}
                  </div>

                  {dayTotal > 0 && (
                    <div className="text-xs text-green-400 font-medium mb-1">
                      ${dayTotal.toFixed(0)}
                    </div>
                  )}

                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`w-full text-left text-xs p-1 rounded truncate transition-colors ${
                          event.type === 'subscription'
                            ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                            : event.type === 'order'
                            ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                            : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                        }`}
                      >
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-400">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{selectedEvent.title}</h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Amount:</span>
                  <span className="text-green-400 font-bold">${selectedEvent.amount.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Type:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedEvent.type === 'subscription'
                      ? 'bg-blue-500/20 text-blue-300'
                      : selectedEvent.type === 'order'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {selectedEvent.type}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Date:</span>
                  <span className="text-white">{selectedEvent.date.toLocaleDateString()}</span>
                </div>
                
                {selectedEvent.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Category:</span>
                    <span className="text-white">{selectedEvent.category}</span>
                  </div>
                )}
                
                {selectedEvent.isEssential !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Essential:</span>
                    <span className={selectedEvent.isEssential ? 'text-orange-400' : 'text-gray-400'}>
                      {selectedEvent.isEssential ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarClient;