import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pencil, Save, X, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type ActivityType = "Academics" | "Lunch Break" | "P.E" | "Recess" | "Assembly" | "Study Hall" | "Other";

interface Teacher {
  id: string;
  name: string;
}

interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  day: number;
  startTime: string;
  endTime: string;
  attendanceRequired: boolean;
  teachers: string[];
}

interface ClassScheduleGridProps {
  grade: string;
}

const MOCK_TEACHERS: Teacher[] = [
  { id: "t1", name: "Mrs. Johnson" },
  { id: "t2", name: "Mr. Smith" },
  { id: "t3", name: "Ms. Williams" },
  { id: "t4", name: "Mr. Brown" },
  { id: "t5", name: "Mrs. Davis" },
  { id: "t6", name: "Mr. Miller" },
  { id: "t7", name: "Ms. Wilson" },
  { id: "t8", name: "Mrs. Moore" },
  { id: "t9", name: "Mr. Taylor" },
  { id: "t10", name: "Ms. Anderson" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const START_HOUR = 8;
const END_HOUR = 15;

const ACTIVITY_TYPES: ActivityType[] = [
  "Academics",
  "Lunch Break",
  "P.E",
  "Recess",
  "Assembly",
  "Study Hall",
  "Other",
];

export function ClassScheduleGrid({ grade }: ClassScheduleGridProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<"days-rows" | "time-rows">("days-rows");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    slots.push(`${END_HOUR}:00`);
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const handleAddActivity = (day: number, time: string) => {
    if (!isEditMode) return;
    
    const endTime = incrementTime(time, 60);
    const newActivity: Activity = {
      id: `activity-${Date.now()}`,
      name: "New Activity",
      type: "Academics",
      day,
      startTime: time,
      endTime,
      attendanceRequired: true,
      teachers: [],
    };
    
    setEditingActivity(newActivity);
    setIsDialogOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    if (!isEditMode) return;
    setEditingActivity({ ...activity });
    setIsDialogOpen(true);
  };

  const handleSaveActivity = () => {
    if (!editingActivity) return;

    if (editingActivity.type === "Academics" && editingActivity.teachers.length === 0) {
      toast({
        title: "Error",
        description: "Academics activities require at least one teacher",
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
    if (!isEditMode) return;
    setActivities(activities.filter((a) => a.day !== day));
    toast({
      title: "Success",
      description: `${DAYS[day]} activities deleted`,
    });
  };

  const handleCopyDay = (sourceDay: number, targetDay: number) => {
    if (!isEditMode) return;
    
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

  const incrementTime = (time: string, minutes: number): string => {
    const [h, m] = time.split(":").map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newHour = Math.floor(totalMinutes / 60);
    const newMin = totalMinutes % 60;
    return `${newHour.toString().padStart(2, "0")}:${newMin.toString().padStart(2, "0")}`;
  };

  const getActivitiesStartingInCell = (day: number, time: string): Activity[] => {
    return activities.filter((a) => a.day === day && a.startTime === time);
  };

  const calculateColSpan = (activity: Activity): number => {
    const startMinutes = timeToMinutes(activity.startTime);
    const endMinutes = timeToMinutes(activity.endTime);
    const durationMinutes = endMinutes - startMinutes;
    const slotDuration = 30;
    return Math.ceil(durationMinutes / slotDuration);
  };

  const isTimeSlotOccupied = (day: number, time: string): boolean => {
    const timeMinutes = timeToMinutes(time);
    return activities.some((a) => {
      if (a.day !== day) return false;
      const startMinutes = timeToMinutes(a.startTime);
      const endMinutes = timeToMinutes(a.endTime);
      return timeMinutes >= startMinutes && timeMinutes < endMinutes && a.startTime !== time;
    });
  };

  const getTeacherName = (teacherId: string): string => {
    return MOCK_TEACHERS.find((t) => t.id === teacherId)?.name || "";
  };

  const renderDaysAsRows = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 p-2 w-32">Day</th>
            {timeSlots.map((time) => (
              <th key={time} className="border border-gray-300 bg-gray-100 p-1 text-xs min-w-[80px]">
                {time}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, dayIndex) => (
            <tr key={day}>
              <td className="border border-gray-300 bg-gray-50 p-2 font-medium">
                <div className="flex items-center justify-between">
                  <span>{day}</span>
                  {isEditMode && (
                    <div className="flex gap-1">
                      {dayIndex < DAYS.length - 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyDay(dayIndex, dayIndex + 1)}
                          title="Copy to next day"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteDay(dayIndex)}
                        title="Delete day"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </td>
              {timeSlots.map((time) => {
                if (isTimeSlotOccupied(dayIndex, time)) {
                  return null;
                }

                const cellActivities = getActivitiesStartingInCell(dayIndex, time);
                const colSpan = cellActivities.length > 0 ? calculateColSpan(cellActivities[0]) : 1;

                return (
                  <td
                    key={`${day}-${time}`}
                    colSpan={colSpan}
                    className="border border-gray-300 p-2 h-24 align-top relative hover:bg-gray-50"
                    onClick={() => !cellActivities.length && handleAddActivity(dayIndex, time)}
                  >
                    {cellActivities.map((activity) => (
                      <div
                        key={activity.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditActivity(activity);
                        }}
                        className={`text-xs p-2 rounded cursor-pointer h-full ${
                          isEditMode ? "hover:opacity-80" : ""
                        } ${getActivityColor(activity.type)}`}
                      >
                        <div className="font-semibold mb-1">{activity.name}</div>
                        <div className="text-[10px] mb-1">
                          {activity.startTime} - {activity.endTime}
                        </div>
                        <div className="text-[10px] opacity-80 mb-1">{activity.type}</div>
                        {activity.teachers.length > 0 && (
                          <div className="text-[10px] opacity-70">
                            {activity.teachers.map(getTeacherName).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTimeAsRows = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 p-2 w-24">Time</th>
            {DAYS.map((day, dayIndex) => (
              <th key={day} className="border border-gray-300 bg-gray-100 p-2 min-w-[150px]">
                <div className="flex items-center justify-between">
                  <span>{day}</span>
                  {isEditMode && (
                    <div className="flex gap-1">
                      {dayIndex < DAYS.length - 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyDay(dayIndex, dayIndex + 1)}
                          title="Copy to next day"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteDay(dayIndex)}
                        title="Delete day"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((time) => (
            <tr key={time}>
              <td className="border border-gray-300 bg-gray-50 p-2 font-medium text-sm">
                {time}
              </td>
              {DAYS.map((day, dayIndex) => {
                if (isTimeSlotOccupied(dayIndex, time)) {
                  return null;
                }

                const cellActivities = getActivitiesStartingInCell(dayIndex, time);
                const rowSpan = cellActivities.length > 0 ? calculateColSpan(cellActivities[0]) : 1;

                return (
                  <td
                    key={`${time}-${day}`}
                    rowSpan={rowSpan}
                    className="border border-gray-300 p-2 h-24 align-top relative hover:bg-gray-50"
                    onClick={() => !cellActivities.length && handleAddActivity(dayIndex, time)}
                  >
                    {cellActivities.map((activity) => (
                      <div
                        key={activity.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditActivity(activity);
                        }}
                        className={`text-xs p-2 rounded cursor-pointer h-full ${
                          isEditMode ? "hover:opacity-80" : ""
                        } ${getActivityColor(activity.type)}`}
                      >
                        <div className="font-semibold mb-1">{activity.name}</div>
                        <div className="text-[10px] mb-1">
                          {activity.startTime} - {activity.endTime}
                        </div>
                        <div className="text-[10px] opacity-80 mb-1">{activity.type}</div>
                        {activity.teachers.length > 0 && (
                          <div className="text-[10px] opacity-70">
                            {activity.teachers.map(getTeacherName).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const getActivityColor = (type: ActivityType): string => {
    switch (type) {
      case "Academics":
        return "bg-blue-100 border border-blue-300";
      case "Lunch Break":
        return "bg-green-100 border border-green-300";
      case "P.E":
        return "bg-orange-100 border border-orange-300";
      case "Recess":
        return "bg-yellow-100 border border-yellow-300";
      case "Assembly":
        return "bg-purple-100 border border-purple-300";
      case "Study Hall":
        return "bg-gray-100 border border-gray-300";
      case "Other":
        return "bg-pink-100 border border-pink-300";
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Weekly Schedule - {grade}</h3>
            <p className="text-sm text-gray-600">School hours: 8:00 AM - 3:00 PM</p>
          </div>
          <div className="flex gap-2 items-center">
            <Label className="text-sm">View:</Label>
            <Button
              size="sm"
              variant={viewMode === "days-rows" ? "default" : "outline"}
              onClick={() => setViewMode("days-rows")}
            >
              Days as Rows
            </Button>
            <Button
              size="sm"
              variant={viewMode === "time-rows" ? "default" : "outline"}
              onClick={() => setViewMode("time-rows")}
            >
              Time as Rows
            </Button>
            <div className="ml-4 border-l pl-4">
              {!isEditMode ? (
                <Button onClick={() => setIsEditMode(true)} variant="default">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Schedule
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditMode(false)} variant="default">
                    <Save className="w-4 h-4 mr-2" />
                    Save & Exit
                  </Button>
                  <Button onClick={() => setIsEditMode(false)} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {isEditMode && (
          <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Edit Mode:</strong> Click on empty cells to add activities or click on activities to edit them.
            </p>
          </div>
        )}

        <div className="mb-4 flex gap-4 flex-wrap">
          {ACTIVITY_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getActivityColor(type)}`}></div>
              <span className="text-sm">{type}</span>
            </div>
          ))}
        </div>
      </Card>

      {viewMode === "days-rows" ? renderDaysAsRows() : renderTimeAsRows()}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingActivity?.name === "New Activity" ? "Add Activity" : "Edit Activity"}
            </DialogTitle>
          </DialogHeader>
          {editingActivity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Activity Name</Label>
                  <Input
                    value={editingActivity.name}
                    onChange={(e) =>
                      setEditingActivity({ ...editingActivity, name: e.target.value })
                    }
                    placeholder="e.g., Math Class"
                  />
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
                          {type}
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
                    step="60"
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
                    step="60"
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

              {editingActivity.type === "Academics" && (
                <div className="space-y-2">
                  <Label>Teachers (up to 4, first is required)</Label>
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="space-y-1">
                      <Label className="text-sm">
                        Teacher {index + 1} {index === 0 && "(Required)"}
                      </Label>
                      <Select
                        value={editingActivity.teachers[index] || "none"}
                        onValueChange={(value) => {
                          const newTeachers = [...editingActivity.teachers];
                          if (value === "none") {
                            newTeachers.splice(index, 1);
                          } else {
                            newTeachers[index] = value;
                          }
                          setEditingActivity({ ...editingActivity, teachers: newTeachers });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {MOCK_TEACHERS.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <div>
                  {editingActivity.name !== "New Activity" && (
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
    </div>
  );
}
