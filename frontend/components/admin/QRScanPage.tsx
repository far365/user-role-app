import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Upload, QrCode, Camera, CheckCircle, AlertCircle, User, Phone, Calendar, IdCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import backend from "~backend/client";
import type { User } from "~backend/user/types";

interface QRScanPageProps {
  user: User;
  onBack: () => void;
}

interface QRCodeData {
  name?: string;
  phone: string;
  parentId?: string;
  date: string;
  parent?: string;
  alternatePickupBy?: string;
}

interface ScanResult {
  success: boolean;
  data?: QRCodeData;
  error?: string;
  rawData?: string;
}

export function QRScanPage({ user, onBack }: QRScanPageProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseQRCodeData = (rawData: string): QRCodeData | null => {
    try {
      console.log("Parsing QR code data:", rawData);
      
      // Expected formats:
      // Regular parent:
      // Name: John Doe
      // Phone: 1234567890
      // Parent ID: p0001 (optional)
      // Date: 12/1/2024
      //
      // Alternate contact:
      // Parent: John Doe
      // Alternate Pickup by: Jane Smith
      // Phone: 1234567890
      // Parent ID: p0001 (optional)
      // Date: 12/1/2024
      
      const lines = rawData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const data: Partial<QRCodeData> = {};
      
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        switch (key.toLowerCase().trim()) {
          case 'name':
            data.name = value;
            break;
          case 'parent':
            data.parent = value;
            break;
          case 'alternate pickup by':
            data.alternatePickupBy = value;
            break;
          case 'phone':
            data.phone = value;
            break;
          case 'parent id':
            data.parentId = value;
            break;
          case 'date':
            data.date = value;
            break;
        }
      }
      
      // Validate required fields
      if (!data.phone) {
        console.error("Missing phone field in QR code data");
        return null;
      }
      
      // For alternate contacts, we need both parent and alternate pickup by
      if (data.parent && data.alternatePickupBy) {
        return {
          parent: data.parent,
          alternatePickupBy: data.alternatePickupBy,
          phone: data.phone,
          parentId: data.parentId,
          date: data.date || new Date().toLocaleDateString()
        };
      }
      
      // For regular contacts, we need a name
      if (data.name) {
        return {
          name: data.name,
          phone: data.phone,
          parentId: data.parentId,
          date: data.date || new Date().toLocaleDateString()
        };
      }
      
      console.error("QR code data doesn't match expected format");
      return null;
    } catch (error) {
      console.error("Error parsing QR code data:", error);
      return null;
    }
  };

  const simulateQRCodeScan = async (file: File): Promise<string> => {
    // For testing purposes, we'll simulate different QR code contents based on filename
    // In a real implementation, this would use a QR code reading library
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const filename = file.name.toLowerCase();
        
        if (filename.includes('alternate')) {
          // Simulate an alternate contact QR code with both parent and alternate info
          const mockData = `Parent: John Smith
Alternate Pickup by: Jane Doe
Phone: (555) 987-6543
Parent ID: p0001
Date: ${new Date().toLocaleDateString()}`;
          resolve(mockData);
        } else if (filename.includes('parent') || filename.includes('qr')) {
          // Simulate a parent QR code
          const mockData = `Name: John Smith
Phone: (555) 123-4567
Parent ID: p0001
Date: ${new Date().toLocaleDateString()}`;
          resolve(mockData);
        } else {
          // Default mock data
          const mockData = `Name: Test Parent
Phone: (555) 000-0000
Date: ${new Date().toLocaleDateString()}`;
          resolve(mockData);
        }
      }, 1500); // Simulate processing time
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setScanResult(null);
    }
  };

  const handleScanQRCode = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a QR code image to scan",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsScanning(true);
      setScanResult(null);
      
      console.log("Scanning QR code from file:", selectedFile.name);
      
      // Simulate QR code scanning
      const rawData = await simulateQRCodeScan(selectedFile);
      console.log("Raw QR code data:", rawData);
      
      // Parse the QR code data
      const parsedData = parseQRCodeData(rawData);
      
      if (parsedData) {
        setScanResult({
          success: true,
          data: parsedData,
          rawData: rawData
        });
        
        const contactName = parsedData.alternatePickupBy || parsedData.name || 'Contact';
        toast({
          title: "QR Code Scanned Successfully",
          description: `Found contact information for ${contactName}`,
        });
      } else {
        setScanResult({
          success: false,
          error: "Could not parse QR code data. Please ensure it's a valid parent/contact QR code.",
          rawData: rawData
        });
        
        toast({
          title: "Scan Failed",
          description: "Could not parse QR code data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("QR code scan error:", error);
      
      setScanResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
      
      toast({
        title: "Scan Error",
        description: "Failed to scan QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddToQueue = async () => {
    if (!scanResult?.success || !scanResult.data) {
      toast({
        title: "No Valid Scan Data",
        description: "Please scan a valid QR code first",
        variant: "destructive",
      });
      return;
    }

    try {
      const qrData = scanResult.data;
      
      // Generate today's queue ID
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const queueId = `${year}${month}${day}`;
      
      console.log("Adding to dismissal queue:", {
        queueId,
        contactInfo: qrData
      });
      
      // Determine the contact name and type
      let parentName = "";
      let alternateName = "";
      
      if (qrData.parent && qrData.alternatePickupBy) {
        // This is an alternate contact
        parentName = qrData.parent;
        alternateName = qrData.alternatePickupBy;
      } else if (qrData.name) {
        // This is a regular parent contact
        parentName = qrData.name;
      }
      
      // Add to dismissal queue
      await backend.queue.addToDismissalQueue({
        queueId: queueId,
        classBuilding: "A", // Default building
        dismissalQueueStatus: "Standby",
        parentId: qrData.parentId,
        parentName: parentName || undefined,
        alternateName: alternateName || undefined,
        addToQueueMethod: "QR",
        qrScannedAtBuilding: "A"
      });
      
      const contactDisplayName = alternateName || parentName || 'Contact';
      toast({
        title: "Added to Queue",
        description: `${contactDisplayName} has been added to the dismissal queue`,
      });
      
      // Clear the scan result after successful addition
      setScanResult(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error("Failed to add to queue:", error);
      toast({
        title: "Error",
        description: "Failed to add to dismissal queue. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearScan = () => {
    setScanResult(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatPhone = (phone: string) => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX if 10 digits
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    return phone; // Return original if not 10 digits
  };

  const isAlternateContact = scanResult?.data?.parent && scanResult?.data?.alternatePickupBy;

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
        <h2 className="text-2xl font-bold text-gray-900">QR Code Scanner</h2>
        <p className="text-gray-600">Scan parent/contact QR codes to add them to the dismissal queue</p>
      </div>

      {/* Scanner Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="w-5 h-5" />
            <span>Upload QR Code Image</span>
          </CardTitle>
          <CardDescription>
            For testing purposes, upload a QR code image file to simulate scanning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="qr-upload">Select QR Code Image</Label>
            <Input
              ref={fileInputRef}
              id="qr-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPG, PNG, GIF, WebP
            </p>
          </div>

          {selectedFile && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Selected File:</span>
                <span className="text-sm text-blue-700">{selectedFile.name}</span>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <Button 
              onClick={handleScanQRCode} 
              disabled={!selectedFile || isScanning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              {isScanning ? 'Scanning...' : 'Scan QR Code'}
            </Button>
            
            {(selectedFile || scanResult) && (
              <Button 
                onClick={handleClearScan} 
                variant="outline"
                disabled={isScanning}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Scanning Progress */}
          {isScanning && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Scanning QR code...</p>
                <p className="text-xs text-gray-500 mt-1">Processing image and extracting data</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Results - Enhanced Display */}
      {scanResult && (
        <Card className={scanResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${scanResult.success ? "text-green-800" : "text-red-800"}`}>
              {scanResult.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>QR Code Scan {scanResult.success ? 'Successful' : 'Failed'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scanResult.success && scanResult.data ? (
              <div className="space-y-6">
                {/* Contact Type Badge */}
                <div className="flex justify-between items-start">
                  <Badge 
                    variant="secondary" 
                    className={`text-sm px-3 py-1 ${isAlternateContact ? "bg-purple-100 text-purple-800 border-purple-300" : scanResult.data.parentId ? "bg-blue-100 text-blue-800 border-blue-300" : "bg-gray-100 text-gray-800 border-gray-300"}`}
                  >
                    {isAlternateContact ? "Alternate Contact" : scanResult.data.parentId ? "Registered Parent" : "Contact"}
                  </Badge>
                  <div className="text-xs text-gray-500">
                    Scanned: {new Date().toLocaleTimeString()}
                  </div>
                </div>

                <Separator />

                {/* Contact Information - Enhanced Layout */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Parent Name (for alternate contacts) */}
                    {isAlternateContact && scanResult.data.parent && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">Parent Name</span>
                        </div>
                        <div className="pl-6">
                          <p className="text-lg font-semibold text-gray-900">{scanResult.data.parent}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Contact Name */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {isAlternateContact ? "Alternate Pickup By" : "Contact Name"}
                        </span>
                      </div>
                      <div className="pl-6">
                        <p className="text-lg font-semibold text-gray-900">
                          {scanResult.data.alternatePickupBy || scanResult.data.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Phone */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-medium">Phone Number</span>
                      </div>
                      <div className="pl-6">
                        <p className="text-lg font-semibold text-gray-900">{formatPhone(scanResult.data.phone)}</p>
                      </div>
                    </div>
                    
                    {/* Parent ID */}
                    {scanResult.data.parentId && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <IdCard className="w-4 h-4" />
                          <span className="text-sm font-medium">Parent ID</span>
                        </div>
                        <div className="pl-6">
                          <p className="text-lg font-semibold text-gray-900">{scanResult.data.parentId}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Date */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">QR Code Date</span>
                      </div>
                      <div className="pl-6">
                        <p className="text-lg font-semibold text-gray-900">{scanResult.data.date}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Summary Box */}
                <div className="bg-white border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Scan Summary</h4>
                  <p className="text-sm text-green-700">
                    {isAlternateContact ? (
                      <>
                        Successfully identified <strong>{scanResult.data.alternatePickupBy}</strong> as an{" "}
                        <strong>alternate contact</strong> for parent <strong>{scanResult.data.parent}</strong>.
                        {scanResult.data.parentId && (
                          <span> Parent ID: <strong>{scanResult.data.parentId}</strong></span>
                        )}
                      </>
                    ) : (
                      <>
                        Successfully identified <strong>{scanResult.data.name}</strong> as a{" "}
                        <strong>{scanResult.data.parentId ? "registered parent" : "contact"}</strong>.
                        {scanResult.data.parentId && (
                          <span> Parent ID: <strong>{scanResult.data.parentId}</strong></span>
                        )}
                      </>
                    )}
                  </p>
                </div>

                {/* Action Button */}
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={handleAddToQueue}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 px-8"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Add to Dismissal Queue
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Scan Error</h4>
                  <p className="text-sm text-red-700">
                    {scanResult.error || "Unknown error occurred while scanning the QR code"}
                  </p>
                </div>
                
                {scanResult.rawData && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-red-800">Raw QR Code Data:</h4>
                    <div className="bg-white border border-red-200 rounded p-3">
                      <pre className="text-xs text-red-700 overflow-auto max-h-32 whitespace-pre-wrap">
                        {scanResult.rawData}
                      </pre>
                    </div>
                  </div>
                )}
                
                <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Expected QR Code Formats:</h4>
                  <div className="text-xs text-red-700 space-y-3">
                    <div>
                      <p className="font-medium">Regular Parent Contact:</p>
                      <p>Name: [Contact Name]</p>
                      <p>Phone: [Phone Number]</p>
                      <p>Parent ID: [Parent ID] (optional)</p>
                      <p>Date: [Date]</p>
                    </div>
                    <div>
                      <p className="font-medium">Alternate Contact:</p>
                      <p>Parent: [Parent Name]</p>
                      <p>Alternate Pickup by: [Alternate Name]</p>
                      <p>Phone: [Phone Number]</p>
                      <p>Parent ID: [Parent ID] (optional)</p>
                      <p>Date: [Date]</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-2 text-sm">
            <p><strong>For testing purposes:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Upload any image file to simulate QR code scanning</li>
              <li>Files with "alternate" in the name will simulate an alternate contact QR code with both parent and alternate information</li>
              <li>Files with "parent" or "qr" in the name will simulate a registered parent QR code</li>
              <li>Other files will generate default test data</li>
              <li>Successfully scanned contacts can be added to the dismissal queue</li>
            </ul>
            <p className="mt-3"><strong>QR Code Formats:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Alternate contacts</strong> include both parent name and alternate pickup person</li>
              <li><strong>Regular contacts</strong> include the contact name and optional parent ID</li>
              <li>All QR codes include phone number and date information</li>
            </ul>
            <p className="mt-3"><strong>In production:</strong> This would use camera access or a QR code scanning library to read actual QR codes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
