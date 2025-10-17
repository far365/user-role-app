import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Search, Edit, User, AlertCircle, Bug, GraduationCap, Building, FileText, StickyNote, Users, Phone } from "lucide-react";
import { StudentEditDialog } from "./StudentEditDialog";
import { StudentQRCodeGenerator } from "../StudentQRCodeGenerator";
import backend from "~backend/client";
import type { Student } from "~backend/student/types";
import type { Parent } from "~backend/parent/types";

interface StudentSetupPageProps {
  onBack: () => void;
}

interface StudentWithParent extends Student {
  parentInfo?: Parent;
  isLoadingParent?: boolean;
  parentError?: string;
}

export function StudentSetupPage({ onBack }: StudentSetupPageProps) {
  const [searchResults, setSearchResults] = useState<StudentWithParent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  // Single search input
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();

  const handleAddStudent = () => {
    toast({
      title: "Add Student",
      description: "Code to be added later",
    });
  };

  const handleDebugSearch = async () => {
    try {
      console.log("=== DEBUG: Testing backend connection ===");
      
      // Test if we can reach the backend at all
      const testResponse = await backend.user.list();
      console.log("Backend connection test successful:", testResponse);
      
      // Try to get all student records to see what's in the database
      const allStudentsResponse = await fetch('/api/student/search/name?name=a', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (allStudentsResponse.ok) {
        const allStudentsData = await allStudentsResponse.json();
        console.log("All students search result:", allStudentsData);
        setDebugInfo(`Backend connection: OK\nStudents found with 'a': ${allStudentsData.students?.length || 0}\nFirst few results: ${JSON.stringify(allStudentsData.students?.slice(0, 3), null, 2)}`);
      } else {
        const errorText = await allStudentsResponse.text();
        console.error("Debug search failed:", errorText);
        setDebugInfo(`Backend connection: FAILED\nStatus: ${allStudentsResponse.status}\nError: ${errorText}`);
      }
      
      toast({
        title: "Debug Complete",
        description: "Check console and debug info below for details",
      });
    } catch (error) {
      console.error("Debug error:", error);
      setDebugInfo(`Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Debug Failed",
        description: "Check console for error details",
        variant: "destructive",
      });
    }
  };

  const fetchParentForStudent = async (student: StudentWithParent) => {
    if (!student.parentId) {
      // Update the student to show no parent
      setSearchResults(prev => 
        prev.map(s => 
          s.studentId === student.studentId 
            ? { ...s, parentInfo: undefined, isLoadingParent: false, parentError: "No parent assigned" }
            : s
        )
      );
      return;
    }

    try {
      // Update the student to show loading state
      setSearchResults(prev => 
        prev.map(s => 
          s.studentId === student.studentId 
            ? { ...s, isLoadingParent: true, parentError: undefined }
            : s
        )
      );

      console.log(`Fetching parent for student ${student.studentId}, parent ID: ${student.parentId}`);
      const response = await backend.parent.getByUsername({ username: student.parentId });
      
      // Update the student with parent data
      setSearchResults(prev => 
        prev.map(s => 
          s.studentId === student.studentId 
            ? { ...s, parentInfo: response.parent, isLoadingParent: false, parentError: undefined }
            : s
        )
      );

      console.log(`Found parent ${response.parent.parentName} for student ${student.studentId}`);
    } catch (error) {
      console.error(`Failed to fetch parent for student ${student.studentId}:`, error);
      
      // Update the student with error state
      setSearchResults(prev => 
        prev.map(s => 
          s.studentId === student.studentId 
            ? { 
                ...s, 
                parentInfo: undefined, 
                isLoadingParent: false, 
                parentError: error instanceof Error ? error.message : 'Failed to load parent'
              }
            : s
        )
      );
    }
  };

  const performSearch = async (type: 'name' | 'id' | 'grade') => {
    const trimmedTerm = searchTerm.trim();
    
    // Validation based on search type
    if (type === 'name' && trimmedTerm.length < 3) {
      toast({
        title: "Invalid Search",
        description: "Name must be at least 3 characters long",
        variant: "destructive",
      });
      return;
    }

    if (type === 'id' && trimmedTerm.length === 0) {
      toast({
        title: "Invalid Search",
        description: "Student ID is required",
        variant: "destructive",
      });
      return;
    }

    if (type === 'grade' && trimmedTerm.length === 0) {
      toast({
        title: "Invalid Search",
        description: "Grade is required",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchType(type);
    setDebugInfo("");
    
    try {
      console.log(`=== SEARCH DEBUG (${type.toUpperCase()}) ===`);
      console.log("Searching for:", trimmedTerm);
      
      let response;
      
      switch (type) {
        case 'name':
          response = await backend.student.searchByName({ name: trimmedTerm });
          break;
        case 'id':
          response = await backend.student.searchById({ studentId: trimmedTerm });
          break;
        case 'grade':
          response = await backend.student.searchByGrade({ grade: trimmedTerm });
          break;
        default:
          throw new Error("Invalid search type");
      }
      
      console.log("Search response:", response);
      
      // Convert students to StudentWithParent and fetch parent info for each
      const studentsWithParents: StudentWithParent[] = response.students.map(student => ({
        ...student,
        parentInfo: undefined,
        isLoadingParent: false,
        parentError: undefined
      }));
      
      setSearchResults(studentsWithParents);
      setSelectedStudent(null);
      
      // Automatically fetch parent info for each student
      studentsWithParents.forEach(student => {
        fetchParentForStudent(student);
      });
      
      const searchTypeLabel = type === 'name' ? 'name' : type === 'id' ? 'student ID' : 'grade';
      toast({
        title: "Search Complete",
        description: `Found ${response.students?.length || 0} student(s) matching ${searchTypeLabel} "${trimmedTerm}"`,
      });
      
      setDebugInfo(`${type} search: SUCCESS\nFound: ${response.students?.length || 0} results`);
      
    } catch (error) {
      console.error(`=== SEARCH ERROR (${type.toUpperCase()}) ===`);
      console.error("Search error:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDebugInfo(`${type} search failed: ${errorMessage}`);
      
      toast({
        title: "Search Failed",
        description: "Failed to search student records. Please try again.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleStudentUpdated = (updatedStudent: Student) => {
    // Update the search results with the updated student
    setSearchResults(prev => 
      prev.map(student => 
        student.studentId === updatedStudent.studentId ? { ...student, ...updatedStudent } : student
      )
    );
    setSelectedStudent(updatedStudent);
    setIsEditDialogOpen(false);
    
    // Refetch parent info if parent ID changed
    const updatedStudentWithParent = searchResults.find(s => s.studentId === updatedStudent.studentId);
    if (updatedStudentWithParent && updatedStudentWithParent.parentId !== updatedStudent.parentId) {
      fetchParentForStudent({ ...updatedStudentWithParent, ...updatedStudent });
    }
    
    toast({
      title: "Success",
      description: "Student record updated successfully",
    });
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  const isSearchDisabled = (type: 'name' | 'id' | 'grade') => {
    const trimmedTerm = searchTerm.trim();
    
    if (isSearching) return true;
    
    switch (type) {
      case 'name':
        return trimmedTerm.length < 3;
      case 'id':
      case 'grade':
        return trimmedTerm.length === 0;
      default:
        return true;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "transferred":
        return "bg-yellow-100 text-yellow-800";
      case "graduated":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "late":
        return "bg-yellow-100 text-yellow-800";
      case "excused":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Student Setup</h2>
        <p className="text-gray-600">Add new student records or edit existing ones</p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button onClick={handleAddStudent} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
        <Button 
          onClick={handleDebugSearch} 
          variant="outline"
          className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
        >
          <Bug className="w-4 h-4 mr-2" />
          Debug Search
        </Button>
      </div>

      {/* Debug Information */}
      {debugInfo && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-yellow-800 whitespace-pre-wrap overflow-auto max-h-40">
              {debugInfo}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search Students</span>
          </CardTitle>
          <CardDescription>
            Enter a search term and choose how to search: by name (min 3 chars), student ID, or grade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="searchTerm">Search Term</Label>
            <Input
              id="searchTerm"
              type="text"
              placeholder="Enter name, student ID, or grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  // Default to name search on Enter
                  if (!isSearchDisabled('name')) {
                    performSearch('name');
                  }
                }
              }}
              disabled={isSearching}
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => performSearch('name')} 
              disabled={isSearchDisabled('name')}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <User className="w-4 h-4 mr-2" />
              {isSearching && searchType === "name" ? "Searching..." : "Search by Name"}
            </Button>
            
            <Button 
              onClick={() => performSearch('id')} 
              disabled={isSearchDisabled('id')}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              {isSearching && searchType === "id" ? "Searching..." : "Search by ID"}
            </Button>
            
            <Button 
              onClick={() => performSearch('grade')} 
              disabled={isSearchDisabled('grade')}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Building className="w-4 h-4 mr-2" />
              {isSearching && searchType === "grade" ? "Searching..." : "Search by Grade"}
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Name:</strong> Minimum 3 characters required</p>
            <p><strong>Student ID:</strong> Exact match search</p>
            <p><strong>Grade:</strong> Enter grade level (K, 1, 2, 3, etc.)</p>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
            <CardDescription>Student records found matching your search criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {searchResults.map((student) => (
                <div
                  key={student.studentId}
                  className="p-6 border rounded-lg hover:shadow-md transition-all border-gray-200 hover:border-gray-300"
                >
                  {/* Student Information */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{student.studentName}</h3>
                        <Badge className={getStatusColor(student.studentStatus)}>
                          {student.studentStatus}
                        </Badge>
                        {student.attendanceStatus && (
                          <Badge className={getAttendanceColor(student.attendanceStatus)} variant="outline">
                            {student.attendanceStatus}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <p><strong>Student ID:</strong> {student.studentId}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          {student.grade && (
                            <div className="flex items-center space-x-1">
                              <GraduationCap className="w-3 h-3 text-gray-500" />
                              <span>Grade {student.grade}</span>
                            </div>
                          )}
                          {student.classBuilding && (
                            <div className="flex items-center space-x-1">
                              <Building className="w-3 h-3 text-gray-500" />
                              <span>{student.classBuilding}</span>
                            </div>
                          )}
                        </div>
                        {student.dismissalInstructions && (
                          <div className="flex items-start space-x-1 mt-2">
                            <FileText className="w-3 h-3 text-orange-500 mt-0.5" />
                            <span><strong>Dismissal:</strong> {student.dismissalInstructions}</span>
                          </div>
                        )}
                        {student.otherNote && (
                          <div className="flex items-start space-x-1 mt-1">
                            <StickyNote className="w-3 h-3 text-purple-500 mt-0.5" />
                            <span><strong>Note:</strong> {student.otherNote}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex flex-col gap-2 items-start">
                        <Button 
                          onClick={() => handleEditStudent(student)}
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs h-8 px-3"
                        >
                          <Edit className="w-3 h-3 mr-1.5" />
                          Edit Student
                        </Button>
                        <StudentQRCodeGenerator 
                          studentId={student.studentId}
                          studentName={student.studentName}
                          grade={student.grade}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Parent Information */}
                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Users className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium text-gray-900">Parent Information</h4>
                    </div>

                    {!student.parentId ? (
                      <div className="text-center py-4">
                        <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">No parent assigned</p>
                        <p className="text-xs text-gray-500">
                          This student needs to be assigned to a parent account.
                        </p>
                      </div>
                    ) : student.isLoadingParent ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2 text-sm text-gray-600">Loading parent information...</span>
                      </div>
                    ) : student.parentError ? (
                      <div className="text-center py-4">
                        <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">Unable to load parent information</p>
                        <p className="text-xs text-gray-500">Parent ID: {student.parentId}</p>
                        <p className="text-xs text-gray-500">{student.parentError}</p>
                      </div>
                    ) : student.parentInfo ? (
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <User className="w-4 h-4 text-green-600" />
                              <h5 className="font-medium text-gray-900">{student.parentInfo.parentName}</h5>
                              <Badge 
                                variant={student.parentInfo.parentRecordStatus === 'Active' ? 'default' : 'destructive'}
                                className={student.parentInfo.parentRecordStatus === 'Active' ? 'bg-green-600' : 'bg-red-600'}
                              >
                                {student.parentInfo.parentRecordStatus}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><strong>Parent ID:</strong> {student.parentInfo.parentID}</p>
                              <div className="flex items-center space-x-1">
                                <Phone className="w-3 h-3 text-gray-500" />
                                <span><strong>Phone:</strong> {formatPhone(student.parentInfo.parentPhoneMain)}</span>
                              </div>
                              {student.parentInfo.parentVehicleInfo && (
                                <p><strong>Vehicle:</strong> {student.parentInfo.parentVehicleInfo}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Parent information not available</p>
                        <p className="text-xs text-gray-500">Parent ID: {student.parentId}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results Message */}
      {searchResults.length === 0 && searchType && !isSearching && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center text-yellow-800">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">No student records found</p>
              <p className="text-sm">Try adjusting your search criteria and search again.</p>
              <p className="text-xs mt-2">
                If you expect results, try the "Debug Search" button to troubleshoot.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {selectedStudent && (
        <StudentEditDialog
          student={selectedStudent}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onStudentUpdated={handleStudentUpdated}
        />
      )}
    </div>
  );
}
