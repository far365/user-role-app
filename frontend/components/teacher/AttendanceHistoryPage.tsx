import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { User as UserType } from "~backend/user/types";

interface AttendanceHistoryPageProps {
  user: UserType;
  onBack: () => void;
}

export function AttendanceHistoryPage({ user, onBack }: AttendanceHistoryPageProps) {
  const formatLastLogin = (lastLogin: Date | null) => {
    if (!lastLogin) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return lastLogin.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant={user.userStatus === 'Active' ? 'default' : 'destructive'}
              className={user.userStatus === 'Active' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {user.userStatus}
            </Badge>
            <span className="text-sm text-gray-500">
              Last login: {formatLastLogin(user.lastLoginDTTM)}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 whitespace-nowrap">Attendance History</h3>
          <p className="text-sm text-gray-600">
            View historical attendance records.
          </p>
        </div>
      </div>

      <Button 
        variant="outline" 
        onClick={onBack}
        className="inline-flex items-center"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Return to Teacher Dashboard
      </Button>
    </div>
  );
}
