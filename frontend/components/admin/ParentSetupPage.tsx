import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Search, Edit, Phone, User, Users, AlertCircle } from "lucide-react";
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
  
  // Search form states
  const [nameSearch, setNameSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [alternateNameSearch, setAlternateNameSearch] = useState("");
  
  const { toast } = useToast();

  const handleAddParent = () => {
    toast({
      title: "Add Parent",
      description: "Code to be added later",
    });
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
    
    try {
      console.log("Searching by name:", nameSearch.trim());
      
      // Use query parameters for GET request
      const searchParams = new URLSearchParams({ name: nameSearch.trim() });
      const response = await fetch(`/api/parent/search/name?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Search response:", data);
      
      setSearchResults(data.parents || []);
      setSelectedParent(null);
      
      toast({
        title: "Search Complete",
        description: `Found ${data.parents?.length || 0} parent(s) matching "${nameSearch}"`,
      });
    } catch (error) {
      console.error("Search by name error:", error);
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

  const handleSearchByPhone = async () => {
    const cleanPhone = phoneSearch.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchType("phone");
    
    try {
      console.log("Searching by phone:", cleanPhone);
      
      // Use query parameters for GET request
      const searchParams = new URLSearchParams({ phone: cleanPhone });
      const response = await fetch(`/api/parent/search/phone?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Search response:", data);
      
      setSearchResults(data.parents || []);
      setSelectedParent(null);
      
      toast({
        title: "Search Complete",
        description: `Found ${data.parents?.length || 0} parent(s) with phone number ${cleanPhone}`,
      });
    } catch (error) {
      console.error("Search by phone error:", error);
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

  const handleSearchByAlternateName = async () => {
    if (alternateNameSearch.trim().length < 4) {
      toast({
        title: "Invalid Search",
        description: "Alternate name must be at least 4 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchType("alternate");
    
    try {
      console.log("Searching by alternate name:", alternateNameSearch.trim());
      
      // Use query parameters for GET request
      const searchParams = new URLSearchParams({ alternateName: alternateNameSearch.trim() });
      const response = await fetch(`/api/parent/search/alternate-name?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Search response:", data);
      
      setSearchResults(data.parents || []);
      setSelectedParent(null);
      
      toast({
        title: "Search Complete",
        description: `Found ${data.parents?.length || 0} parent(s) with alternate contact "${alternateNameSearch}"`,
      });
    } catch (error) {
      console.error("Search by alternate name error:", error);
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
      </div>

      {/* Search Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Search by Phone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>Search by Main Phone</span>
            </CardTitle>
            <CardDescription>All 10 digits required</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phoneSearch">Phone Number</Label>
              <Input
                id="phoneSearch"
                type="tel"
                placeholder="Enter 10-digit phone number..."
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchByPhone()}
                disabled={isSearching}
              />
            </div>
            <Button 
              onClick={handleSearchByPhone} 
              disabled={isSearching || phoneSearch.replace(/\D/g, '').length !== 10}
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching && searchType === "phone" ? "Searching..." : "Search"}
            </Button>
          </CardContent>
        </Card>

        {/* Search by Alternate Name */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Search by Alternate Name</span>
            </CardTitle>
            <CardDescription>Minimum 4 characters required</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="alternateNameSearch">Alternate Contact Name</Label>
              <Input
                id="alternateNameSearch"
                type="text"
                placeholder="Enter alternate contact name..."
                value={alternateNameSearch}
                onChange={(e) => setAlternateNameSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchByAlternateName()}
                disabled={isSearching}
              />
            </div>
            <Button 
              onClick={handleSearchByAlternateName} 
              disabled={isSearching || alternateNameSearch.trim().length < 4}
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching && searchType === "alternate" ? "Searching..." : "Search"}
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
