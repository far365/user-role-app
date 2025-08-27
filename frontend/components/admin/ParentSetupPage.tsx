import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Search, Edit, User, AlertCircle, Bug } from "lucide-react";
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
  
  // Search form states
  const [nameSearch, setNameSearch] = useState("");
  
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

  const handleSearchByName = async () => {
    if (nameSearch.trim().length < 4) {
      toast({
        title: "Invalid Search",
        description: "Name must be at least 4 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchType("name");
    setDebugInfo("");
    
    try {
      console.log("=== SEARCH DEBUG ===");
      console.log("Searching by name:", nameSearch.trim());
      
      // Method 1: Try using the backend client directly
      try {
        console.log("Attempting backend.parent.searchByName...");
        const backendResponse = await backend.parent.searchByName({ name: nameSearch.trim() });
        console.log("Backend client response:", backendResponse);
        
        setSearchResults(backendResponse.parents || []);
        setSelectedParent(null);
        
        toast({
          title: "Search Complete",
          description: `Found ${backendResponse.parents?.length || 0} parent(s) matching "${nameSearch}"`,
        });
        
        setDebugInfo(`Backend client method: SUCCESS\nFound: ${backendResponse.parents?.length || 0} results`);
        return;
      } catch (backendError) {
        console.error("Backend client method failed:", backendError);
        setDebugInfo(`Backend client method: FAILED\nError: ${backendError instanceof Error ? backendError.message : 'Unknown error'}`);
      }
      
      // Method 2: Fallback to direct fetch
      console.log("Falling back to direct fetch...");
      const searchParams = new URLSearchParams({ name: nameSearch.trim() });
      const fetchUrl = `/api/parent/search/name?${searchParams}`;
      console.log("Fetch URL:", fetchUrl);
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("Fetch response status:", response.status);
      console.log("Fetch response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fetch error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log("Fetch response data:", data);
      
      setSearchResults(data.parents || []);
      setSelectedParent(null);
      
      toast({
        title: "Search Complete",
        description: `Found ${data.parents?.length || 0} parent(s) matching "${nameSearch}"`,
      });
      
      setDebugInfo(`Direct fetch method: SUCCESS\nFound: ${data.parents?.length || 0} results\nFirst result: ${JSON.stringify(data.parents?.[0], null, 2)}`);
      
    } catch (error) {
      console.error("=== SEARCH ERROR ===");
      console.error("Search by name error:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDebugInfo(`Search failed: ${errorMessage}`);
      
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

  const handleSelectParent = (parent: Parent) => {
    setSelectedParent(parent);
  };

  const handleEditParent = () => {
    if (!selectedParent) {
      toast({
        title: "No Parent Selected",
        description: "Please select a parent record to edit",
        variant: "destructive",
      });
      return;
    }
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
          onClick={handleEditParent} 
          variant="outline"
          disabled={!selectedParent}
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Selected Parent
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
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Search by Name */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Search by Parent Name</span>
            </CardTitle>
            <CardDescription>Minimum 4 characters required</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nameSearch">Parent Name</Label>
              <Input
                id="nameSearch"
                type="text"
                placeholder="Enter parent name..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchByName()}
                disabled={isSearching}
              />
            </div>
            <Button 
              onClick={handleSearchByName} 
              disabled={isSearching || nameSearch.trim().length < 4}
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching && searchType === "name" ? "Searching..." : "Search"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
            <CardDescription>Click on a parent record to select it for editing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((parent) => (
                <div
                  key={parent.parentID}
                  onClick={() => handleSelectParent(parent)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedParent?.parentID === parent.parentID
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
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
                    </div>
                    {selectedParent?.parentID === parent.parentID && (
                      <div className="text-blue-600">
                        <AlertCircle className="w-5 h-5" />
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
