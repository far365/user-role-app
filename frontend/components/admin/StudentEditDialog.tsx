import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Save, X, AlertCircle, Search, User } from "lucide-react";
import backend from "~backend/client";
import type { Student } from "~backend/student/types";
import type { Parent } from "~backend/parent/types";

interface StudentEditDialogProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onStudentUpdated: (updatedStudent: Student) => void;
}

interface EditableStudentData {
  studentName: string;
  grade: string;
  classBuilding: string;
  parentId: string;
  studentStatus: string;
  attendanceStatus: string;
  dismissalInstructions: string;
  otherNote: string;
}

interface ValidationErrors {
  [key: string]: string;
}

export function StudentEditDialog({ student, isOpen, onClose, onStudentUpdated }: StudentEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingParents, setIsSearchingParents] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [parentSearchTerm, setParentSearchTerm] = useState("");
  const [availableParents, setAvailableParents] = useState<Parent[]>([]);
  const [selectedParentName, setSelectedParentName] = useState("");
  const [editData, setEditData] = useState<EditableStudentData>({
    studentName: student.studentName,
    grade: student.grade,
    classBuilding: student.classBuilding,
    parentId: student.parentId,
    studentStatus: student.studentStatus,
    attendanceStatus: student.attendanceStatus,
    dismissalInstructions: student.dismissalInstructions,
    otherNote: student.otherNote,
  });
  
  const { toast } = useToast();

  // Find parent name when dialog opens or parentId changes
  useEffect(() => {
    const findParentName = async () => {
      if (editData.parentId && editData.parentId.trim()) {
        try {
          const response = await backend.parent.getByUsername({ username: editData.parentId });
          setSelectedParentName(response.parent.parentName);
        } catch (error) {
          console.error("Failed to fetch parent name:", error);
          setSelectedParentName(`Unknown (${editData.parentId})`);
        }
      } else {
        setSelectedParentName("");
      }
    };

    if (isOpen) {
      findParentName();
    }
  }, [editData.parentId, isOpen]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Validate required fields
    if (!editData.studentName.trim()) {
      errors.studentName = "Student Name is required";
    }
    
    if (!editData.parentId.trim()) {
      errors.parentId = "Parent ID is required";
    }
    
    if (!editData.grade.trim()) {
      errors.grade = "Grade is required";
    }
    
    setValidationErrors(errors);
    
    return Object.keys(errors).length === 0;
  };

  const searchParents = async () => {
    if (!parentSearchTerm.trim() || parentSearchTerm.trim().length < 4) {
      toast({
        title: "Invalid Search",
        description: "Parent name must be at least 4 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSearchingParents(true);
      const response = await backend.parent.searchByName({ name: parentSearchTerm.trim() });
      setAvailableParents(response.parents);
      
      if (response.parents.length === 0) {
        toast({
          title: "No Results",
          description: "No parents found matching your search criteria",
        });
      }
    } catch (error) {
      console.error("Failed to search parents:", error);
      toast({
        title: "Search Failed",
        description: "Failed to search parent records",
        variant: "destructive",
      });
    } finally {
      setIsSearchingParents(false);
    }
  };

  const selectParent = (parent: Parent) => {
    setEditData(prev => ({ ...prev, parentId: parent.parentID }));
    setSelectedParentName(parent.parentName);
    setAvailableParents([]);
    setParentSearchTerm("");
    
    // Clear validation error for parentId
    const newErrors = { ...validationErrors };
    delete newErrors.parentId;
    setValidationErrors(newErrors);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      const errorMessages = Object.values(validationErrors);
      toast({
        title: "Validation Error",
        description: errorMessages.join('. '),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const response = await backend.student.update({
        studentId: student.studentId,
        ...editData,
      });
      
      onStudentUpdated(response.student);
      
      toast({
        title: "Success",
        description: "Student information updated successfully.",
      });
      
    } catch (error) {
      console.error("Failed to update student data:", error);
      
      let errorMessage = "Failed to update student information. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("Cannot remove parent ID")) {
          errorMessage = "Cannot remove parent ID from student once assigned. Parent ID is required for all students.";
        } else {
          errorMessage = `Update failed: ${error.message}`;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof EditableStudentData, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear validation errors for this field when user starts typing
    if (value.trim()) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  const studentStatusOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Transferred", label: "Transferred" },
    { value: "Graduated", label: "Graduated" },
  ];

  const attendanceStatusOptions = [
    { value: "not_set", label: "Not Set" },
    { value: "Present", label: "Present" },
    { value: "Absent", label: "Absent" },
    { value: "Late", label: "Late" },
    { value: "Excused", label: "Excused" },
  ];

  const gradeOptions = [
    { value: "K", label: "Kindergarten" },
    { value: "1", label: "1st Grade" },
    { value: "2", label: "2nd Grade" },
    { value: "3", label: "3rd Grade" },
    { value: "4", label: "4th Grade" },
    { value: "5", label: "5th Grade" },
    { value: "6", label: "6th Grade" },
    { value: "7", label: "7th Grade" },
    { value: "8", label: "8th Grade" },
    { value: "9", label: "9th Grade" },
    { value: "10", label: "10th Grade" },
    { value: "11", label: "11th Grade" },
    { value: "12", label: "12th Grade" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student Record</DialogTitle>
          <DialogDescription>
            Editing information for {student.studentName} (ID: {student.studentId})
            <br />
            <span className="text-sm text-blue-600">Note: Parent ID cannot be removed once assigned to a student.</span>
          </DialogDescription>
        </DialogHeader>

        {Object.keys(validationErrors).length > 0 && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Validation Errors</span>
            </div>
            <div className="text-sm text-red-700">
              <p className="font-medium mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.values(validationErrors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Student Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Student Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studentName">Student Name</Label>
                <Input
                  id="studentName"
                  type="text"
                  value={editData.studentName}
                  onChange={(e) => handleInputChange('studentName', e.target.value)}
                  placeholder="Enter student name"
                  className={validationErrors.studentName ? 'border-red-300' : ''}
                />
                {validationErrors.studentName && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.studentName}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="studentId">Student ID (Read-only)</Label>
                <Input
                  id="studentId"
                  type="text"
                  value={student.studentId}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Select value={editData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                  <SelectTrigger className={validationErrors.grade ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.grade && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.grade}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="classBuilding">Class/Building</Label>
                <Input
                  id="classBuilding"
                  type="text"
                  value={editData.classBuilding}
                  onChange={(e) => handleInputChange('classBuilding', e.target.value)}
                  placeholder="Enter class or building"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studentStatus">Student Status</Label>
                <Select value={editData.studentStatus} onValueChange={(value) => handleInputChange('studentStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="attendanceStatus">Attendance Status</Label>
                <Select 
                  value={editData.attendanceStatus || "not_set"} 
                  onValueChange={(value) => handleInputChange('attendanceStatus', value === "not_set" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select attendance status" />
                  </SelectTrigger>
                  <SelectContent>
                    {attendanceStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Parent Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Parent Assignment</h3>
            
            <div>
              <Label htmlFor="currentParent">Current Parent</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  id="currentParent"
                  type="text"
                  value={selectedParentName ? `${selectedParentName} (${editData.parentId})` : editData.parentId || 'No parent assigned'}
                  disabled
                  className="bg-gray-100"
                />
                {editData.parentId && (
                  <span className="text-sm text-gray-600">✓ Assigned</span>
                )}
              </div>
              {validationErrors.parentId && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.parentId}</p>
              )}
              {student.parentId && (
                <p className="text-xs text-blue-600 mt-1">
                  Note: Parent ID cannot be removed once assigned. You can only change to a different parent.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="parentSearch">Search for Parent (to change assignment)</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="parentSearch"
                  type="text"
                  value={parentSearchTerm}
                  onChange={(e) => setParentSearchTerm(e.target.value)}
                  placeholder="Enter parent name (min 4 characters)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && parentSearchTerm.trim().length >= 4) {
                      searchParents();
                    }
                  }}
                />
                <Button 
                  onClick={searchParents} 
                  disabled={isSearchingParents || parentSearchTerm.trim().length < 4}
                  variant="outline"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isSearchingParents ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>

            {availableParents.length > 0 && (
              <div>
                <Label>Available Parents</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                  {availableParents.map((parent) => (
                    <div
                      key={parent.parentID}
                      className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => selectParent(parent)}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-sm">{parent.parentName}</p>
                          <p className="text-xs text-gray-500">ID: {parent.parentID} • Phone: {parent.parentPhoneMain}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            
            <div>
              <Label htmlFor="dismissalInstructions">Dismissal Instructions</Label>
              <Textarea
                id="dismissalInstructions"
                value={editData.dismissalInstructions}
                onChange={(e) => handleInputChange('dismissalInstructions', e.target.value)}
                placeholder="Enter dismissal instructions"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="otherNote">Other Notes</Label>
              <Textarea
                id="otherNote"
                value={editData.otherNote}
                onChange={(e) => handleInputChange('otherNote', e.target.value)}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button onClick={onClose} variant="outline" disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
