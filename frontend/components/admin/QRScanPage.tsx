import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Upload, QrCode, Camera, CheckCircle, AlertCircle, User, Phone, Calendar, IdCard, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import backend from "~backend/client";
import type { User } from "~backend/user/types";
import jsQR from "jsqr";

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
  const [isAddingToQueue, setIsAddingToQueue] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  const parseQRCodeData = (rawData: string): QRCodeData | null => {
    try {
      console.log("[QR Scanner] === PARSING QR CODE DATA ===");
      console.log("[QR Scanner] Raw QR code data:", rawData);
      
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
      console.log("[QR Scanner] Split lines:", lines);
      
      const data: Partial<QRCodeData> = {};
      
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        console.log("[QR Scanner] Processing line - Key:", key.toLowerCase().trim(), "Value:", value);
        
        switch (key.toLowerCase().trim()) {
          case 'name':
            data.name = value;
            console.log("[QR Scanner] Set name:", value);
            break;
          case 'parent':
            data.parent = value;
            console.log("[QR Scanner] Set parent:", value);
            break;
          case 'alternate pickup by':
            data.alternatePickupBy = value;
            console.log("[QR Scanner] Set alternatePickupBy:", value);
            break;
          case 'phone':
            data.phone = value;
            console.log("[QR Scanner] Set phone:", value);
            break;
          case 'parent id':
            data.parentId = value;
            console.log("[QR Scanner] Set parentId:", value);
            break;
          case 'date':
            data.date = value;
            console.log("[QR Scanner] Set date:", value);
            break;
        }
      }
      
      console.log("[QR Scanner] Parsed data object:", data);
      
      // Validate required fields
      if (!data.phone) {
        console.error("[QR Scanner] Missing phone field in QR code data");
        return null;
      }
      
      // For alternate contacts, we need both parent and alternate pickup by
      if (data.parent && data.alternatePickupBy) {
        const result = {
          parent: data.parent,
          alternatePickupBy: data.alternatePickupBy,
          phone: data.phone,
          parentId: data.parentId,
          date: data.date || new Date().toLocaleDateString()
        };
        console.log("[QR Scanner] Returning alternate contact data:", result);
        return result;
      }
      
      // For regular contacts, we need a name
      if (data.name) {
        const result = {
          name: data.name,
          phone: data.phone,
          parentId: data.parentId,
          date: data.date || new Date().toLocaleDateString()
        };
        console.log("[QR Scanner] Returning regular contact data:", result);
        return result;
      }
      
      console.error("[QR Scanner] QR code data doesn't match expected format");
      console.error("[QR Scanner] Expected either (name + phone) or (parent + alternatePickupBy + phone)");
      return null;
    } catch (error) {
      console.error("[QR Scanner] Error parsing QR code data:", error);
      return null;
    }
  };

  const scanQRCodeFromImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          
          if (!imageData) {
            reject(new Error('Failed to get image data'));
            return;
          }
          
          // Use jsQR to scan the QR code
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          if (code) {
            console.log("[QR Scanner] QR code detected:", code.data);
            resolve(code.data);
          } else {
            // Try with inversion attempts for better detection
            const codeInverted = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "attemptBoth",
            });
            
            if (codeInverted) {
              console.log("[QR Scanner] QR code detected with inversion:", codeInverted.data);
              resolve(codeInverted.data);
            } else {
              reject(new Error('No QR code found in the image. Please ensure the image contains a clear, readable QR code.'));
            }
          }
          
        } catch (error) {
          console.error("[QR Scanner] Error processing image:", error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("[QR Scanner] === FILE SELECTED ===");
      console.log("[QR Scanner] File name:", file.name);
      console.log("[QR Scanner] File type:", file.type);
      console.log("[QR Scanner] File size:", file.size, "bytes");
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error("[QR Scanner] Invalid file type:", file.type);
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setScanResult(null);
      console.log("[QR Scanner] File selected successfully");
    }
  };

  const handleScanQRCode = async () => {
    if (!selectedFile) {
      console.error("[QR Scanner] No file selected for scanning");
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
      
      console.log("[QR Scanner] === STARTING QR CODE SCAN ===");
      console.log("[QR Scanner] Scanning QR code from file:", selectedFile.name);
      
      // Attempt to scan QR code from image
      const rawData = await scanQRCodeFromImage(selectedFile);
      console.log("[QR Scanner] Raw QR code data received:", rawData);
      
      // Parse the QR code data
      const parsedData = parseQRCodeData(rawData);
      console.log("[QR Scanner] Parsed QR code data:", parsedData);
      
      if (parsedData) {
        setScanResult({
          success: true,
          data: parsedData,
          rawData: rawData
        });
        
        const contactName = parsedData.alternatePickupBy || parsedData.name || 'Contact';
        console.log("[QR Scanner] QR code scan successful for contact:", contactName);
        
        toast({
          title: "QR Code Scanned Successfully",
          description: `Found contact information for ${contactName}`,
        });
      } else {
        console.error("[QR Scanner] Failed to parse QR code data");
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
      console.error("[QR Scanner] QR code scan error:", error);
      
      let errorMessage = "Failed to scan QR code. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setScanResult({
        success: false,
        error: errorMessage,
      });
      
      toast({
        title: "Scan Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      console.log("[QR Scanner] === QR CODE SCAN COMPLETE ===");
    }
  };

  const handleAddToQueue = async () => {
    if (!scanResult?.success || !scanResult.data) {
      console.error("[QR Scanner] No valid scan data available for adding to queue");
      toast({
        title: "No Valid Scan Data",
        description: "Please scan a valid QR code first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAddingToQueue(true);
      const qrData = scanResult.data;
      
      console.log("[QR Scanner] === ADDING TO DISMISSAL QUEUE ===");
      console.log("[QR Scanner] QR data to process:", qrData);
      
      // Get parent ID from QR data
      const parentId = qrData.parentId;
      
      if (!parentId) {
        console.error("[QR Scanner] No parent ID in QR code data");
        toast({
          title: "Missing Parent ID",
          description: "QR code does not contain a parent ID. Cannot add to queue.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("[QR Scanner] Parent ID:", parentId);
      
      // Get students for this parent
      console.log("[QR Scanner] Fetching students for parent:", parentId);
      const studentsResponse = await backend.student.getStudentsByParent({ parentId });
      console.log("[QR Scanner] Students response:", studentsResponse);
      
      if (!studentsResponse.students || studentsResponse.students.length === 0) {
        console.error("[QR Scanner] No students found for parent:", parentId);
        toast({
          title: "No Students Found",
          description: `No students found for parent ID: ${parentId}`,
          variant: "destructive",
        });
        return;
      }
      
      const students = studentsResponse.students;
      console.log("[QR Scanner] Found", students.length, "student(s)");
      
      // Update each student's dismissal status
      let successCount = 0;
      let errorCount = 0;
      
      for (const student of students) {
        try {
          console.log("[QR Scanner] Updating student:", student.studentId);
          
          const updateResponse = await backend.student.updateDismissalStatusByStudent({
            studentId: student.studentId,
            dismissalQueueStatus: "InQueue",
            addToQueueMethod: "QRScan",
            dismissedAt: new Date(),
            userId: user.userId
          });
          
          console.log("[QR Scanner] Update response for", student.studentId, ":", updateResponse);
          
          if (updateResponse.success) {
            successCount++;
          } else {
            errorCount++;
            console.error("[QR Scanner] Failed to update student:", student.studentId, updateResponse.error);
          }
        } catch (studentError) {
          errorCount++;
          console.error("[QR Scanner] Error updating student:", student.studentId, studentError);
        }
      }
      
      const contactDisplayName = qrData.alternatePickupBy || qrData.name || 'Contact';
      
      console.log("[QR Scanner] Update complete - Success:", successCount, "Errors:", errorCount);
      
      if (successCount > 0) {
        console.log("[QR Scanner] Successfully added to queue");
        toast({
          title: "Added to Queue",
          description: `${contactDisplayName} has been added to the dismissal queue. ${successCount} student record(s) updated.`,
        });
        
        // Clear the scan result after successful addition
        setScanResult(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        console.log("[QR Scanner] No records were updated");
        toast({
          title: "Update Failed",
          description: `Failed to update student records for ${contactDisplayName}.`,
          variant: "destructive",
        });
      }
      
      console.log("[QR Scanner] Cleared scan result and file selection");
      
    } catch (error) {
      console.error("[QR Scanner] Failed to add to queue:", error);
      
      let errorMessage = "Failed to add to dismissal queue. Please try again.";
      
      if (error instanceof Error) {
        console.error("[QR Scanner] Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        errorMessage = `Failed to add to queue: ${error.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAddingToQueue(false);
      console.log("[QR Scanner] === ADD TO QUEUE COMPLETE ===");
    }
  };

  const handleClearScan = () => {
    console.log("[QR Scanner] === CLEARING SCAN DATA ===");
    setScanResult(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log("[QR Scanner] Scan data cleared");
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

  const startCamera = async () => {
    try {
      console.log("[QR Scanner] Starting camera...");
      
      // Set camera open FIRST so video element is rendered
      setIsCameraOpen(true);
      
      const constraints = {
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("[QR Scanner] Media stream acquired");
      setStream(mediaStream);
      
      // Wait for next frame to ensure video element is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log("[QR Scanner] Video metadata loaded");
              resolve();
            };
          }
        });
        
        await videoRef.current.play();
        console.log("[QR Scanner] Video playing, dimensions:", videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
      }
    } catch (error) {
      console.error("[QR Scanner] Failed to start camera:", error);
      setIsCameraOpen(false);
      setStream(null);
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please ensure camera permissions are granted.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    console.log("[QR Scanner] Stopping camera...");
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraOpen(false);
    console.log("[QR Scanner] Camera stopped");
  };

  const scanFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log("[QR Scanner] Missing video or canvas ref");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.log("[QR Scanner] Failed to get canvas context");
      return;
    }

    console.log("[QR Scanner] Starting camera scan loop");

    const scan = () => {
      if (!isCameraOpen || !video) {
        return;
      }

      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      const width = video.videoWidth;
      const height = video.videoHeight;

      if (width === 0 || height === 0) {
        console.log("[QR Scanner] Video dimensions not ready yet");
        animationFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(video, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      if (code) {
        console.log("[QR Scanner] QR code detected from camera:", code.data);
        
        // Parse the QR code data
        const parsedData = parseQRCodeData(code.data);
        
        if (parsedData) {
          setScanResult({
            success: true,
            data: parsedData,
            rawData: code.data
          });
          
          const contactName = parsedData.alternatePickupBy || parsedData.name || 'Contact';
          toast({
            title: "QR Code Scanned Successfully",
            description: `Found contact information for ${contactName}`,
          });
          
          // Stop camera after successful scan
          stopCamera();
          return;
        } else {
          console.error("[QR Scanner] Failed to parse QR code data from camera");
        }
      }

      animationFrameRef.current = requestAnimationFrame(scan);
    };

    scan();
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current && videoRef.current.readyState >= 2) {
      console.log("[QR Scanner] Camera open effect triggered, starting scan");
      scanFromCamera();
    }
  }, [isCameraOpen, stream]);
  
  // Start scanning when video is ready
  useEffect(() => {
    if (!videoRef.current || !stream) return;
    
    const video = videoRef.current;
    const handleCanPlay = () => {
      console.log("[QR Scanner] Video can play, starting scan");
      scanFromCamera();
    };
    
    if (video.readyState >= 2) {
      handleCanPlay();
    } else {
      video.addEventListener('canplay', handleCanPlay);
      return () => video.removeEventListener('canplay', handleCanPlay);
    }
  }, [stream]);

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
            <span>Scan QR Code</span>
          </CardTitle>
          <CardDescription>
            Use your camera to scan QR codes or upload an image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Scanner */}
          {!isCameraOpen ? (
            <div className="space-y-4">
              <Button 
                onClick={startCamera} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                Open Camera to Scan
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              <div>
                <Label htmlFor="qr-upload">Upload QR Code Image</Label>
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
                  <QrCode className="w-4 h-4 mr-2" />
                  {isScanning ? 'Scanning...' : 'Scan Uploaded Image'}
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
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                <video 
                  ref={videoRef}
                  className="w-full h-auto"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute top-4 right-4">
                  <Button
                    onClick={stopCamera}
                    variant="destructive"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close Camera
                  </Button>
                </div>

                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white text-sm bg-black bg-opacity-50 inline-block px-4 py-2 rounded">
                    Position QR code within the frame
                  </p>
                </div>
              </div>
            </div>
          )}

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
                    disabled={isAddingToQueue}
                    className="bg-green-600 hover:bg-green-700 px-8"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {isAddingToQueue ? 'Adding to Queue...' : 'Add to Dismissal Queue'}
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
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">QR Scanner Ready</CardTitle>
        </CardHeader>
        <CardContent className="text-green-700">
          <div className="space-y-2 text-sm">
            <p><strong>QR Code Scanning:</strong> This component uses the jsQR library for real-time QR code detection.</p>
            <p><strong>Supported Features:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Automatic detection of QR codes in uploaded images</li>
              <li>Support for various image formats (JPG, PNG, GIF, WebP)</li>
              <li>Enhanced detection with inversion attempts for better reading</li>
              <li>Real-time parsing of contact information</li>
            </ul>
            <p className="mt-3"><strong>Expected QR Code Formats:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Alternate contacts</strong> include both parent name and alternate pickup person</li>
              <li><strong>Regular contacts</strong> include the contact name and optional parent ID</li>
              <li>All QR codes include phone number and date information</li>
            </ul>
            <p className="mt-3"><strong>Queue Update Process:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>The system will find the currently open queue</li>
              <li>Update existing dismissal queue records with parent/contact information</li>
              <li>Set dismissal status to 'InQueue' and QR scanned location to 'A'</li>
              <li>If no open queue exists, an error will be displayed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
