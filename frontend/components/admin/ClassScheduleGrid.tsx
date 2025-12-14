import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pencil, Save, X, Copy, Trash2, Plus, CheckCircle2, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { CourseSetup } from "~backend/academic/types";
import type { AcademicYear } from "~backend/academic/types";

type ActivityType = "Academics" | "Lunch Break" | "P.E" | "Recess" | "Assembly" | "Study Hall" | "Other";

interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  day: number;
  startTime: string;
  endTime: string;
  attendanceRequired: boolean;
}

interface ClassScheduleGridProps {
  grade: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MIN_START_TIME = "07:00";

const getNextMonday = (): string => {
  const today = new Date();
  const daysUntilNextMonday = ((1 - today.getDay() + 7) % 7) || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilNextMonday);
  return nextMonday.toISOString().split('T')[0];
};

const ACTIVITY_TYPES: ActivityType[] = [
  "Academics",
  "Lunch Break",
  "P.E",
  "Recess",
  "Assembly",
  "Study Hall",
  "Other",
];

const getActivityTypeDisplay = (type: ActivityType): string => {
  return type === "Academics" ? "Class" : type;
};

export function ClassScheduleGrid({ grade }: ClassScheduleGridProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEffectiveDateDialogOpen, setIsEffectiveDateDialogOpen] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [courses, setCourses] = useState<CourseSetup[]>([]);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [isJsonPreviewDialogOpen, setIsJsonPreviewDialogOpen] = useState(false);
  const [jsonPayload, setJsonPayload] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [coursesResponse, yearResponse] = await Promise.all([
          backend.academic.getAllCourseSetup(),
          backend.academic.getCurrentYear(),
        ]);
        const filteredCourses = coursesResponse.courses.filter(
          (course) => course.grade === grade
        );
        setCourses(filteredCourses);
        setCurrentYear(yearResponse);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({
          title: "Error",
          description: "Failed to load courses for this grade",
          variant: "destructive",
        });
      }
    };
    loadData();
  }, [grade, toast]);

  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const getActivitiesForDay = (day: number): Activity[] => {
    return activities
      .filter((a) => a.day === day)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  };

  const isMonday = (dateString: string): boolean => {
    const date = new Date(dateString);
    return date.getDay() === 1;
  };

  const isFutureDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date > today;
  };

  const handleStartEditingDay = (day: number) => {
    setIsEditMode(true);
    setEditingDay(day);
  };

  const handleSaveDay = async () => {
    if (editingDay === null || !currentYear) return;

    const dayActivities = getActivitiesForDay(editingDay);
    
    if (dayActivities.length === 0) {
      toast({
        title: "Error",
        description: "Cannot save an empty day. Add at least one activity.",
        variant: "destructive",
      });
      return;
    }

    const nextMonday = getNextMonday();

    const scheduleActivities = dayActivities.map((activity) => ({
      activity_name: activity.name,
      activity_type: activity.type,
      start_time: activity.startTime,
      end_time: activity.endTime,
      day_of_week: DAYS[activity.day],
      notes: activity.attendanceRequired ? "Attendance Required" : undefined,
    }));

    const payload = {
      header: {
        timezone: "America/New_York",
        ayid: currentYear.ayid,
        grade: grade,
        day_of_week: DAYS[editingDay],
        effective_date: nextMonday,
        start_time: dayActivities[0].startTime,
      },
      activities: scheduleActivities,
    };

    setJsonPayload(payload);
    setIsJsonPreviewDialogOpen(true);
  };

  const handleConfirmJsonSubmit = async () => {
    if (!jsonPayload) return;

    try {
      await backend.grades.addClassSchedule(jsonPayload);

      setEditingDay(null);
      setIsEditMode(false);
      setIsJsonPreviewDialogOpen(false);
      setJsonPayload(null);
      toast({
        title: "Success",
        description: `${DAYS[jsonPayload.header.day_of_week]} schedule saved with effective date ${jsonPayload.header.effective_date}`,
      });
    } catch (error) {
      console.error("Failed to save schedule:", error);
      toast({
        title: "Error",
        description: "Failed to save schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEditingDay = () => {
    setEditingDay(null);
    setIsEditMode(false);
  };

  const handleSaveAndExit = () => {
    setIsEffectiveDateDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!effectiveDate) {
      toast({
        title: "Error",
        description: "Please select an effective date",
        variant: "destructive",
      });
      return;
    }

    if (!isMonday(effectiveDate)) {
      toast({
        title: "Error",
        description: "Effective date must be a Monday",
        variant: "destructive",
      });
      return;
    }

    if (!isFutureDate(effectiveDate)) {
      toast({
        title: "Error",
        description: "Effective date must be in the future",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Schedule saved with effective date: ${effectiveDate}`,
    });

    setIsEffectiveDateDialogOpen(false);
    setIsEditMode(false);
    setEditingDay(null);
    setEffectiveDate("");
  };

  const getNextStartTime = (day: number): string => {
    const dayActivities = getActivitiesForDay(day);
    if (dayActivities.length === 0) {
      return MIN_START_TIME;
    }
    const lastActivity = dayActivities[dayActivities.length - 1];
    const endMinutes = timeToMinutes(lastActivity.endTime);
    return minutesToTime(endMinutes + 1);
  };

  const handleAddActivity = (day: number) => {
    if (!isEditMode || editingDay !== day) return;

    const startTime = getNextStartTime(day);
    const startMinutes = timeToMinutes(startTime);
    const endTime = minutesToTime(startMinutes + 45);

    const newActivity: Activity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      type: "Academics",
      day,
      startTime,
      endTime,
      attendanceRequired: true,
    };

    setEditingActivity(newActivity);
    setIsDialogOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    if (!isEditMode || editingDay !== activity.day) return;
    setEditingActivity({ ...activity });
    setIsDialogOpen(true);
  };

  const handleSaveActivity = () => {
    if (!editingActivity) return;

    if (!editingActivity.name || editingActivity.name.trim() === "") {
      toast({
        title: "Error",
        description: "Activity name is required",
        variant: "destructive",
      });
      return;
    }

    const startMinutes = timeToMinutes(editingActivity.startTime);
    const endMinutes = timeToMinutes(editingActivity.endTime);

    if (startMinutes >= endMinutes) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    if (startMinutes < timeToMinutes(MIN_START_TIME)) {
      toast({
        title: "Error",
        description: "Classes cannot start before 7:00 AM",
        variant: "destructive",
      });
      return;
    }

    const otherActivitiesOnSameDay = activities.filter(
      (a) => a.day === editingActivity.day && a.id !== editingActivity.id
    );

    const hasDuplicateName = otherActivitiesOnSameDay.some(
      (a) => a.name.toLowerCase().trim() === editingActivity.name.toLowerCase().trim()
    );

    if (hasDuplicateName) {
      toast({
        title: "Error",
        description: `An activity named "${editingActivity.name}" already exists on ${DAYS[editingActivity.day]}`,
        variant: "destructive",
      });
      return;
    }

    const hasOverlap = otherActivitiesOnSameDay.some((a) => {
      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      
      return (
        (startMinutes >= aStart && startMinutes < aEnd) ||
        (endMinutes > aStart && endMinutes <= aEnd) ||
        (startMinutes <= aStart && endMinutes >= aEnd)
      );
    });

    if (hasOverlap) {
      toast({
        title: "Error",
        description: "This time slot overlaps with another activity on the same day",
        variant: "destructive",
      });
      return;
    }

    const existingIndex = activities.findIndex((a) => a.id === editingActivity.id);
    if (existingIndex >= 0) {
      const updated = [...activities];
      updated[existingIndex] = editingActivity;
      setActivities(updated);
    } else {
      setActivities([...activities, editingActivity]);
    }

    setIsDialogOpen(false);
    setEditingActivity(null);
  };

  const handleDeleteActivity = (activityId: string) => {
    setActivities(activities.filter((a) => a.id !== activityId));
  };

  const handleDeleteDay = (day: number) => {
    if (!isEditMode || editingDay !== day) return;
    setActivities(activities.filter((a) => a.day !== day));
    toast({
      title: "Success",
      description: `${DAYS[day]} schedule cleared`,
    });
  };

  const handleCopyDay = (sourceDay: number, targetDay: number) => {
    if (!isEditMode || editingDay !== sourceDay) return;

    const targetActivities = activities.filter((a) => a.day === targetDay);
    if (targetActivities.length > 0) {
      toast({
        title: "Error",
        description: "Target day must be empty to copy",
        variant: "destructive",
      });
      return;
    }

    const sourceActivities = activities.filter((a) => a.day === sourceDay);
    const copiedActivities = sourceActivities.map((a) => ({
      ...a,
      id: `activity-${Date.now()}-${Math.random()}`,
      day: targetDay,
    }));

    setActivities([...activities, ...copiedActivities]);
    toast({
      title: "Success",
      description: `Copied ${DAYS[sourceDay]} to ${DAYS[targetDay]}`,
    });
  };

  const getActivityColor = (type: ActivityType): string => {
    switch (type) {
      case "Academics":
        return "bg-blue-100 border border-blue-300 text-blue-900";
      case "Lunch Break":
        return "bg-green-100 border border-green-300 text-green-900";
      case "P.E":
        return "bg-orange-100 border border-orange-300 text-orange-900";
      case "Recess":
        return "bg-yellow-100 border border-yellow-300 text-yellow-900";
      case "Assembly":
        return "bg-purple-100 border border-purple-300 text-purple-900";
      case "Study Hall":
        return "bg-gray-100 border border-gray-300 text-gray-900";
      case "Other":
        return "bg-pink-100 border border-pink-300 text-pink-900";
    }
  };

  const formatTime = (time: string): string => {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const getTimelineHours = (): string[] => {
    const hours: string[] = [];
    for (let h = 7; h <= 15; h++) {
      hours.push(`${h.toString().padStart(2, "0")}:00`);
    }
    return hours;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Weekly Schedule - {grade}</h3>
            <p className="text-sm text-muted-foreground">Custom class timings (earliest start: 7:00 AM)</p>
            {isEditMode && editingDay !== null && (
              <p className="text-sm text-blue-600 font-medium mt-1">
                Editing: {DAYS[editingDay]}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {isEditMode && editingDay !== null && (
              <>
                <Button onClick={handleSaveDay} variant="default">
                  <Save className="w-4 h-4 mr-2" />
                  Save {DAYS[editingDay]}
                </Button>
                <Button onClick={handleCancelEditingDay} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {isEditMode && editingDay !== null && (
          <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Edit Mode ({DAYS[editingDay]}):</strong> Click the <Plus className="w-3 h-3 inline" /> button to add activities. New activities automatically start 1 minute after the previous activity ends.
            </p>
          </div>
        )}

        <div className="mb-4 flex gap-4 flex-wrap">
          {ACTIVITY_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getActivityColor(type)}`}></div>
              <span className="text-sm">{getActivityTypeDisplay(type)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-4">
        <div className="w-20 flex-shrink-0">
          <div className="sticky top-4">
            <div className="text-sm font-semibold mb-2 text-center">Time</div>
            <div className="space-y-8">
              {getTimelineHours().map((time) => (
                <div key={time} className="text-xs text-muted-foreground text-center border-t pt-1">
                  {formatTime(time)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-5 gap-4">
          {DAYS.map((day, dayIndex) => {
            const dayActivities = getActivitiesForDay(dayIndex);
            const isDayLocked = isEditMode && editingDay !== null && editingDay !== dayIndex;
            const isDayEditing = isEditMode && editingDay === dayIndex;
            return (
              <Card key={day} className={`p-3 relative ${isDayLocked ? 'opacity-50 bg-gray-50' : ''} ${isDayEditing ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">{day}</h4>
                  <div className="flex gap-1">
                    {!isEditMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEditingDay(dayIndex)}
                        title={`Edit ${day}`}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    )}
                    {isDayEditing && (
                      <>
                        {dayIndex < DAYS.length - 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyDay(dayIndex, dayIndex + 1)}
                            title={`Copy to ${DAYS[dayIndex + 1]}`}
                          >
                            <Copy className="w-3 h-3" />
                            <ArrowRight className="w-3 h-3 ml-0.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDay(dayIndex)}
                          title="Clear day"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {dayActivities.map((activity) => (
                    <div
                      key={activity.id}
                      onClick={() => handleEditActivity(activity)}
                      className={`p-2 rounded transition-all relative ${
                        isDayEditing ? "cursor-pointer hover:opacity-80 hover:shadow-md" : isDayLocked ? "cursor-not-allowed" : ""
                      } ${getActivityColor(activity.type)}`}
                    >
                      {activity.attendanceRequired && (
                        <div className="absolute top-1 right-1" title="Attendance Required">
                          <CheckCircle2 className="w-3 h-3 fill-current opacity-70" />
                        </div>
                      )}
                      <div className="font-semibold text-xs mb-1 pr-4">{activity.name}</div>
                      <div className="text-[10px] font-medium mb-1">
                        {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                      </div>
                      <div className="text-[10px] opacity-70 mb-1">{getActivityTypeDisplay(activity.type)}</div>
                    </div>
                  ))}

                  {isDayEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => handleAddActivity(dayIndex)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Activity
                    </Button>
                  )}

                  {dayActivities.length === 0 && !isEditMode && (
                    <div className="text-xs text-muted-foreground text-center py-8">
                      No classes scheduled
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {activities.find((a) => a.id === editingActivity?.id) ? "Edit Activity" : "Add Activity"}
            </DialogTitle>
            <DialogDescription>
              {activities.find((a) => a.id === editingActivity?.id) ? "Update the activity details below." : "Add a new activity to the schedule."}
            </DialogDescription>
          </DialogHeader>
          {editingActivity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class Name</Label>
                  {editingActivity.type === "Academics" ? (
                    <Select
                      value={editingActivity.name}
                      onValueChange={(value) =>
                        setEditingActivity({ ...editingActivity, name: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => {
                          const displayName = `${course.course_code} - ${course.course_name}`;
                          return (
                            <SelectItem key={course.course_code} value={displayName}>
                              {displayName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={editingActivity.name}
                      onChange={(e) =>
                        setEditingActivity({ ...editingActivity, name: e.target.value })
                      }
                      placeholder="e.g., Lunch, Recess"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Activity Type</Label>
                  <Select
                    value={editingActivity.type}
                    onValueChange={(value: ActivityType) =>
                      setEditingActivity({ ...editingActivity, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getActivityTypeDisplay(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select
                    value={editingActivity.day.toString()}
                    onValueChange={(value) =>
                      setEditingActivity({ ...editingActivity, day: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day, index) => (
                        <SelectItem key={day} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={editingActivity.startTime}
                    onChange={(e) =>
                      setEditingActivity({ ...editingActivity, startTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={editingActivity.endTime}
                    onChange={(e) =>
                      setEditingActivity({ ...editingActivity, endTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingActivity.attendanceRequired}
                  onCheckedChange={(checked) =>
                    setEditingActivity({ ...editingActivity, attendanceRequired: checked })
                  }
                />
                <Label>Attendance Required</Label>
              </div>

              <div className="flex justify-between pt-4">
                <div>
                  {activities.find((a) => a.id === editingActivity.id) && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleDeleteActivity(editingActivity.id);
                        setIsDialogOpen(false);
                        setEditingActivity(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Activity
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveActivity}>Save Activity</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEffectiveDateDialogOpen} onOpenChange={setIsEffectiveDateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Effective Date</DialogTitle>
            <DialogDescription>
              Choose when this schedule should take effect.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Effective Date (Must be a future Monday)</Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This schedule will take effect starting on the selected Monday.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEffectiveDateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmSave}>Confirm & Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isJsonPreviewDialogOpen} onOpenChange={setIsJsonPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Schedule JSON</DialogTitle>
            <DialogDescription>
              Review the exact code and payload that will be sent to Supabase
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-sm">Backend API Endpoint Request Payload:</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                <pre>{JSON.stringify(jsonPayload, null, 2)}</pre>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-sm">Backend Code (grades.addClassSchedule):</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                <pre>{`const payload = {
  header: ${JSON.stringify(jsonPayload?.header, null, 2)},
  activities: ${JSON.stringify(jsonPayload?.activities, null, 2)}
};

const jsonPayload = JSON.stringify(payload);

const { data, error } = await supabase.rpc("add_class_schedule", {
  json_input: jsonPayload
});`}</pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-sm">Supabase RPC Call Parameter:</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                <pre>{`{
  "json_input": ${JSON.stringify(JSON.stringify(jsonPayload))}
}`}</pre>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsJsonPreviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmJsonSubmit}>
                <Save className="w-4 h-4 mr-2" />
                Submit to API
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
