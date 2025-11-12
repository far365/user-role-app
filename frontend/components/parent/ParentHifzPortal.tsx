import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Grid3x3, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import backend from "~backend/client";
import type { User as UserType } from "~backend/user/types";

interface ParentHifzPortalProps {
  user: UserType;
  onBack: () => void;
}

interface Student {
  studentId: string;
  studentName: string;
  grade: string;
}

interface HifzHistoryEntry {
  lessonDateText: string;
  recordType: string;
  surah: string;
  from: number;
  to: number;
  hifzGrade: string;
  lines: number;
  teacherId: string;
}

interface ProgressStats {
  memorization: number;
  revision: number;
  meaning: number;
  memorizationHistory: number[];
  revisionHistory: number[];
  meaningHistory: number[];
}

const SURAHS = [
  "Al-Fatihah", "Al-Baqarah", "Aali Imran", "An-Nisa", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal",
  "At-Tawbah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra", "Al-Kahf",
  "Maryam", "Ta-Ha", "Al-Anbiya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara",
  "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab", "Saba", "Fatir",
  "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir", "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan",
  "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat", "At-Tur",
  "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadila", "Al-Hashr",
  "Al-Mumtahanah", "As-Saf", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim",
  "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir",
  "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa", "At-Takwir", "Al-Infitar",
  "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad",
  "Ash-Shams", "Al-Layl", "Ad-Duhaa", "Ash-Sharh", "At-Tin", "Al-Alaq", "Al-Qadr", "Al-Bayyinah",
  "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraysh",
  "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

export function ParentHifzPortal({ user, onBack }: ParentHifzPortalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [hifzHistory, setHifzHistory] = useState<HifzHistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HifzHistoryEntry[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    memorization: 0,
    revision: 0,
    meaning: 0,
    memorizationHistory: [],
    revisionHistory: [],
    meaningHistory: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedSurah, setSelectedSurah] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const { toast } = useToast();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const parentInfo = await backend.parent.getParentInfo({ username: user.loginID });
        const studentsResp = await backend.student.getStudentsByParentID({ parentId: parentInfo.parentID });
        
        setStudents(studentsResp.students.map(s => ({
          studentId: s.studentid,
          studentName: s.studentname,
          grade: s.grade
        })));
      } catch (error) {
        console.error("Failed to fetch students:", error);
        toast({
          title: "Error",
          description: "Failed to load student information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [user.loginID, toast]);

  useEffect(() => {
    if (!selectedStudent) {
      setHifzHistory([]);
      return;
    }

    const fetchHifzHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const response = await backend.hifz.getHistoryByStudentId({
          studentId: selectedStudent,
          prevRowsCount: "50"
        });
        setHifzHistory(response.history);
        setFilteredHistory(response.history);
        
        const totalLines = 6236;
        let memTotal = 0;
        let revTotal = 0;
        let meanTotal = 0;
        const memHist: number[] = [];
        const revHist: number[] = [];
        const meanHist: number[] = [];
        
        response.history.forEach((entry) => {
          const lines = entry.lines || 0;
          const type = entry.recordType?.toLowerCase() || '';
          
          if (type === 'memorization') {
            memTotal += lines;
            memHist.push(lines);
          } else if (type === 'revision') {
            revTotal += lines;
            revHist.push(lines);
          } else if (type === 'meaning') {
            meanTotal += lines;
            meanHist.push(lines);
          }
        });
        
        setProgressStats({
          memorization: Math.round((memTotal / totalLines) * 100),
          revision: Math.round((revTotal / totalLines) * 100),
          meaning: Math.round((meanTotal / totalLines) * 100),
          memorizationHistory: memHist.slice(0, 15).reverse(),
          revisionHistory: revHist.slice(0, 15).reverse(),
          meaningHistory: meanHist.slice(0, 15).reverse()
        });
      } catch (error) {
        console.error("Failed to fetch hifz history:", error);
        toast({
          title: "Error",
          description: "Failed to load hifz history",
          variant: "destructive",
        });
        setHifzHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHifzHistory();
  }, [selectedStudent, toast]);

  const handleFilterSubmit = () => {
    let filtered = [...hifzHistory];

    if (startDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.lessonDateText);
        return entryDate >= startDate;
      });
    }

    if (endDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.lessonDateText);
        return entryDate <= endDate;
      });
    }

    if (selectedSurah) {
      filtered = filtered.filter(entry => entry.surah === selectedSurah);
    }

    setFilteredHistory(filtered);
    toast({
      title: "Filters Applied",
      description: `Showing ${filtered.length} of ${hifzHistory.length} records`,
    });
  };

  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedSurah("");
    setFilteredHistory(hifzHistory);
  };

  const formatDate = (dateStr: string | null | undefined): string => {
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
  };



  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            Active
          </Badge>
          <span className="text-sm text-gray-600">
            Last Login: {new Date(user.lastLoginDTTM || '').toLocaleString()}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Parent Hifz Portal</h3>
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Parent Hub
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Selection</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-gray-600">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="text-sm text-gray-600">No students found</div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.studentId} value={s.studentId}>
                        {s.studentName} ({s.grade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedStudent && (
                <div className="text-sm text-gray-600 whitespace-nowrap">
                  Target Graduation: Dec 2026
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStudent && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <ProgressCircle
                  label="Memorization"
                  percentage={progressStats.memorization}
                  color="text-green-600"
                  bgColor="stroke-green-600"
                  history={progressStats.memorizationHistory}
                  historyColor="bg-green-500"
                />
                <ProgressCircle
                  label="Revision"
                  percentage={progressStats.revision}
                  color="text-orange-600"
                  bgColor="stroke-orange-600"
                  history={progressStats.revisionHistory}
                  historyColor="bg-orange-500"
                />
                <ProgressCircle
                  label="Meaning"
                  percentage={progressStats.meaning}
                  color="text-yellow-600"
                  bgColor="stroke-yellow-600"
                  history={progressStats.meaningHistory}
                  historyColor="bg-yellow-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hifz History</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4 mr-1" />
                    List
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3x3 className="w-4 h-4 mr-1" />
                    Grid
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Surah</Label>
                    <Select value={selectedSurah} onValueChange={setSelectedSurah}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Surah" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Surahs</SelectItem>
                        {SURAHS.map((surah, idx) => (
                          <SelectItem key={idx} value={surah}>
                            {surah}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3 flex gap-2">
                    <Button onClick={handleFilterSubmit} className="flex-1">
                      Submit
                    </Button>
                    <Button onClick={handleClearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  </div>
                </div>

                {isLoadingHistory ? (
                  <div className="text-sm text-gray-600">Loading hifz history...</div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-sm text-gray-600">No hifz history found</div>
                ) : viewMode === "list" ? (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full border-collapse hidden md:table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-sm font-medium">Date</th>
                      <th className="text-left p-2 text-sm font-medium">Type</th>
                      <th className="text-left p-2 text-sm font-medium">Surah</th>
                      <th className="text-left p-2 text-sm font-medium">From</th>
                      <th className="text-left p-2 text-sm font-medium">To</th>
                      <th className="text-left p-2 text-sm font-medium">Lines</th>
                      <th className="text-left p-2 text-sm font-medium">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const dateColorMap = new Map<string, string>();
                      let colorToggle = true;
                      let lastDate = '';
                      
                      filteredHistory.forEach((entry) => {
                        if (entry.lessonDateText !== lastDate) {
                          colorToggle = !colorToggle;
                          lastDate = entry.lessonDateText;
                        }
                        dateColorMap.set(entry.lessonDateText, colorToggle ? "bg-gray-100" : "bg-white");
                      });
                      
                      return filteredHistory.map((entry, index) => (
                        <tr key={index} className={`border-b hover:opacity-80 ${dateColorMap.get(entry.lessonDateText)}`}>
                          <td className="p-2 text-sm">{formatDate(entry.lessonDateText)}</td>
                          <td className="p-2 text-sm capitalize">{entry.recordType || ''}</td>
                          <td className="p-2 text-sm">{entry.surah || ''}</td>
                          <td className="p-2 text-sm">{entry.from || ''}</td>
                          <td className="p-2 text-sm">{entry.to || ''}</td>
                          <td className="p-2 text-sm">{entry.lines || ''}</td>
                          <td className="p-2">
                            <span className="inline-flex items-center gap-1 text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {entry.hifzGrade || ''}
                              {entry.hifzGrade?.toUpperCase() === 'A' && (
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              )}
                            </span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
                
                <div className="md:hidden overflow-x-auto">
                  <table className="w-full border-collapse min-w-max">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 text-xs font-medium whitespace-nowrap">Date</th>
                        <th className="text-left p-2 text-xs font-medium whitespace-nowrap">Type</th>
                        <th className="text-left p-2 text-xs font-medium whitespace-nowrap">Surah</th>
                        <th className="text-left p-2 text-xs font-medium whitespace-nowrap">From</th>
                        <th className="text-left p-2 text-xs font-medium whitespace-nowrap">To</th>
                        <th className="text-left p-2 text-xs font-medium whitespace-nowrap">Lines</th>
                        <th className="text-left p-2 text-xs font-medium whitespace-nowrap">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const dateColorMap = new Map<string, string>();
                        let colorToggle = true;
                        let lastDate = '';
                        
                        filteredHistory.forEach((entry) => {
                          if (entry.lessonDateText !== lastDate) {
                            colorToggle = !colorToggle;
                            lastDate = entry.lessonDateText;
                          }
                          dateColorMap.set(entry.lessonDateText, colorToggle ? "bg-gray-100" : "bg-white");
                        });
                        
                        return filteredHistory.map((entry, index) => (
                          <tr key={index} className={`border-b hover:opacity-80 ${dateColorMap.get(entry.lessonDateText)}`}>
                            <td className="p-2 text-xs whitespace-nowrap">{formatDate(entry.lessonDateText)}</td>
                            <td className="p-2 text-xs capitalize whitespace-nowrap">{entry.recordType || ''}</td>
                            <td className="p-2 text-xs whitespace-nowrap">{entry.surah || ''}</td>
                            <td className="p-2 text-xs whitespace-nowrap">{entry.from || ''}</td>
                            <td className="p-2 text-xs whitespace-nowrap">{entry.to || ''}</td>
                            <td className="p-2 text-xs whitespace-nowrap">{entry.lines || ''}</td>
                            <td className="p-2">
                              <span className="inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded whitespace-nowrap">
                                {entry.hifzGrade || ''}
                                {entry.hifzGrade?.toUpperCase() === 'A' && (
                                  <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                                )}
                              </span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                    {(() => {
                      const dateColorMap = new Map<string, string>();
                      let colorToggle = true;
                      let lastDate = '';
                      
                      filteredHistory.forEach((entry) => {
                        if (entry.lessonDateText !== lastDate) {
                          colorToggle = !colorToggle;
                          lastDate = entry.lessonDateText;
                        }
                        dateColorMap.set(entry.lessonDateText, colorToggle ? "bg-gray-50" : "bg-white");
                      });
                      
                      return filteredHistory.map((entry, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${dateColorMap.get(entry.lessonDateText)}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-xs font-medium text-gray-600">{formatDate(entry.lessonDateText)}</div>
                            <span className="inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                              {entry.hifzGrade || ''}
                              {entry.hifzGrade?.toUpperCase() === 'A' && (
                                <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                              )}
                            </span>
                          </div>
                          <div className="text-sm capitalize text-gray-700 mb-1 font-medium">{entry.recordType || ''}</div>
                          <div className="text-sm font-semibold mb-2">{entry.surah || ''}</div>
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>From: {entry.from || ''}</span>
                            <span>To: {entry.to || ''}</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            Lines: {entry.lines || ''}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

interface ProgressCircleProps {
  label: string;
  percentage: number;
  color: string;
  bgColor: string;
  history: number[];
  historyColor: string;
}

function ProgressCircle({ label, percentage, color, bgColor, history, historyColor }: ProgressCircleProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const maxHistory = Math.max(...history, 1);

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className={bgColor}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{percentage}%</span>
        </div>
      </div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="flex items-end justify-center space-x-1 h-12 w-full px-2">
        {history.length > 0 ? (
          history.map((value, index) => {
            const height = Math.max((value / maxHistory) * 100, 5);
            return (
              <div
                key={index}
                className={`flex-1 ${historyColor} rounded-sm opacity-70`}
                style={{ height: `${height}%` }}
                title={`${value} lines`}
              />
            );
          })
        ) : (
          <div className="text-xs text-gray-400">No data</div>
        )}
      </div>
    </div>
  );
}
