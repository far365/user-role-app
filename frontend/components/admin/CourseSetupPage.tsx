import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil, Trash2, Plus } from "lucide-react";
import backend from "~backend/client";
import type { CourseSetup } from "~backend/academic/types";
import { useToast } from "@/components/ui/use-toast";
import { CourseEditDialog } from "./CourseEditDialog";
import { CourseAddDialog } from "./CourseAddDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CourseSetupPageProps {
  onBack: () => void;
}

export function CourseSetupPage({ onBack }: CourseSetupPageProps) {
  const [courses, setCourses] = useState<CourseSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseSetup | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<CourseSetup | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const result = await backend.academic.getAllCourseSetup();
      setCourses(result.courses);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load course setup data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCourse) return;

    try {
      await backend.academic.deleteCourseSetup({
        course_code: deletingCourse.course_code,
      });

      toast({
        title: "Success",
        description: "Course deleted successfully",
      });

      setDeletingCourse(null);
      loadCourses();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Course Setup</h2>
            <p className="text-sm text-gray-600">View all course configurations</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
          <CardDescription>
            {courses.length} course{courses.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No courses found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Course Code</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Course Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Grade Level</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Color</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Max Enrollment</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, index) => (
                    <tr key={course.course_code} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 text-sm text-gray-900">{course.course_code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{course.course_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{course.grade_level}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: course.color_scheme }}
                          />
                          <span className="text-gray-700">{course.color_scheme}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{course.max_enrollment}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{course.description || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCourse(course)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingCourse(course)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CourseAddDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={loadCourses}
      />

      {editingCourse && (
        <CourseEditDialog
          course={editingCourse}
          open={!!editingCourse}
          onOpenChange={(open) => !open && setEditingCourse(null)}
          onSuccess={loadCourses}
        />
      )}

      <AlertDialog open={!!deletingCourse} onOpenChange={(open) => !open && setDeletingCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCourse?.course_name}"? This action will soft delete the course.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
