import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import type { User } from "~backend/user/types";

interface ScheduleManagementPageProps {
  user: User;
  onBack: () => void;
}

const getMondayOfCurrentWeek = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return monday.toISOString().split('T')[0];
};

export function ScheduleManagementPage({ user, onBack }: ScheduleManagementPageProps) {
  const [academicYear, setAcademicYear] = useState("AY25-26");
  const [effectiveDate, setEffectiveDate] = useState(getMondayOfCurrentWeek());

  return (
    <div className="space-y-6">
      <div>
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Schedule Management</h2>
        <p className="text-gray-600">Manage class schedules and timings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="academic-year">Academic Year</Label>
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger id="academic-year">
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AY25-26">AY25-26</SelectItem>
              <SelectItem value="AY24-25">AY24-25</SelectItem>
              <SelectItem value="AY26-27">AY26-27</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="effective-date">Last Effective Date for Monday</Label>
          <Select value={effectiveDate} onValueChange={setEffectiveDate}>
            <SelectTrigger id="effective-date">
              <SelectValue placeholder="Select effective date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={getMondayOfCurrentWeek()}>{getMondayOfCurrentWeek()}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
