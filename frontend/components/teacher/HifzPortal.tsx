import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, X, Plus, Trash2, MessageSquare, LayoutGrid, List } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    
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
  const [savedRows, setSavedRows] = useState<Set<number>>(new Set());
  const [savingRows, setSavingRows] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<HifzHistoryEntry[]>([]);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
        prevRowsCount: "5",
      };
      console.log("DEBUG: Payload being sent to getHistoryByStudentId:", JSON.stringify(payload));
      const response = await backend.hifz.getHistoryByStudentId(payload);
      console.log("DEBUG: Response received:", response);
      setHistory(response.history);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const handleEditSection = (section: SectionType) => {
    if (editingSection) return;
    setEditingSection(section);
    setTempGridData([...gridData[section]]);
    setSavedRows(new Set());
    setSavingRows(new Set());
  };

  const handleSaveSection = async () => {
    if (!editingSection) return;

    for (let i = 0; i < tempGridData.length; i++) {
      const entry = tempGridData[i];

      if ((entry.from ?? 1) > (entry.to ?? 1)) {
        toast({
          title: "Validation Error",
          description: `Row ${i + 1}: "From" value cannot be greater than "To" value`,
          variant: "destructive",
        });
        return;
      }
    }

    const newSavingRows = new Set<number>();
    let savedCount = 0;

    for (let i = 0; i < tempGridData.length; i++) {
      if (savedRows.has(i)) continue;

      const entry = tempGridData[i];
      newSavingRows.add(i);
      setSavingRows(new Set(newSavingRows));

      const recordType = 
        editingSection === "meaning" ? "Meaning" :
        editingSection === "memorization" ? "Memorization" : "Revision";

      try {
        await backend.hifz.insertStudentHifz({
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

        savedCount++;
        setSavedRows(prev => new Set(prev).add(i));
        newSavingRows.delete(i);
        setSavingRows(new Set(newSavingRows));
      } catch (error) {
        console.error(`Failed to save row ${i + 1}:`, error);
        newSavingRows.delete(i);
        setSavingRows(new Set(newSavingRows));
        toast({
          title: "Error",
          description: `Failed to save row ${i + 1}`,
          variant: "destructive",
        });
        return;
      }
    }

    if (savedCount > 0) {
      toast({
        title: "Success",
        description: `${savedCount} row(s) saved successfully`,
      });
      await fetchHistory();
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setTempGridData([]);
  };

  const handleAddRow = () => {
    const usedSurahs = new Set(tempGridData.map(entry => entry.surahNum).filter(Boolean));
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
    
    if (editingSection && history.length > 0) {
      const recordTypeMap = {
        "meaning": "Meaning",
        "memorization": "Memorization",
        "revision": "Revision"
      };
      const targetType = recordTypeMap[editingSection];
      
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
    
    setTempGridData([
      ...tempGridData,
      { 
        surahName: defaultSurahName, 
        surahNum: defaultSurahNum,
        from: 1, 
        to: 1, 
        grade: "", 
        lines: 1, 
        iterations: 1, 
        note: "" 
      },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    setTempGridData(tempGridData.filter((_, i) => i !== index));
    const newSavedRows = new Set(savedRows);
    const newSavingRows = new Set(savingRows);
    
    newSavedRows.delete(index);
    newSavingRows.delete(index);
    
    const updatedSavedRows = new Set<number>();
    const updatedSavingRows = new Set<number>();
    
    newSavedRows.forEach(rowIndex => {
      if (rowIndex > index) {
        updatedSavedRows.add(rowIndex - 1);
      } else {
        updatedSavedRows.add(rowIndex);
      }
    });
    
    newSavingRows.forEach(rowIndex => {
      if (rowIndex > index) {
        updatedSavingRows.add(rowIndex - 1);
      } else {
        updatedSavingRows.add(rowIndex);
      }
    });
    
    setSavedRows(updatedSavedRows);
    setSavingRows(updatedSavingRows);
  };

  const handleRowChange = (index: number, field: keyof HifzEntry, value: any) => {
    const newData = [...tempGridData];
    if (field === "surahName") {
      const selectedSurahNum = parseInt(value);
      const isAlreadyUsed = tempGridData.some((entry, idx) => idx !== index && entry.surahNum === selectedSurahNum);
      
      if (isAlreadyUsed) {
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
    const data = isEditing ? tempGridData : gridData[section];
    const isDisabled = editingSection !== null && !isEditing;

    return (
      <Card className={isDisabled ? "opacity-50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{title}</CardTitle>
          {!isEditing && !editingSection && (
            <Button
              size="sm"
              onClick={() => handleEditSection(section)}
              disabled={!student}
            >
              Edit
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddRow} variant="outline">
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Add Row</span>
              </Button>
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
          {isEditing ? (
            viewMode === "list" ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-sm font-medium">#</th>
                      <th className="text-left p-2 text-sm font-medium">Status</th>
                      <th className="text-left p-2 text-sm font-medium">Surah</th>
                      <th className="text-left p-2 text-sm font-medium">From</th>
                      <th className="text-left p-2 text-sm font-medium">To</th>
                      <th className="text-left p-2 text-sm font-medium">Grade</th>
                      <th className="text-left p-2 text-sm font-medium">Lines</th>
                      <th className="text-left p-2 text-sm font-medium">Iterations</th>
                      <th className="text-left p-2 text-sm font-medium">Note</th>
                      <th className="text-left p-2 text-sm font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((entry, index) => {
                      const selectedSurah = SURAHS.find((s) => s.num === entry.surahNum);
                      const maxAyats = selectedSurah?.ayats || 1;
                      const isSaved = savedRows.has(index);
                      const isSaving = savingRows.has(index);
                      return (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2 text-sm">{index + 1}</td>
                          <td className="p-2">
                            {isSaving ? (
                              <span className="text-xs text-gray-500">Saving...</span>
                            ) : isSaved ? (
                              <span className="text-green-600">✓</span>
                            ) : null}
                          </td>
                          <td className="p-2">
                            <Select
                              value={entry.surahNum?.toString() || ""}
                              onValueChange={(value) => handleRowChange(index, "surahName", value)}
                              disabled={isSaved}
                            >
                              <SelectTrigger className="w-full min-w-[200px] text-blue-800 font-bold">
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
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              max={maxAyats}
                              value={entry.from || 1}
                              onChange={(e) => handleRowChange(index, "from", parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 border rounded"
                              disabled={isSaved}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min={entry.from || 1}
                              max={maxAyats}
                              value={entry.to || 1}
                              onChange={(e) => handleRowChange(index, "to", parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 border rounded"
                              disabled={isSaved}
                            />
                          </td>
                          <td className="p-2">
                            <Select
                              value={entry.grade || "none"}
                              onValueChange={(value) => handleRowChange(index, "grade", value === "none" ? "" : value)}
                              disabled={isSaved}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue placeholder="Grade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {GRADES.map((g) => (
                                  <SelectItem key={g} value={g}>
                                    {g}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              max="40"
                              value={entry.lines || 1}
                              onChange={(e) => handleRowChange(index, "lines", parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 border rounded"
                              disabled={isSaved}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={entry.iterations || 1}
                              onChange={(e) => handleRowChange(index, "iterations", parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 border rounded"
                              disabled={isSaved}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={entry.note || ""}
                              onChange={(e) => handleRowChange(index, "note", e.target.value)}
                              placeholder="Optional"
                              className="w-32 px-2 py-1 border rounded"
                              disabled={isSaved}
                            />
                          </td>
                          <td className="p-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRow(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-4">
              {data.map((entry, index) => {
                const selectedSurah = SURAHS.find(
                  (s) => s.num === entry.surahNum
                );
                const maxAyats = selectedSurah?.ayats || 1;
                const isSaved = savedRows.has(index);
                const isSaving = savingRows.has(index);

                return (
                  <div key={index} className="p-3 lg:p-4 border rounded-lg space-y-2 lg:space-y-3 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Entry {index + 1}</span>
                        {isSaving && <span className="text-xs text-gray-500">Saving...</span>}
                        {isSaved && <span className="text-green-600">✓ Saved</span>}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRow(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 lg:space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Surah</label>
                        <Select
                          value={entry.surahNum?.toString() || ""}
                          onValueChange={(value) =>
                            handleRowChange(index, "surahName", value)
                          }
                          disabled={isSaved}
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
                          <label className="text-xs font-medium text-gray-700">From</label>
                          <input
                            type="number"
                            min="1"
                            max={maxAyats}
                            value={entry.from || 1}
                            onChange={(e) =>
                              handleRowChange(index, "from", parseInt(e.target.value) || 1)
                            }
                            className="w-full px-3 py-2 border rounded"
                            disabled={isSaved}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700">To</label>
                          <input
                            type="number"
                            min={entry.from || 1}
                            max={maxAyats}
                            value={entry.to || 1}
                            onChange={(e) =>
                              handleRowChange(index, "to", parseInt(e.target.value) || 1)
                            }
                            className="w-full px-3 py-2 border rounded"
                            disabled={isSaved}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700">Lines</label>
                          <input
                            type="number"
                            min="1"
                            max="40"
                            value={entry.lines || 1}
                            onChange={(e) =>
                              handleRowChange(index, "lines", parseInt(e.target.value) || 1)
                            }
                            className="w-full px-3 py-2 border rounded"
                            disabled={isSaved}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 lg:gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Iterations</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={entry.iterations || 1}
                          onChange={(e) =>
                            handleRowChange(index, "iterations", parseInt(e.target.value) || 1)
                          }
                          className="w-full px-3 py-2 border rounded"
                          disabled={isSaved}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Hifz Grade</label>
                        <Select
                          value={entry.grade || "none"}
                          onValueChange={(value) =>
                            handleRowChange(
                              index,
                              "grade",
                              value === "none" ? "" : value
                            )
                          }
                          disabled={isSaved}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Grade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
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
                        value={entry.note || ""}
                        onChange={(e) =>
                          handleRowChange(index, "note", e.target.value)
                        }
                        placeholder="Optional note"
                        className="w-full px-3 py-2 border rounded"
                        disabled={isSaved}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            )
          ) : (
            <div className="space-y-2">
              {data.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data available</p>
              ) : (
                <div className="space-y-3">
                  {data.map((entry, index) => {
                    const surah = SURAHS.find((s) => s.num === entry.surahNum);
                    return (
                      <div key={index} className="p-4 border rounded-lg space-y-2 bg-gray-50">
                        <div className="font-medium text-blue-800">
                          {surah
                            ? `${surah.name_english} / ${surah.name_arabic}`
                            : entry.surahName}
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
                          {entry.note && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedNote(entry.note || "");
                                setNoteDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
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
            <div className="flex justify-end mb-4">
              <div className="flex gap-2 bg-white rounded-lg border p-1">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  onClick={() => setViewMode("grid")}
                  className="gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Grid
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  onClick={() => setViewMode("list")}
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  List
                </Button>
              </div>
            </div>
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
                          const bgColor = isDifferentDate 
                            ? (index === 0 || (prevEntry && history.findIndex(e => e.lessonDateText === prevEntry.lessonDateText) % 2 === 0)
                              ? "bg-gray-100" 
                              : "bg-white")
                            : (history.findIndex(e => e.lessonDateText === entry.lessonDateText) % 2 === 0
                              ? "bg-gray-100"
                              : "bg-white");
                          
                          return (
                            <tr key={index} className={`border-b hover:opacity-80 ${bgColor}`}>
                              <td className="p-2 text-sm">{formatHistoryDate(entry.lessonDateText)}</td>
                              <td className="p-2 text-sm capitalize">{entry.recordType || ''}</td>
                              <td className="p-2 text-sm">{entry.surah || ''}</td>
                              <td className="p-2 text-sm">{entry.from || ''}</td>
                              <td className="p-2 text-sm">{entry.to || ''}</td>
                              <td className="p-2">
                                <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
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
