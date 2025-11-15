import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, X, Plus, Trash2, AlertCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { User as UserType } from "~backend/user/types";
import type { HifzGrade, HifzEntry, HifzGridData, HifzHistoryEntry, SurahSetup } from "~backend/hifz/types";
import type { Grade } from "~backend/grades/types";
import { SURAHS } from "~backend/hifz/surah_data";

function formatHistoryDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Invalid Date";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid Date";
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getUTCDay()];
    const monthName = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    
    const suffix = (day: number) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${dayName} ${monthName} ${day}${suffix(day)}`;
  } catch {
    return "Invalid Date";
  }
}

interface HifzPortalProps {
  user: UserType;
  onBack: () => void;
}

interface StudyGroupItem {
  id: number;
  groupname: string;
  category: string;
}

const GRADES: HifzGrade[] = ["A+", "A", "B+", "B", "C"];

type SectionType = "meaning" | "memorization" | "revision";

interface Student {
  studentid: number;
  studentname: string;
}

export function HifzPortal({ user, onBack }: HifzPortalProps) {
  const [currentYear, setCurrentYear] = useState<string>("");
  const [selectionMode, setSelectionMode] = useState<"studyGroup" | "grade">("studyGroup");
  const [studyGroups, setStudyGroups] = useState<StudyGroupItem[]>([]);
  const [studyGroup, setStudyGroup] = useState<string>("");
  const [studyGroupId, setStudyGroupId] = useState<number | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [grade, setGrade] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [student, setStudent] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [gridData, setGridData] = useState<HifzGridData>({
    meaning: [],
    memorization: [],
    revision: [],
  });

  const [editingSection, setEditingSection] = useState<SectionType | null>(null);
  const [tempGridData, setTempGridData] = useState<HifzEntry[]>([]);
  const [history, setHistory] = useState<HifzHistoryEntry[]>([]);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteRcdId, setDeleteRcdId] = useState<number | null>(null);
  const [absenceData, setAbsenceData] = useState<{ id: number; absenceType: "Excused" | "Unexcused"; notes?: string } | null>(null);
  const [selectedAbsenceType, setSelectedAbsenceType] = useState<"Excused" | "Unexcused" | null>(null);
  const [absenceNotes, setAbsenceNotes] = useState("");
  const [isSubmittingAbsence, setIsSubmittingAbsence] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const yearResp = await backend.academic.getCurrentYear();
        setCurrentYear(yearResp.ayid);
        const gradesResp = await backend.grades.list();
        setGrades(gradesResp.grades);
        const studyGroupsResp = await backend.hifz.getGroupsByCategory({ category: "Hifz" });
        setStudyGroups(studyGroupsResp.groups);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load initial data",
          variant: "destructive",
        });
      }
    };
    fetchData();
  }, [toast]);

  useEffect(() => {
    if (student && selectedDate) {
      fetchHifzData();
      fetchHistory();
      fetchAbsenceData();
    } else {
      setAbsenceData(null);
      setSelectedAbsenceType(null);
      setAbsenceNotes("");
    }
  }, [student, selectedDate]);

  useEffect(() => {
    setStudent("");
    setStudents([]);
  }, [selectionMode, studyGroup]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (selectionMode === "grade" && grade) {
        try {
          const response = await backend.student.getStudentsByGrade({ grade });
          setStudents(response.students.map(s => ({
            studentid: s.studentid,
            studentname: s.studentname
          })));
        } catch (error) {
          console.error("Failed to fetch students:", error);
          toast({
            title: "Error",
            description: "Failed to load students",
            variant: "destructive",
          });
          setStudents([]);
        }
      } else if (selectionMode === "studyGroup" && studyGroup) {
        try {
          const response = await backend.student.getStudentsByGroupId({ groupid: studyGroup });
          setStudents(response.students.map(s => ({
            studentid: s.studentid,
            studentname: s.studentname
          })));
        } catch (error) {
          console.error("Failed to fetch students by groupid:", error);
          toast({
            title: "Error",
            description: "Failed to load students",
            variant: "destructive",
          });
          setStudents([]);
        }
      }
    };
    fetchStudents();
  }, [grade, studyGroup, selectionMode, toast]);

  const fetchHifzData = async () => {
    try {
      const response = await backend.hifz.getData({
        studyGroupId: studyGroup,
        studentId: student,
        date: selectedDate,
      });
      setGridData(response.data);
    } catch (error) {
      console.error("Failed to fetch hifz data:", error);
      toast({
        title: "Error",
        description: "Failed to load hifz data",
        variant: "destructive",
      });
    }
  };

  const fetchHistory = async () => {
    try {
      const payload = {
        studentId: student,
        prevRowsCount: "20",
      };
      const response = await backend.hifz.getHistoryByStudentId(payload);
      setHistory(response.history);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const fetchAbsenceData = async () => {
    try {
      const response = await backend.hifz.getAbsenceByStudentDate({
        studentId: student,
        date: selectedDate,
      });
      if (response.absence) {
        setAbsenceData(response.absence);
        setSelectedAbsenceType(null);
        setAbsenceNotes("");
      } else {
        setAbsenceData(null);
        setSelectedAbsenceType(null);
        setAbsenceNotes("");
      }
    } catch (error) {
      console.error("Failed to fetch absence data:", error);
    }
  };

  const handleSubmitAbsence = async () => {
    if (!selectedAbsenceType) {
      toast({
        title: "Validation Error",
        description: "Please select an absence type",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingAbsence(true);
    try {
      const response = await backend.hifz.insertStudentAbsence({
        studentId: student,
        absenceType: selectedAbsenceType,
        lessonDateText: selectedDate,
        teacherId: user.userID,
        notes: absenceNotes,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to submit absence");
      }

      toast({
        title: "Success",
        description: "Absence recorded successfully",
      });

      await fetchAbsenceData();
      await fetchHistory();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit absence",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingAbsence(false);
    }
  };

  const handleDeleteAbsence = async () => {
    if (!absenceData) return;

    try {
      const response = await backend.hifz.deleteHifzRcdByRcdId({ rcdId: absenceData.id });

      if (!response.success) {
        throw new Error(response.message || "Failed to delete absence");
      }

      toast({
        title: "Success",
        description: "Absence deleted successfully",
      });

      await fetchAbsenceData();
      await fetchHistory();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete absence",
        variant: "destructive",
      });
    }
  };

  const todaysHistoryEntries = useMemo(() => {
    if (!history.length || !selectedDate) {
      return { meaning: [], memorization: [], revision: [] };
    }

    const todaysHistory = history.filter(entry => {
      if (!entry.lessonDateText) return false;
      const entryDate = new Date(entry.lessonDateText).toISOString().split('T')[0];
      return entryDate === selectedDate;
    });
    
    const result: HifzGridData = {
      meaning: [],
      memorization: [],
      revision: []
    };

    todaysHistory.forEach(entry => {
      const surah = SURAHS.find(s => s.name_english === entry.surah);
      
      const hifzEntry: HifzEntry = {
        id: entry.id,
        surahName: entry.surah || "",
        surahNum: surah?.num,
        from: entry.from ? parseInt(entry.from.toString()) : 1,
        to: entry.to ? parseInt(entry.to.toString()) : 1,
        lines: entry.lines ? parseInt(entry.lines.toString()) : 1,
        iterations: entry.iterations ? parseInt(entry.iterations.toString()) : 1,
        grade: (entry.hifzGrade || "") as HifzGrade,
        note: entry.notes || ""
      };

      const recordType = entry.recordType?.toLowerCase();
      if (recordType === 'meaning') {
        result.meaning.push(hifzEntry);
      } else if (recordType === 'memorization') {
        result.memorization.push(hifzEntry);
      } else if (recordType === 'revision') {
        result.revision.push(hifzEntry);
      }
    });

    return result;
  }, [history, selectedDate]);

  const combinedGridData = useMemo(() => {
    const sections: SectionType[] = ['meaning', 'memorization', 'revision'];
    const result: Record<SectionType, HifzEntry[]> = {
      meaning: [],
      memorization: [],
      revision: []
    };

    sections.forEach(section => {
      const existingIds = new Set(gridData[section].map(e => e.id).filter(Boolean));
      const todaysEntries = todaysHistoryEntries[section].filter(e => !existingIds.has(e.id));
      result[section] = [...gridData[section], ...todaysEntries];
    });

    return result;
  }, [gridData, todaysHistoryEntries]);

  const handleAddRow = (section: SectionType) => {
    if (editingSection) return;
    
    if (absenceData) {
      toast({
        title: "Cannot Add Record",
        description: "Cannot add hifz records when an absence is recorded for this date",
        variant: "destructive",
      });
      return;
    }
    setEditingSection(section);
    
    const combinedDataForSection = combinedGridData[section];
    const usedSurahs = new Set(combinedDataForSection.map(entry => entry.surahNum).filter(Boolean));
    const availableSurahs = SURAHS.filter(s => !usedSurahs.has(s.num));
    
    if (availableSurahs.length === 0) {
      toast({
        title: "Cannot Add Row",
        description: "All surahs have already been added to this section",
        variant: "destructive",
      });
      return;
    }
    
    let defaultSurahName = "";
    let defaultSurahNum: number | undefined = undefined;
    
    if (history.length > 0) {
      const recordTypeMap = {
        "meaning": "Meaning",
        "memorization": "Memorization",
        "revision": "Revision"
      };
      const targetType = recordTypeMap[section];
      
      const lastHistoryEntry = history.find(entry => 
        entry.recordType && entry.recordType.toLowerCase() === targetType.toLowerCase()
      );
      
      if (lastHistoryEntry && lastHistoryEntry.surah) {
        const matchingSurah = SURAHS.find(s => 
          s.name_english === lastHistoryEntry.surah
        );
        
        if (matchingSurah && !usedSurahs.has(matchingSurah.num)) {
          defaultSurahName = matchingSurah.name_english;
          defaultSurahNum = matchingSurah.num;
        }
      }
    }
    
    setTempGridData([{ 
      surahName: defaultSurahName, 
      surahNum: defaultSurahNum,
      from: 1, 
      to: 1, 
      grade: "", 
      lines: 1, 
      iterations: 1, 
      note: "" 
    }]);
  };

  const handleSaveSection = async () => {
    if (!editingSection || tempGridData.length === 0) return;

    const entry = tempGridData[0];
    
    if (!entry.grade) {
      toast({
        title: "Validation Error",
        description: "Please select a grade",
        variant: "destructive",
      });
      return;
    }

    if ((entry.from ?? 1) > (entry.to ?? 1)) {
      toast({
        title: "Validation Error",
        description: "\"From\" value cannot be greater than \"To\" value",
        variant: "destructive",
      });
      return;
    }

    const recordType = 
      editingSection === "meaning" ? "Meaning" :
      editingSection === "memorization" ? "Memorization" : "Revision";

    try {
      const response = await backend.hifz.insertStudentHifz({
        recordType,
        studentId: student,
        surah: entry.surahName || "",
        from: (entry.from ?? 1).toString(),
        to: (entry.to ?? 1).toString(),
        lines: (entry.lines ?? 1).toString(),
        notes: entry.note || "",
        addedBy: user.userID,
        lessonDateText: selectedDate,
        teacherId: user.userID,
        hifzGrade: entry.grade,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to save");
      }

      toast({
        title: "Success",
        description: "Record saved successfully",
      });
      
      await fetchHifzData();
      await fetchHistory();
      
      setEditingSection(null);
      setTempGridData([]);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setTempGridData([]);
  };

  const handleDeleteClick = (rcdId: number | undefined) => {
    if (!rcdId) {
      toast({
        title: "Error",
        description: "Invalid record ID",
        variant: "destructive",
      });
      return;
    }
    setDeleteRcdId(rcdId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRcdId) return;

    try {
      const response = await backend.hifz.deleteHifzRcdByRcdId({ rcdId: deleteRcdId });
      
      if (!response.success) {
        throw new Error(response.message || "Failed to delete record");
      }

      toast({
        title: "Success",
        description: "Record deleted successfully",
      });
      
      await fetchHifzData();
      await fetchHistory();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete record",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteRcdId(null);
    }
  };

  const handleRowChange = (field: keyof HifzEntry, value: any) => {
    const newData = [...tempGridData];
    const index = 0;
    
    if (field === "surahName") {
      const selectedSurahNum = parseInt(value);
      const usedSurahs = new Set(combinedGridData[editingSection!].map(entry => entry.surahNum).filter(Boolean));
      
      if (usedSurahs.has(selectedSurahNum)) {
        toast({
          title: "Duplicate Surah",
          description: "This surah has already been added to this section",
          variant: "destructive",
        });
        return;
      }
      
      const selectedSurah = SURAHS.find((s) => s.num === selectedSurahNum);
      if (selectedSurah) {
        newData[index] = {
          ...newData[index],
          surahName: selectedSurah.name_english,
          surahNum: selectedSurah.num,
          to: Math.min(newData[index].to || 1, selectedSurah.ayats),
        };
      }
    } else {
      newData[index] = { ...newData[index], [field]: value };
    }
    setTempGridData(newData);
  };

  const renderGrid = (section: SectionType, title: string) => {
    const isEditing = editingSection === section;
    const data = combinedGridData[section];
    const isDisabled = editingSection !== null && !isEditing;

    return (
      <Card className={isDisabled ? "opacity-50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{title}</CardTitle>
          {!editingSection && (
            <Button
              size="sm"
              onClick={() => handleAddRow(section)}
              disabled={!student}
            >
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Add</span>
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveSection} variant="default">
                <Save className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Save</span>
              </Button>
              <Button size="sm" onClick={handleCancelEdit} variant="outline">
                <X className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Cancel</span>
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.length === 0 && !isEditing ? (
              <p className="text-gray-500 text-center py-4">No data available</p>
            ) : (
              <div className="space-y-3">
                {data.map((entry, index) => {
                  const surah = SURAHS.find((s) => s.num === entry.surahNum);
                  return (
                    <div key={index} className="p-4 border rounded-lg space-y-2 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="font-medium text-blue-800">
                          {surah
                            ? `${surah.name_english} / ${surah.name_arabic}`
                            : entry.surahName}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(entry.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={isDisabled}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">From:</span>{" "}
                          <span className="font-medium">{entry.from}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">To:</span>{" "}
                          <span className="font-medium">{entry.to}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Lines:</span>{" "}
                          <span className="font-medium">{entry.lines}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Iterations:</span>{" "}
                          <span className="font-medium">{entry.iterations}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-600 text-sm">Grade:</span>{" "}
                          <span
                            className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                              entry.grade
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {entry.grade || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {isEditing && tempGridData.length > 0 && (
              <div className="p-3 lg:p-4 border-2 border-blue-500 rounded-lg space-y-2 lg:space-y-3 bg-blue-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">New Entry</span>
                </div>

                <div className="space-y-2 lg:space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Surah *</label>
                    <Select
                      value={tempGridData[0].surahNum?.toString() || ""}
                      onValueChange={(value) => handleRowChange("surahName", value)}
                    >
                      <SelectTrigger className="w-full text-blue-800 font-bold">
                        <SelectValue placeholder="Select surah" />
                      </SelectTrigger>
                      <SelectContent>
                        {SURAHS.map((surah) => (
                          <SelectItem key={surah.num} value={surah.num.toString()}>
                            {surah.name_english} / {surah.name_arabic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 lg:gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">From *</label>
                      <input
                        type="number"
                        min="1"
                        max={SURAHS.find(s => s.num === tempGridData[0].surahNum)?.ayats || 1}
                        value={tempGridData[0].from || 1}
                        onChange={(e) => handleRowChange("from", parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">To *</label>
                      <input
                        type="number"
                        min={tempGridData[0].from || 1}
                        max={SURAHS.find(s => s.num === tempGridData[0].surahNum)?.ayats || 1}
                        value={tempGridData[0].to || 1}
                        onChange={(e) => handleRowChange("to", parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Lines *</label>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={tempGridData[0].lines || 1}
                        onChange={(e) => handleRowChange("lines", parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 lg:gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Iterations *</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={tempGridData[0].iterations || 1}
                      onChange={(e) => handleRowChange("iterations", parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Hifz Grade *</label>
                    <Select
                      value={tempGridData[0].grade || ""}
                      onValueChange={(value) => handleRowChange("grade", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Note (Optional)</label>
                  <input
                    type="text"
                    value={tempGridData[0].note || ""}
                    onChange={(e) => handleRowChange("note", e.target.value)}
                    placeholder="Optional note"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this hifz record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteRcdId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Note</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{selectedNote}</p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hifz Portal</h1>
              <p className="text-gray-600 mt-1">
                Welcome, {user.displayName}
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-sm text-gray-500">Academic Year</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentYear}
              </div>
            </div>
          </div>
        </div>

        <Button onClick={onBack} variant="outline" className="w-full md:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Teacher Hub Portal
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Select Student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Selection Mode
                  </label>
                  <Select value={selectionMode} onValueChange={(value: "studyGroup" | "grade") => setSelectionMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="studyGroup">Study Group</SelectItem>
                      <SelectItem value="grade">Grade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectionMode === "studyGroup" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Study Group
                    </label>
                    <Select value={studyGroup} onValueChange={(value) => {
                      setStudyGroup(value);
                      const selectedGroup = studyGroups.find(sg => sg.id.toString() === value);
                      setStudyGroupId(selectedGroup ? selectedGroup.id : null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select study group" />
                      </SelectTrigger>
                      <SelectContent>
                        {studyGroups.map((sg) => (
                          <SelectItem key={sg.id} value={sg.id.toString()}>
                            {sg.groupname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectionMode === "grade" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Grade
                    </label>
                    <Select value={grade} onValueChange={setGrade}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((g) => (
                          <SelectItem key={g.name} value={g.name}>
                            {g.name} - Building {g.building}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Student</label>
                <Select 
                  value={student} 
                  onValueChange={setStudent}
                  disabled={selectionMode === "studyGroup" ? !studyGroup : !grade || students.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={students.length === 0 && grade ? "No students found" : "Select student"} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((st) => (
                      <SelectItem key={st.studentid} value={st.studentid.toString()}>
                        {st.studentname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {student && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Student Absence
                </CardTitle>
              </CardHeader>
              <CardContent>
                {absenceData ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-yellow-900 mb-2">
                            Absence recorded for this date
                          </div>
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="text-gray-600">Type:</span>{" "}
                              <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                                absenceData.absenceType === "Excused" 
                                  ? "bg-blue-100 text-blue-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {absenceData.absenceType}
                              </span>
                            </div>
                            {absenceData.notes && (
                              <div>
                                <span className="text-gray-600">Notes:</span>{" "}
                                <span className="text-gray-900">{absenceData.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleDeleteAbsence}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
                      <strong>Note:</strong> Regular hifz records cannot be added when an absence is recorded. Delete the absence to add records.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-3">
                      Mark student as absent for this date
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Absence Type *</Label>
                        <RadioGroup value={selectedAbsenceType || ""} onValueChange={(value) => setSelectedAbsenceType(value as "Excused" | "Unexcused")}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Excused" id="excused" />
                            <Label htmlFor="excused" className="cursor-pointer">Excused</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Unexcused" id="unexcused" />
                            <Label htmlFor="unexcused" className="cursor-pointer">Unexcused</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Notes (Optional)</Label>
                        <input
                          type="text"
                          value={absenceNotes}
                          onChange={(e) => setAbsenceNotes(e.target.value)}
                          placeholder="Optional notes"
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <Button
                        onClick={handleSubmitAbsence}
                        disabled={!selectedAbsenceType || isSubmittingAbsence}
                        className="w-full"
                      >
                        {isSubmittingAbsence ? "Submitting..." : "Submit Absence"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {renderGrid("meaning", "Meaning")}
              {renderGrid("memorization", "Memorization")}
              {renderGrid("revision", "Revision")}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>History (Last 5 Entries)</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No history available</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-sm font-medium">Date</th>
                          <th className="text-left p-2 text-sm font-medium">Type</th>
                          <th className="text-left p-2 text-sm font-medium">Surah</th>
                          <th className="text-left p-2 text-sm font-medium">From</th>
                          <th className="text-left p-2 text-sm font-medium">To</th>
                          <th className="text-left p-2 text-sm font-medium">Grade</th>
                          <th className="text-left p-2 text-sm font-medium">Lines</th>
                          <th className="text-left p-2 text-sm font-medium">Teacher</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((entry: any, index: number) => {
                          const prevEntry = index > 0 ? history[index - 1] : null;
                          const isDifferentDate = !prevEntry || entry.lessonDateText !== prevEntry.lessonDateText;
                          const isAbsence = entry.recordType === "Absence";
                          const bgColor = isAbsence
                            ? "bg-yellow-50"
                            : isDifferentDate 
                              ? (index === 0 || (prevEntry && history.findIndex(e => e.lessonDateText === prevEntry.lessonDateText) % 2 === 0)
                                ? "bg-gray-100" 
                                : "bg-white")
                              : (history.findIndex(e => e.lessonDateText === entry.lessonDateText) % 2 === 0
                                ? "bg-gray-100"
                                : "bg-white");
                          
                          return (
                            <tr key={index} className={`border-b hover:opacity-80 ${bgColor}`}>
                              <td className="p-2 text-sm">{formatHistoryDate(entry.lessonDateText)}</td>
                              <td className="p-2 text-sm">
                                <div className="flex items-center gap-1">
                                  {isAbsence && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                                  <span className="capitalize">{entry.recordType || ''}</span>
                                </div>
                              </td>
                              <td className="p-2 text-sm">{entry.surah || ''}</td>
                              <td className="p-2 text-sm">{entry.from || ''}</td>
                              <td className="p-2 text-sm">{entry.to || ''}</td>
                              <td className="p-2">
                                <span className={`text-sm font-medium px-2 py-1 rounded ${
                                  isAbsence
                                    ? entry.hifzGrade === "Excused"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}>
                                  {entry.hifzGrade || ''}
                                </span>
                              </td>
                              <td className="p-2 text-sm">{entry.lines || ''}</td>
                              <td className="p-2 text-sm">{entry.teacherId || ''}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
    </>
  );
}
