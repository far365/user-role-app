import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, Calendar, MessageCircle, Bell, Phone, Mail, MapPin, UserCheck, AlertCircle, Bug } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
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
              <li>Your username ({user.loginID}) exists in the usersrcd table</li>
              <li>The usersrcd record has a valid parentid field</li>
              <li>A corresponding record exists in the parentrcd table with that parentid</li>
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
                  <p className="font-medium">Specific User Record:</p>
                  <pre className="bg-white p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(debugData.specificUser, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <p className="font-medium">All usersrcd Records ({debugData.usersrcdRecords.length}):</p>
                  <div className="bg-white p-2 rounded text-xs max-h-40 overflow-auto">
                    {debugData.usersrcdRecords.map((record: any, index: number) => (
                      <div key={index} className="mb-2 p-1 border-b">
                        <strong>Username:</strong> {record.username || 'N/A'} | 
                        <strong> LoginID:</strong> {record.loginid || 'N/A'} | 
                        <strong> ParentID:</strong> {record.parentid || 'N/A'}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5" />
                <span>Parent Information</span>
              </CardTitle>
              <CardDescription>Your contact details and information from parentrcd table</CardDescription>
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
              
              <div className="flex items-start space-x-2">
                <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Phone Number</p>
                  <p className="text-sm text-gray-900">{parentData.phoneNumber || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Mail className="w-4 h-4 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-sm text-gray-900 break-words">{parentData.email || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Address</p>
                  <p className="text-sm text-gray-900 break-words">{parentData.address || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Emergency Contact</span>
              </CardTitle>
              <CardDescription>Emergency contact information from parentrcd table</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Emergency Contact Name</p>
                <p className="text-sm text-gray-900">{parentData.emergencyContact || 'Not provided'}</p>
              </div>
              
              <div className="flex items-start space-x-2">
                <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Emergency Phone</p>
                  <p className="text-sm text-gray-900">{parentData.emergencyPhone || 'Not provided'}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <p className="font-medium">Record Created</p>
                    <p>{parentData.createdAt.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p>{parentData.updatedAt.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Children</CardTitle>
            <Baby className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Data not available yet</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Data not available yet</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Data not available yet</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Data not available yet</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your children's activities for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No schedule data available yet</p>
              <p className="text-xs mt-1">Schedule information will be displayed here once children data is integrated</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
            <CardDescription>Latest news about your children</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No updates available yet</p>
              <p className="text-xs mt-1">Recent updates will be displayed here once activity data is integrated</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {parentData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Debug Information</CardTitle>
            <CardDescription className="text-blue-700">
              Data successfully loaded from parentrcd table
            </CardDescription>
          </CardHeader>
          <CardContent className="text-blue-800">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Username:</strong> {user.loginID}</p>
                <p><strong>Parent ID:</strong> {parentData.parentID}</p>
                <p><strong>Parent Name:</strong> {parentData.parentName}</p>
              </div>
              <div>
                <p><strong>Phone:</strong> {parentData.phoneNumber || 'N/A'}</p>
                <p><strong>Email:</strong> {parentData.email || 'N/A'}</p>
                <p><strong>Emergency Contact:</strong> {parentData.emergencyContact || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
