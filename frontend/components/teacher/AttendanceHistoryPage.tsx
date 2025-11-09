import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

export function AttendanceHistoryPage({ user, onBack }: AttendanceHistoryPageProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showGrid, setShowGrid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadGrades();
    setDefaultDateRange();
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

  const setDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
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

    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Error",
        description: "Start date must be before end date",
        variant: "destructive",
      });
      return;
    }

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
          <CardTitle>Select Grade and Date Range</CardTitle>
          <CardDescription>
            Choose a grade and date range to view attendance grid
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
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
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
