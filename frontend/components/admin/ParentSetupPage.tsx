import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Search, Edit, User, AlertCircle, Bug, Phone, Users } from "lucide-react";
import { ParentEditDialog } from "./ParentEditDialog";
import backend from "~backend/client";
import type { Parent } from "~backend/parent/types";

interface ParentSetupPageProps {
  onBack: () => void;
}

export function ParentSetupPage({ onBack }: ParentSetupPageProps) {
  const [searchResults, setSearchResults] = useState<Parent[]>([]);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  // Single search input
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();

  const handleAddParent = () => {
    toast({
      title: "Add Parent",
      description: "Code to be added later",
    });
  };

  const handleDebugSearch = async () => {
    try {
      console.log("=== DEBUG: Testing backend connection ===");
      
      // Test if we can reach the backend at all
      const testResponse = await backend.user.list();
      console.log("Backend connection test successful:", testResponse);
      
      // Try to get all parent records to see what's in the database
      const allParentsResponse = await fetch('/api/parent/search/name?name=a', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (allParentsResponse.ok) {
        const allParentsData = await allParentsResponse.json();
        console.log("All parents search result:", allParentsData);
        setDebugInfo(`Backend connection: OK\nParents found with 'a': ${allParentsData.parents?.length || 0}\nFirst few results: ${JSON.stringify(allParentsData.parents?.slice(0, 3), null, 2)}`);
      } else {
        const errorText = await allParentsResponse.text();
        console.error("Debug search failed:", errorText);
        setDebugInfo(`Backend connection: FAILED\nStatus: ${allParentsResponse.status}\nError: ${errorText}`);
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

  const performSearch = async (type: 'name' | 'phone' | 'alternate') => {
    const trimmedTerm = searchTerm.trim();
    
    // Validation based on search type
    if (type === 'name' && trimmedTerm.length < 4) {
      toast({
        title: "Invalid Search",
        description: "Name must be at least 4 characters long",
        variant: "destructive",
      });
      return;
    }

    if (type === 'phone') {
      const cleanPhone = trimmedTerm.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        toast({
          title: "Invalid Search",
          description: "Phone number must be exactly 10 digits",
          variant: "destructive",
        });
        return;
      }
    }

    if (type === 'alternate' && trimmedTerm.length < 4) {
      toast({
        title: "Invalid Search",
        description: "Alternate contact name must be at least 4 characters long",
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
          response = await backend.parent.searchByName({ name: trimmedTerm });
          break;
        case 'phone':
          response = await backend.parent.searchByPhone({ phone: trimmedTerm });
          break;
        case 'alternate':
          response = await backend.parent.searchByAlternateName({ alternateName: trimmedTerm });
          break;
        default:
          throw new Error("Invalid search type");
      }
      
      console.log("Search response:", response);
      
      setSearchResults(response.parents || []);
      setSelectedParent(null);
      
      const searchTypeLabel = type === 'name' ? 'name' : type === 'phone' ? 'phone number' : 'alternate contact name';
      toast({
        title: "Search Complete",
        description: `Found ${response.parents?.length || 0} parent(s) matching ${searchTypeLabel} "${trimmedTerm}"`,
      });
      
      setDebugInfo(`${type} search: SUCCESS\nFound: ${response.parents?.length || 0} results`);
      
    } catch (error) {
      console.error(`=== SEARCH ERROR (${type.toUpperCase()}) ===`);
      console.error("Search error:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDebugInfo(`${type} search failed: ${errorMessage}`);
      
      toast({
        title: "Search Failed",
        description: "Failed to search parent records. Please try again.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEditParent = (parent: Parent) => {
    setSelectedParent(parent);
    setIsEditDialogOpen(true);
  };

  const handleParentUpdated = (updatedParent: Parent) => {
    // Update the search results with the updated parent
    setSearchResults(prev => 
      prev.map(parent => 
        parent.parentID === updatedParent.parentID ? updatedParent : parent
      )
    );
    setSelectedParent(updatedParent);
    setIsEditDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Parent record updated successfully",
    });
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  const isSearchDisabled = (type: 'name' | 'phone' | 'alternate') => {
    const trimmedTerm = searchTerm.trim();
    
    if (isSearching) return true;
    
    switch (type) {
      case 'name':
      case 'alternate':
        return trimmedTerm.length < 4;
      case 'phone':
        const cleanPhone = trimmedTerm.replace(/\D/g, '');
        return cleanPhone.length !== 10;
      default:
        return true;
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
        <h2 className="text-2xl font-bold text-gray-900">Parent Setup</h2>
        <p className="text-gray-600">Add new parent records or edit existing ones</p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button onClick={handleAddParent} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Parent
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
            <span>Search Parents</span>
          </CardTitle>
          <CardDescription>
            Enter a search term and choose how to search: by name (min 4 chars), phone number (10 digits), or alternate contact name (min 4 chars)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="searchTerm">Search Term</Label>
            <Input
              id="searchTerm"
              type="text"
              placeholder="Enter name, phone number, or alternate contact name..."
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
              onClick={() => performSearch('phone')} 
              disabled={isSearchDisabled('phone')}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Phone className="w-4 h-4 mr-2" />
              {isSearching && searchType === "phone" ? "Searching..." : "Search by Phone"}
            </Button>
            
            <Button 
              onClick={() => performSearch('alternate')} 
              disabled={isSearchDisabled('alternate')}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Users className="w-4 h-4 mr-2" />
              {isSearching && searchType === "alternate" ? "Searching..." : "Search by Alt Contact"}
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Name/Alt Contact:</strong> Minimum 4 characters required</p>
            <p><strong>Phone:</strong> Must be exactly 10 digits (formatting will be ignored)</p>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
            <CardDescription>Parent records found matching your search criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((parent) => (
                <div
                  key={parent.parentID}
                  className="p-4 border rounded-lg hover:shadow-md transition-all border-gray-200 hover:border-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{parent.parentName}</h3>
                        <Badge 
                          variant={parent.parentRecordStatus === 'Active' ? 'default' : 'destructive'}
                          className={parent.parentRecordStatus === 'Active' ? 'bg-green-600' : 'bg-red-600'}
                        >
                          {parent.parentRecordStatus}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <p><strong>Parent ID:</strong> {parent.parentID}</p>
                        <p><strong>Phone:</strong> {formatPhone(parent.parentPhoneMain)}</p>
                        {parent.alternate1Name && (
                          <p><strong>Alt Contact 1:</strong> {parent.alternate1Name} - {formatPhone(parent.alternate1Phone)}</p>
                        )}
                        {parent.alternate2Name && (
                          <p><strong>Alt Contact 2:</strong> {parent.alternate2Name} - {formatPhone(parent.alternate2Phone)}</p>
                        )}
                        {parent.alternate3Name && (
                          <p><strong>Alt Contact 3:</strong> {parent.alternate3Name} - {formatPhone(parent.alternate3Phone)}</p>
                        )}
                      </div>
                      <div className="mt-3">
                        <Button 
                          onClick={() => handleEditParent(parent)}
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Parent
                        </Button>
                      </div>
                    </div>
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
              <p className="font-medium">No parent records found</p>
              <p className="text-sm">Try adjusting your search criteria and search again.</p>
              <p className="text-xs mt-2">
                If you expect results, try the "Debug Search" button to troubleshoot.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {selectedParent && (
        <ParentEditDialog
          parent={selectedParent}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onParentUpdated={handleParentUpdated}
        />
      )}
    </div>
  );
}
