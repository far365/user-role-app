import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import backend from "~backend/client";
import { useToast } from "@/components/ui/use-toast";
import type { Grade } from "~backend/grades/types";

interface CourseAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CourseAddDialog({ open, onOpenChange, onSuccess }: CourseAddDialogProps) {
  const [formData, setFormData] = useState({
    course_code: "",
    course_name: "",
    grade_level: "",
    color: "#3b82f6",
    max_enrollment: "",
    min_teachers: 1,
    min_assistants: 0,
    description: "",
  });
  const [grades, setGrades] = useState<Grade[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await backend.grades.list();
        setGrades(response.grades);
      } catch (error) {
        console.error("Failed to fetch grades:", error);
        toast({
          title: "Error",
          description: "Failed to load grade levels",
          variant: "destructive",
        });
      }
    };
    fetchGrades();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await backend.academic.addCourseSetup({
        course_code: formData.course_code,
        course_name: formData.course_name,
        grade_level: formData.grade_level,
        color: formData.color,
        max_enrollment: formData.max_enrollment,
        min_teachers: formData.min_teachers,
        min_assistants: formData.min_assistants,
        description: formData.description,
      });

      toast({
        title: "Success",
        description: "Course added successfully",
      });

      setFormData({
        course_code: "",
        course_name: "",
        grade_level: "",
        color: "#3b82f6",
        max_enrollment: "",
        min_teachers: 1,
        min_assistants: 0,
        description: "",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to add course",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>
            Create a new course configuration
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course_code">Course Code</Label>
                <Input
                  id="course_code"
                  value={formData.course_code}
                  onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course_name">Course Name</Label>
                <Input
                  id="course_name"
                  value={formData.course_name}
                  onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade_level">Grade</Label>
                <Select
                  value={formData.grade_level}
                  onValueChange={(value) => setFormData({ ...formData, grade_level: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade.name} value={grade.name}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_enrollment">Max Enrollment</Label>
                <Input
                  id="max_enrollment"
                  value={formData.max_enrollment}
                  onChange={(e) => setFormData({ ...formData, max_enrollment: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_teachers">Min Teachers</Label>
                <Input
                  id="min_teachers"
                  type="number"
                  min="0"
                  value={formData.min_teachers}
                  onChange={(e) => setFormData({ ...formData, min_teachers: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_assistants">Min Assistants</Label>
                <Input
                  id="min_assistants"
                  type="number"
                  min="0"
                  value={formData.min_assistants}
                  onChange={(e) => setFormData({ ...formData, min_assistants: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
