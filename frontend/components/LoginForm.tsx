import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { LogIn } from "lucide-react";
import backend from "~backend/client";
import type { User } from "~backend/user/types";

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [loginID, setLoginID] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

    try {
      // Generate a simple device ID
      const deviceID = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await backend.user.login({
        loginID: loginID.trim(),
        password: "demo", // Using a dummy password since it's not validated
        deviceID,
      });

      if (response.success) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${response.user.displayName}!`,
        });
        onLogin(response.user);
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // More specific error handling
      let errorMessage = "Invalid login ID or user account is disabled";
      
      if (error instanceof Error) {
        if (error.message.includes("User not found")) {
          errorMessage = "Login ID not found. Please check your login ID and try again.";
        } else if (error.message.includes("disabled")) {
          errorMessage = "Your account has been disabled. Please contact support.";
        }
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
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
                placeholder="Enter your login ID (e.g., p0001)"
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
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Available Login IDs:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div>p0001 - Usman Hadi (Parent)</div>
              <div className="mt-2 text-gray-500">
                Use any login ID from your Supabase usersrcd table
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
