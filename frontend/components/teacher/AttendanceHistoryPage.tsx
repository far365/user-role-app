import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AttendanceGridByGrade } from "./AttendanceGridByGrade";
import backend from "~backend/client";
import type { User as UserType } from "~backend/user/types";
import type { Grade } from "~backend/grades/types";

interface AttendanceHistoryPageProps {
  user: UserType;
  onBack: () => void;
}

const MONTHS = [
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

export function AttendanceHistoryPage({ user, onBack }: AttendanceHistoryPageProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showGrid, setShowGrid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadGrades();
    setDefaultSelections();
  }, []);

  const loadGrades = async () => {
    try {
      const response = await backend.grades.list();
      setGrades(response.grades);
    } catch (error) {
      console.error("Failed to load grades:", error);
      toast({
        title: "Error",
        description: "Failed to load grade list",
        variant: "destructive",
      });
    }
  };

  const setDefaultSelections = () => {
    const today = new Date();
    setSelectedMonth(today.getMonth().toString());
    setSelectedYear(today.getFullYear().toString());
  };

  const generateYears = (): string[] => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let i = currentYear; i >= 2025; i--) {
      years.push(i.toString());
    }
    return years;
  };

  const getAvailableMonths = (): typeof MONTHS => {
    if (selectedYear === "2025") {
      return MONTHS.filter(month => parseInt(month.value) >= 6);
    }
    return MONTHS;
  };

  const handleGenerateGrid = () => {
    if (!selectedGrade) {
      toast({
        title: "Error",
        description: "Please select a grade",
        variant: "destructive",
      });
      return;
    }

    if (selectedMonth === "" || selectedYear === "") {
      toast({
        title: "Error",
        description: "Please select a month and year",
        variant: "destructive",
      });
      return;
    }

    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(lastDay));
    setShowGrid(true);
  };

  const formatLastLogin = (lastLogin: Date | null) => {
    if (!lastLogin) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return lastLogin.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant={user.userStatus === 'Active' ? 'default' : 'destructive'}
              className={user.userStatus === 'Active' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {user.userStatus}
            </Badge>
            <span className="text-sm text-gray-500">
              Last login: {formatLastLogin(user.lastLoginDTTM)}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 whitespace-nowrap">Attendance History</h3>
          <p className="text-sm text-gray-600">
            View historical attendance records.
          </p>
        </div>
      </div>

      <Button 
        variant="outline" 
        onClick={onBack}
        className="inline-flex items-center"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Return to Teacher Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Select Grade, Month, and Year</CardTitle>
          <CardDescription>
            Choose a grade and month to view attendance grid
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade-select">Grade</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger id="grade-select">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.name} value={grade.name}>
                      {grade.name} - Building {grade.building}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month-select">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month-select">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableMonths().map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year-select">Year</Label>
              <Select 
                value={selectedYear} 
                onValueChange={(value) => {
                  setSelectedYear(value);
                  if (value === "2025" && parseInt(selectedMonth) < 6) {
                    setSelectedMonth("6");
                  }
                }}
              >
                <SelectTrigger id="year-select">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {generateYears().map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerateGrid} className="w-full md:w-auto">
            Generate Attendance Grid
          </Button>
        </CardContent>
      </Card>

      {showGrid && selectedGrade && startDate && endDate && (
        <AttendanceGridByGrade
          grade={selectedGrade}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
}
