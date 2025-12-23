"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  attendanceApi,
  type DailyStateResponse,
} from "../../api/attendance-api";
import { useAuth } from "../../contexts/AuthContext";

interface CheckInModalProps {
  visible: boolean;
  onClose: () => void;
}

interface DateInfo {
  date: Date;
  day: number;
  isToday: boolean;
  isCheckedIn: boolean;
}

export default function CheckInModal({ visible, onClose }: CheckInModalProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [checkedInDates, setCheckedInDates] = useState<Set<string>>(new Set());
  const [showReward, setShowReward] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current date info
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Format date as YYYY-MM-DD
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Generate calendar dates for current month
  const generateCalendarDates = (): DateInfo[] => {
    const dates: DateInfo[] = [];
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Add dates for current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateKey = formatDateKey(date);
      dates.push({
        date,
        day,
        isToday: isSameDay(date, today),
        isCheckedIn: checkedInDates.has(dateKey),
      });
    }

    return dates;
  };

  const handleDateClick = async (dateInfo: DateInfo) => {
    // Only allow checking in for today
    if (!dateInfo.isToday) return;

    const dateKey = formatDateKey(dateInfo.date);

    // If already checked in, don't do anything
    if (checkedInDates.has(dateKey)) return;

    if (!isAuthenticated) {
      setError("Vui lòng đăng nhập để điểm danh");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call API to check in
      const checkInResponse = await attendanceApi.checkIn();

      // Map CheckInResponse to DailyStateResponse and save to React Query cache
      const dailyState: DailyStateResponse = {
        limits: checkInResponse.limits,
        used: checkInResponse.used,
        assigned: checkInResponse.assigned,
        checkedInAt: checkInResponse.checkedInAt,
      };

      // Save to React Query cache so lesson components can use it immediately
      queryClient.setQueryData(["daily-state"], dailyState);

      // Update checked in dates
      setCheckedInDates((prev) => new Set(prev).add(dateKey));
      setSelectedDate(dateInfo.date);
      setShowReward(true);

      // Hide reward after animation
      setTimeout(() => {
        setShowReward(false);
      }, 3000);
    } catch (err) {
      setError((err as Error).message || "Có lỗi xảy ra khi điểm danh");
      console.error("Check-in error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const calendarDates = generateCalendarDates();

  // Format month and year for display
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  // Get day of week for first day of month
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Load check-in status when modal opens
  useEffect(() => {
    if (visible && isAuthenticated) {
      setShowReward(false);
      setSelectedDate(null);
      setError(null);

      // Load attendance history for current month
      const loadHistory = async () => {
        try {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, "0");
          const monthKey = `${year}-${month}`;

          const history = await attendanceApi.getHistory(monthKey);
          const checkedDates = new Set(history.map((item) => item.dateKey));
          setCheckedInDates(checkedDates);
        } catch (err) {
          console.error("Failed to load attendance history:", err);
        }
      };

      loadHistory();
    }
  }, [visible, isAuthenticated]);

  // Handle ESC key
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                📅 Điểm danh hàng ngày
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {monthNames[currentMonth]} {currentYear}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="p-6">
          {/* Day names header */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {dayNames.map((dayName, index) => (
              <div
                key={index}
                className="text-center text-sm font-semibold text-gray-600 py-2"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Calendar dates */}
            {calendarDates.map((dateInfo, index) => {
              const isClickable = dateInfo.isToday && !dateInfo.isCheckedIn;
              const isCheckedIn = dateInfo.isCheckedIn;

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(dateInfo)}
                  disabled={!isClickable || isLoading}
                  className={`
                    aspect-square rounded-lg transition-all duration-200
                    flex flex-col items-center justify-center relative
                    ${
                      isCheckedIn
                        ? "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg scale-105"
                        : dateInfo.isToday
                        ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md hover:shadow-lg hover:scale-105 cursor-pointer ring-2 ring-blue-300"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-not-allowed opacity-60"
                    }
                    ${isLoading ? "opacity-50 cursor-wait" : ""}
                  `}
                >
                  {/* Day number */}
                  <span
                    className={`text-lg font-bold ${
                      isCheckedIn || dateInfo.isToday
                        ? "text-white"
                        : "text-gray-600"
                    }`}
                  >
                    {dateInfo.day}
                  </span>

                  {/* Check icon for checked in dates */}
                  {isCheckedIn && (
                    <CheckCircle2
                      size={16}
                      className="absolute top-1 right-1 text-white"
                    />
                  )}

                  {/* Today indicator */}
                  {dateInfo.isToday && !isCheckedIn && (
                    <span className="text-xs font-medium mt-0.5">Hôm nay</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700 text-center">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Đang điểm danh...
                </span>
              ) : checkedInDates.has(formatDateKey(today)) ? (
                <span className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                  <CheckCircle2 size={18} />
                  Bạn đã điểm danh hôm nay! Tuyệt vời! 🎉
                </span>
              ) : (
                <span>
                  Nhấn vào ngày{" "}
                  <strong className="text-blue-600">hôm nay</strong> để điểm
                  danh và nhận phần thưởng!
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Reward Animation */}
      {showReward && selectedDate && (
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl max-w-sm mx-4 animate-scale-in">
            <div className="text-center">
              {/* Sparkles animation */}
              <div className="relative mb-6">
                <div className="text-6xl animate-bounce">🎉</div>
                <Sparkles
                  size={48}
                  className="absolute -top-2 -right-2 text-yellow-400 animate-pulse"
                />
                <Sparkles
                  size={32}
                  className="absolute -bottom-2 -left-2 text-pink-400 animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                />
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Điểm danh thành công!
              </h3>
              <p className="text-gray-600 mb-4">
                Bạn đã nhận được phần thưởng hôm nay
              </p>

              {/* Reward display */}
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg p-4 mb-4">
                <div className="text-3xl mb-2">⭐</div>
                <p className="text-white font-semibold">+10 Điểm kinh nghiệm</p>
                <p className="text-white/90 text-sm">+5 Xu</p>
              </div>

              <p className="text-sm text-gray-500">
                Tiếp tục điểm danh để nhận thêm phần thưởng!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
