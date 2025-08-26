import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, UserCheck, AlertCircle, Bug, Car, Users, MessageSquare, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import backend from "~backend/client";
import type { User } from "~backend/user/types";
import type { Parent } from "~backend/parent/types";

interface ParentDashboardProps {
  user: User;
}

export function ParentDashboard({ user }: ParentDashboardProps) {
  const [parentData, setParentData] = useState<Parent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchParentData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Fetching parent data for username:", user.loginID);
        
        const response = await backend.parent.getByUsername({ username: user.loginID });
        console.log("Parent data response:", response);
        
        setParentData(response.parent);
      } catch (error) {
        console.error("Failed to fetch parent data:", error);
        setError(error instanceof Error ? error.message : "Failed to load parent information");
        toast({
          title: "Error",
          description: "Failed to load parent information. Please check if your parent record exists in the database.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchParentData();
  }, [user.loginID, toast]);

  const handleDebug = async () => {
    try {
      console.log("Fetching debug data for username:", user.loginID);
      const response = await backend.parent.debug({ username: user.loginID });
      console.log("Debug data response:", response);
      setDebugData(response);
      setShowDebug(true);
    } catch (error) {
      console.error("Failed to fetch debug data:", error);
      toast({
        title: "Debug Error",
        description: "Failed to fetch debug information",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Parent Dashboard</h2>
          <p className="text-gray-600">Loading your information...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !parentData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Parent Dashboard</h2>
          <p className="text-gray-600">Welcome {user.displayName}!</p>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>Parent Information Not Found</span>
            </CardTitle>
            <CardDescription className="text-red-700">
              No parent record found for username: {user.loginID}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-red-700">
            <p className="text-sm">
              Please ensure that:
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>A record exists in the parentrcd table with parentid = "{user.loginID}"</li>
              <li>The parentrcd table has the correct field names (parentid, parentname, etc.)</li>
              <li>The username "{user.loginID}" matches a parentid in the parentrcd table</li>
            </ul>
            <p className="text-sm mt-3">
              Error details: {error}
            </p>
            <div className="mt-4">
              <Button onClick={handleDebug} variant="outline" size="sm">
                <Bug className="w-4 h-4 mr-2" />
                Debug Database
              </Button>
            </div>
          </CardContent>
        </Card>

        {showDebug && debugData && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Debug Information</CardTitle>
              <CardDescription className="text-yellow-700">
                Database contents for troubleshooting
              </CardDescription>
            </CardHeader>
            <CardContent className="text-yellow-800">
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">Specific User Record (usersrcd):</p>
                  <pre className="bg-white p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(debugData.specificUser, null, 2)}
                  </pre>
                </div>

                <div>
                  <p className="font-medium">Specific Parent Record (parentrcd where parentid = "{user.loginID}"):</p>
                  <pre className="bg-white p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(debugData.specificParent, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <p className="font-medium">All usersrcd Records ({debugData.usersrcdRecords.length}):</p>
                  <div className="bg-white p-2 rounded text-xs max-h-40 overflow-auto">
                    {debugData.usersrcdRecords.map((record: any, index: number) => (
                      <div key={index} className="mb-2 p-1 border-b">
                        <strong>Username:</strong> {record.username || 'N/A'} | 
                        <strong> LoginID:</strong> {record.loginid || 'N/A'} | 
                        <strong> UserID:</strong> {record.userid || 'N/A'}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-medium">All parentrcd Records ({debugData.parentrcdRecords.length}):</p>
                  <div className="bg-white p-2 rounded text-xs max-h-40 overflow-auto">
                    {debugData.parentrcdRecords.map((record: any, index: number) => (
                      <div key={index} className="mb-2 p-1 border-b">
                        <strong>ParentID:</strong> {record.parentid || 'N/A'} | 
                        <strong> Name:</strong> {record.parentname || 'N/A'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Parent Dashboard</h2>
        <p className="text-gray-600">
          Welcome {parentData?.parentName || user.displayName}! Stay connected with your child's activities and important updates.
        </p>
      </div>

      {parentData && (
        <div className="space-y-6">
          {/* Main Parent Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5" />
                  <span>Parent Information</span>
                </CardTitle>
                <CardDescription>Your primary contact details and information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Parent Name</p>
                    <p className="text-sm text-gray-900">{parentData.parentName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Parent ID</p>
                    <p className="text-sm text-gray-900 font-mono">{parentData.parentID}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Gender</p>
                    <p className="text-sm text-gray-900">{parentData.gender === 'M' ? 'Male' : parentData.gender === 'F' ? 'Female' : parentData.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Record Status</p>
                    <Badge variant={parentData.parentRecordStatus === 'Active' ? 'default' : 'secondary'}>
                      {parentData.parentRecordStatus || 'Unknown'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Main Phone Number</p>
                    <p className="text-sm text-gray-900">{parentData.parentPhoneMain || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">SMS Notifications</p>
                    <Badge variant={parentData.sendSMS ? 'default' : 'secondary'}>
                      {parentData.sendSMS ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Car className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Vehicle Information</p>
                    <p className="text-sm text-gray-900">{parentData.parentVehicleInfo || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Alternate Contact 1</span>
                </CardTitle>
                <CardDescription>Primary alternate contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Name</p>
                  <p className="text-sm text-gray-900">{parentData.alternate1Name || 'Not provided'}</p>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Phone Number</p>
                    <p className="text-sm text-gray-900">{parentData.alternate1Phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <User className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Relationship</p>
                    <p className="text-sm text-gray-900">{parentData.alternate1Relationship || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Car className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Vehicle Information</p>
                    <p className="text-sm text-gray-900">{parentData.alternate1VehicleInfo || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alternate Contacts 2 & 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Alternate Contact 2</span>
                </CardTitle>
                <CardDescription>Secondary alternate contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Name</p>
                  <p className="text-sm text-gray-900">{parentData.alternate2Name || 'Not provided'}</p>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Phone Number</p>
                    <p className="text-sm text-gray-900">{parentData.alternate2Phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <User className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Relationship</p>
                    <p className="text-sm text-gray-900">{parentData.alternate2Relationship || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Car className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Vehicle Information</p>
                    <p className="text-sm text-gray-900">{parentData.alternate2VehicleInfo || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Alternate Contact 3</span>
                </CardTitle>
                <CardDescription>Third alternate contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Name</p>
                  <p className="text-sm text-gray-900">{parentData.alternate3Name || 'Not provided'}</p>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Phone Number</p>
                    <p className="text-sm text-gray-900">{parentData.alternate3Phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <User className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Relationship</p>
                    <p className="text-sm text-gray-900">{parentData.alternate3Relationship || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Car className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Vehicle Information</p>
                    <p className="text-sm text-gray-900">{parentData.alternate3VehicleInfo || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Record Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-800">Record Information</CardTitle>
              <CardDescription className="text-blue-700">
                Database record details and timestamps
              </CardDescription>
            </CardHeader>
            <CardContent className="text-blue-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p><strong>Parent ID:</strong> {parentData.parentID}</p>
                  <p><strong>Record Status:</strong> {parentData.parentRecordStatus}</p>
                  <p><strong>SMS Enabled:</strong> {parentData.sendSMS ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p><strong>Gender:</strong> {parentData.gender === 'M' ? 'Male' : parentData.gender === 'F' ? 'Female' : parentData.gender || 'Not specified'}</p>
                  <p><strong>Main Phone:</strong> {parentData.parentPhoneMain || 'N/A'}</p>
                  <p><strong>Vehicle:</strong> {parentData.parentVehicleInfo || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Created:</strong> {parentData.createdAt.toLocaleDateString()}</p>
                  <p><strong>Updated:</strong> {parentData.updatedAt.toLocaleDateString()}</p>
                  <p><strong>Username:</strong> {user.loginID}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
