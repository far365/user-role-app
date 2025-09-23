import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { LogIn, AlertCircle } from "lucide-react";
import backend from "~backend/client";
import type { User } from "~backend/user/types";

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [loginID, setLoginID] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginID.trim()) {
      toast({
        title: "Error",
        description: "Please enter your login ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setDebugInfo("");

    try {
      console.log(`[LoginForm] Attempting login for: ${loginID.trim()}`);
      
      // Generate a simple device ID
      const deviceID = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await backend.user.login({
        loginID: loginID.trim(),
        password: "demo", // Using a dummy password since it's not validated
        deviceID,
      });

      console.log(`[LoginForm] Login response:`, response);

      if (response.success) {
        console.log(`[LoginForm] Login successful for: ${response.user.displayName}`);
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${response.user.displayName}!`,
        });
        onLogin(response.user);
      }
    } catch (error) {
      console.error("[LoginForm] Login error:", error);
      
      // Enhanced error handling with debug information
      let errorMessage = "Login failed. Please check your login ID and try again.";
      let debugDetails = "";
      
      if (error instanceof Error) {
        console.error("[LoginForm] Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        if (error.message.includes("User not found")) {
          errorMessage = "Login ID not found. Please check your login ID and try again.";
          debugDetails = `No user record found with login ID: ${loginID.trim()}`;
        } else if (error.message.includes("disabled")) {
          errorMessage = "Your account has been disabled. Please contact support.";
          debugDetails = "User account status is not 'Active'";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Connection timeout. Please check your database connection and try again.";
          debugDetails = "Database connection timed out - check Supabase configuration";
        } else if (error.message.includes("failed to start app")) {
          errorMessage = "Application startup error. Please check your configuration.";
          debugDetails = "App failed to start - likely a configuration or database connection issue";
        } else if (error.message.includes("status 500")) {
          errorMessage = "Server error. Please check your database configuration.";
          debugDetails = `Server error (500): ${error.message}`;
        } else {
          errorMessage = `Login failed: ${error.message}`;
          debugDetails = error.message;
        }
      }
      
      setDebugInfo(debugDetails);
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsLoading(true);
      setDebugInfo("");
      
      console.log("[LoginForm] Testing backend connection...");
      
      // Try to call a simple endpoint to test connectivity
      const response = await backend.user.list();
      console.log("[LoginForm] Backend connection test successful:", response);
      
      setDebugInfo(`Connection test successful. Found ${response.users.length} users in database.`);
      
      toast({
        title: "Connection Test",
        description: `Successfully connected to backend. Found ${response.users.length} users.`,
      });
    } catch (error) {
      console.error("[LoginForm] Connection test failed:", error);
      
      let errorMessage = "Connection test failed";
      let debugDetails = "";
      
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "Database connection timeout";
          debugDetails = "Database connection timed out - check Supabase URL and API key";
        } else if (error.message.includes("failed to start app")) {
          errorMessage = "App startup failure";
          debugDetails = "App failed to start - check configuration and secrets";
        } else {
          errorMessage = `Connection failed: ${error.message}`;
          debugDetails = error.message;
        }
      }
      
      setDebugInfo(debugDetails);
      
      toast({
        title: "Connection Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Enter your login ID to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginID">Login ID</Label>
                <Input
                  id="loginID"
                  type="text"
                  placeholder="Enter your login ID"
                  value={loginID}
                  onChange={(e) => setLoginID(e.target.value)}
                  disabled={isLoading}
                  maxLength={12}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
            
            {/* Test Connection Button */}
            <div className="mt-4">
              <Button 
                onClick={handleTestConnection} 
                variant="outline" 
                className="w-full"
                disabled={isLoading}
              >
                Test Connection
              </Button>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Available Login IDs:</p>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Example text goes here</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Information */}
        {debugInfo && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-yellow-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Debug Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-yellow-800 font-mono whitespace-pre-wrap">
                {debugInfo}
              </div>
              <div className="mt-3 text-xs text-yellow-700">
                <p><strong>Common Issues:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Check that your Supabase URL and API key are correctly set in the Infrastructure tab</li>
                  <li>Ensure the usersrcd table exists in your Supabase database</li>
                  <li>Verify that the table has the correct column names (loginid, userrole, etc.)</li>
                  <li>Check that RLS (Row Level Security) policies allow access to the data</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
