import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, MapPin, Clock, AlertTriangle } from "lucide-react";
import type { User } from "~backend/user/types";

interface DispatchDashboardProps {
  user: User;
}

export function DispatchDashboard({ user }: DispatchDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Dispatch Dashboard</h2>
        <p className="text-gray-600">
          Monitor transportation routes, track vehicles, and manage schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">In service</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94%</div>
            <p className="text-xs text-muted-foreground">Performance today</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">2</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Route Status</CardTitle>
            <CardDescription>Current status of all active routes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Route A - Morning Pickup</p>
                  <p className="text-xs text-gray-500">On time • Stop 3 of 8 • ETA: 8:45 AM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Route B - Morning Pickup</p>
                  <p className="text-xs text-gray-500">5 min delay • Stop 2 of 6 • ETA: 8:50 AM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Route C - Morning Pickup</p>
                  <p className="text-xs text-gray-500">On time • Stop 5 of 7 • ETA: 8:55 AM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest dispatch activities and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm">Vehicle 003 completed Route A</p>
                <p className="text-xs text-gray-500">All students delivered • 15 minutes ago</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm">Traffic delay reported on Route B</p>
                <p className="text-xs text-gray-500">Driver notified • 20 minutes ago</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm">Vehicle 007 maintenance scheduled</p>
                <p className="text-xs text-gray-500">Tomorrow 2:00 PM • Reminder set</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
