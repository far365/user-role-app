import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, X, Plus, Trash2, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { User as UserType } from "~backend/user/types";
import type { HifzGrade, HifzEntry, HifzGridData, HifzHistoryEntry, SurahSetup } from "~backend/hifz/types";
import type { Grade } from "~backend/grades/types";
import { SURAHS } from "~backend/hifz/surah_data";

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
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const yearResp = await backend.academic.getCurrentYear();
        setCurrentYear(yearResp.ayid);
        const gradesResp = await backend.grades.list();
        setGrades(gradesResp.grades);
        const studyGroupsResp = await backend.hifz.getGroupsByCategory({ category: "Study Group" });
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
      }
    };
    fetchStudents();
  }, [grade, selectionMode, toast]);

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
      const response = await backend.hifz.getHistory({
        studyGroupId: studyGroup,
        studentId: student,
      });
      setHistory(response.history);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const handleEditSection = (section: SectionType) => {
    if (editingSection) return;
    setEditingSection(section);
    setTempGridData([...gridData[section]]);
  };

  const handleSaveSection = async () => {
    if (!editingSection) return;

    for (let i = 0; i < tempGridData.length; i++) {
      const entry = tempGridData[i];
      
      if (!entry.grade) {
        toast({
          title: "Validation Error",
          description: `Row ${i + 1}: Please select a grade`,
          variant: "destructive",
        });
        return;
      }

      if (entry.from > entry.to) {
        toast({
          title: "Validation Error",
          description: `Row ${i + 1}: "From" value cannot be greater than "To" value`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      await backend.hifz.saveData({
        studyGroupId: studyGroup,
        studentId: student,
        date: selectedDate,
        section: editingSection,
        entries: tempGridData,
      });

      setGridData({
        ...gridData,
        [editingSection]: tempGridData,
      });

      setEditingSection(null);
      setTempGridData([]);
      await fetchHistory();

      toast({
        title: "Success",
        description: "Data saved successfully",
      });
    } catch (error) {
      console.error("Failed to save data:", error);
      toast({
        title: "Error",
        description: "Failed to save data",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setTempGridData([]);
  };

  const handleAddRow = () => {
    setTempGridData([
      ...tempGridData,
      { surahName: "", from: 1, to: 1, grade: "", lines: 1, iterations: 1, note: "" },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    setTempGridData(tempGridData.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof HifzEntry, value: any) => {
    const newData = [...tempGridData];
    if (field === "surahName") {
      const selectedSurah = SURAHS.find((s) => s.num === parseInt(value));
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
              disabled={!studyGroup || !student}
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
            <div className="space-y-4">
              {data.map((entry, index) => {
                const selectedSurah = SURAHS.find(
                  (s) => s.num === entry.surahNum
                );
                const maxAyats = selectedSurah?.ayats || 1;

                return (
                  <div key={index} className="p-4 border rounded-lg space-y-3 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Entry {index + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRow(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700">Surah</label>
                      <Select
                        value={entry.surahNum?.toString() || ""}
                        onValueChange={(value) =>
                          handleRowChange(index, "surahName", value)
                        }
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
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
                        />
                      </div>
                      <div className="space-y-2">
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
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
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
                        />
                      </div>
                      <div className="space-y-2">
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
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700">Note (Optional)</label>
                      <input
                        type="text"
                        value={entry.note || ""}
                        onChange={(e) =>
                          handleRowChange(index, "note", e.target.value)
                        }
                        placeholder="Optional note"
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
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
                    <Select value={studyGroup} onValueChange={setStudyGroup}>
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
                    {selectionMode === "studyGroup" ? (
                      studyGroups.length > 0 ? (
                        <SelectItem value="placeholder" disabled>
                          Study group students coming soon
                        </SelectItem>
                      ) : null
                    ) : (
                      students.map((st) => (
                        <SelectItem key={st.studentid} value={st.studentid.toString()}>
                          {st.studentname}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {student && (
          <>
            <div className="space-y-6">
              {renderGrid("meaning", "Meaning")}
              {renderGrid("memorization", "Memorization")}
              {renderGrid("revision", "Revision")}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>History (Last 5 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No history available</p>
                ) : (
                  <div className="space-y-2">
                    {history.slice(0, 5).map((entry, index) => (
                      <div
                        key={index}
                        className="flex flex-col md:flex-row md:items-center md:justify-between p-3 bg-gray-50 rounded-lg gap-2"
                      >
                        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                          <span className="text-sm font-medium text-gray-700">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                          <span className="text-sm text-gray-600 capitalize">
                            {entry.section}
                          </span>
                          <span className="text-sm text-gray-600">
                            {entry.surahName}
                          </span>
                        </div>
                        <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded self-start md:self-auto">
                          {entry.grade}
                        </span>
                      </div>
                    ))}
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
