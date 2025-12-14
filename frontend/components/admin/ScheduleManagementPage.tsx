import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { User } from "~backend/user/types";
import type { Grade } from "~backend/grades/types";
import { ClassScheduleGrid } from "./ClassScheduleGrid";

interface ScheduleManagementPageProps {
  user: User;
  onBack: () => void;
}

export function ScheduleManagementPage({ user, onBack }: ScheduleManagementPageProps) {
  const [academicYear, setAcademicYear] = useState("AY25-26");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
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

    loadGrades();
  }, [toast]);

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
          <Label htmlFor="grade">Grade</Label>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger id="grade">
              <SelectValue placeholder="Select grade" />
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
      </div>

      {selectedGrade && academicYear && (
        <div className="mt-8">
          <ClassScheduleGrid grade={selectedGrade} academicYear={academicYear} />
        </div>
      )}
    </div>
  );
}
