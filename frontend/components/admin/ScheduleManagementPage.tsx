import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { User } from "~backend/user/types";

interface ScheduleManagementPageProps {
  user: User;
  onBack: () => void;
}

export function ScheduleManagementPage({ user, onBack }: ScheduleManagementPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Schedule Management</h2>
        <p className="text-gray-600">Manage class schedules and timings</p>
      </div>
    </div>
  );
}
