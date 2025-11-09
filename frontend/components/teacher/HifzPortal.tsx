import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { User as UserType } from "~backend/user/types";
import type { HifzGrade, HifzEntry, HifzGridData, HifzHistoryEntry } from "~backend/hifz/types";

interface HifzPortalProps {
  user: UserType;
  onBack: () => void;
}

const STUDY_GROUPS = [
  { id: "sg1", name: "Study Group 1" },
  { id: "sg2", name: "Study Group 2" },
  { id: "sg3", name: "Study Group 3" },
];

const STUDENTS = [
  { id: "st1", name: "Student 1" },
  { id: "st2", name: "Student 2" },
  { id: "st3", name: "Student 3" },
];

const SURAHS = [
  "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa", "Al-Ma'idah",
  "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus",
];

const GRADES: HifzGrade[] = ["A+", "A", "B+", "B", "C"];

type SectionType = "meaning" | "memorization" | "revision";

export function HifzPortal({ user, onBack }: HifzPortalProps) {
  const [currentYear, setCurrentYear] = useState<string>("");
  const [studyGroup, setStudyGroup] = useState<string>("");
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
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const yearResp = await backend.academic.getCurrentYear();
        setCurrentYear(yearResp.ayid);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (studyGroup && student && selectedDate) {
      fetchHifzData();
      fetchHistory();
    }
  }, [studyGroup, student, selectedDate]);

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

  const handleGradeChange = (index: number, grade: HifzGrade) => {
    const newData = [...tempGridData];
    if (!newData[index]) {
      newData[index] = { surahName: SURAHS[index] || "", grade };
    } else {
      newData[index].grade = grade;
    }
    setTempGridData(newData);
  };

  const renderGrid = (section: SectionType, title: string) => {
    const isEditing = editingSection === section;
    const data = isEditing ? tempGridData : gridData[section];
    const isDisabled = editingSection !== null && !isEditing;

    return (
      <Card className={isDisabled ? "opacity-50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between">
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
              <Button size="sm" onClick={handleSaveSection} variant="default">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button size="sm" onClick={handleCancelEdit} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SURAHS.map((surah, index) => {
              const entry = data.find((e) => e.surahName === surah);
              const grade = entry?.grade || "";

              return (
                <div key={surah} className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{surah}</span>
                  {isEditing ? (
                    <Select
                      value={grade || "none"}
                      onValueChange={(value) =>
                        handleGradeChange(index, value === "none" ? "" : (value as HifzGrade))
                      }
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
                  ) : (
                    <div className="w-24 text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                          grade
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {grade || "-"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hifz Portal</h1>
              <p className="text-gray-600 mt-1">
                Welcome, {user.displayName}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Academic Year</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentYear}
              </div>
            </div>
          </div>
        </div>

        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Teacher Hub Portal
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Select Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Study Group
                </label>
                <Select value={studyGroup} onValueChange={setStudyGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select study group" />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDY_GROUPS.map((sg) => (
                      <SelectItem key={sg.id} value={sg.id}>
                        {sg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Student</label>
                <Select value={student} onValueChange={setStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDENTS.map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
          </CardContent>
        </Card>

        {studyGroup && student && (
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
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex gap-4">
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
                        <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded">
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
  );
}
