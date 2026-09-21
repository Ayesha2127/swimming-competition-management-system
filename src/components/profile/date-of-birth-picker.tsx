"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, Search, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateOfBirthPickerProps {
  value: string;
  onChange: (date: string) => void;
  maxDate?: string;
  className?: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function parseInitialValue(value: string): { year: number | null; month: number | null; day: number | null } {
  if (!value) return { year: null, month: null, day: null };
  const parts = value.split("-");
  if (parts.length === 3) {
    return {
      year: parseInt(parts[0], 10) || null,
      month: parseInt(parts[1], 10) - 1 || null,
      day: parseInt(parts[2], 10) || null,
    };
  }
  return { year: null, month: null, day: null };
}

export function DateOfBirthPicker({ value, onChange, maxDate, className }: DateOfBirthPickerProps) {
  const initial = parseInitialValue(value);
  const [selectedYear, setSelectedYear] = useState<number | null>(initial.year);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(initial.month);
  const [selectedDay, setSelectedDay] = useState<number | null>(initial.day);
  const [yearSearch, setYearSearch] = useState("");
  const [view, setView] = useState<"year" | "month" | "day">(
    initial.year ? (initial.month !== null ? "day" : "month") : "year"
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  const minYear = 1940;

  const maxDateObj = maxDate ? new Date(maxDate) : new Date();
  const maxYear = maxDateObj.getFullYear();
  const maxMonth = maxDateObj.getMonth();
  const maxDay = maxDateObj.getDate();

  const years = useMemo(() => {
    const result = [];
    for (let y = maxYear; y >= minYear; y--) {
      result.push(y);
    }
    return result;
  }, [maxYear]);

  const filteredYears = useMemo(() => {
    if (!yearSearch) return years;
    const search = parseInt(yearSearch, 10);
    if (!isNaN(search)) {
      return years.filter((y) => y.toString().includes(yearSearch));
    }
    return years;
  }, [years, yearSearch]);

  useEffect(() => {
    if (view === "year" && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [view]);

  function selectYear(year: number) {
    setSelectedYear(year);
    setSelectedMonth(null);
    setSelectedDay(null);
    setView("month");
    setYearSearch("");
  }

  function selectMonth(month: number) {
    if (selectedYear === null) return;
    // Check if selected month/day exceeds max
    if (selectedYear === maxYear && month > maxMonth) return;
    setSelectedMonth(month);
    setSelectedDay(null);
    setView("day");
  }

  function selectDay(day: number) {
    if (selectedYear === null || selectedMonth === null) return;
    // Check if day exceeds max
    if (selectedYear === maxYear && selectedMonth === maxMonth && day > maxDay) return;
    setSelectedDay(day);
    const mm = String(selectedMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${selectedYear}-${mm}-${dd}`);
  }

  function goToYearSelect() {
    setView("year");
    setYearSearch("");
  }

  function goToMonthSelect() {
    setView("month");
  }

  function formatDateDisplay(): string {
    if (selectedYear && selectedMonth !== null && selectedDay) {
      return `${selectedDay} ${MONTHS_FULL[selectedMonth]} ${selectedYear}`;
    }
    if (selectedYear && selectedMonth !== null) {
      return `${MONTHS_FULL[selectedMonth]} ${selectedYear}`;
    }
    if (selectedYear) {
      return `${selectedYear}`;
    }
    return "";
  }

  const daysInMonth = selectedYear !== null && selectedMonth !== null
    ? getDaysInMonth(selectedYear, selectedMonth)
    : 0;

  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white", className)}>
      {/* Display */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <Calendar className="h-4 w-4 text-kc-blue-500" />
        <span className="text-sm font-semibold text-slate-700">
          {formatDateDisplay() || "Select date of birth"}
        </span>
      </div>

      {/* Year Selection */}
      {view === "year" && (
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="number"
              placeholder="Search year (e.g. 2015)"
              value={yearSearch}
              onChange={(e) => setYearSearch(e.target.value)}
              className="kc-input !pl-9 !py-2.5 text-sm"
              min={minYear}
              max={maxYear}
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto pr-1">
            <div className="grid grid-cols-4 gap-1.5">
              {filteredYears.map((year) => {
                const isSelected = year === selectedYear;
                const isDisabled = year === maxYear && maxMonth < 0;
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => selectYear(year)}
                    disabled={isDisabled}
                    className={cn(
                      "rounded-lg px-2 py-2.5 text-sm font-semibold transition-all",
                      isSelected
                        ? "bg-kc-blue-600 text-white shadow-md"
                        : "bg-slate-50 text-slate-700 hover:bg-kc-blue-50 hover:text-kc-blue-700",
                      isDisabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
            {filteredYears.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">No years found</p>
            )}
          </div>
        </div>
      )}

      {/* Month Selection */}
      {view === "month" && selectedYear && (
        <div className="p-4">
          <button
            type="button"
            onClick={goToYearSelect}
            className="mb-3 flex items-center gap-1 text-xs font-semibold text-kc-blue-600 hover:text-kc-blue-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Change year ({selectedYear})
          </button>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((month, idx) => {
              const isSelected = idx === selectedMonth;
              const isDisabled = selectedYear === maxYear && idx > maxMonth;
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => selectMonth(idx)}
                  disabled={isDisabled}
                  className={cn(
                    "rounded-lg px-3 py-3 text-sm font-semibold transition-all",
                    isSelected
                      ? "bg-kc-blue-600 text-white shadow-md"
                      : "bg-slate-50 text-slate-700 hover:bg-kc-blue-50 hover:text-kc-blue-700",
                    isDisabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {month}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Selection */}
      {view === "day" && selectedYear && selectedMonth !== null && (
        <div className="p-4">
          <button
            type="button"
            onClick={goToMonthSelect}
            className="mb-3 flex items-center gap-1 text-xs font-semibold text-kc-blue-600 hover:text-kc-blue-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Change month ({MONTHS_FULL[selectedMonth]} {selectedYear})
          </button>
          <div className="grid grid-cols-7 gap-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="py-1 text-center text-[10px] font-bold uppercase text-slate-400">
                {d}
              </div>
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const isSelected = day === selectedDay;
              const isDisabled =
                selectedYear === maxYear && selectedMonth === maxMonth && day > maxDay;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  disabled={isDisabled}
                  className={cn(
                    "rounded-lg py-2.5 text-sm font-semibold transition-all",
                    isSelected
                      ? "bg-kc-blue-600 text-white shadow-md"
                      : "bg-slate-50 text-slate-700 hover:bg-kc-blue-50 hover:text-kc-blue-700",
                    isDisabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
