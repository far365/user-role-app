import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Upload, QrCode, Camera, CheckCircle, AlertCircle, User, X, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import backend from "~backend/client";
import type { User } from "~backend/user/types";
import jsQR from "jsqr";

interface StudentQRScanPageProps {
  user: User;
  onBack: () => void;
}

interface ScanResult {
  success: boolean;
  studentId?: string;
  studentName?: string;
  grade?: string;
  error?: string;
  rawData?: string;
}

export function StudentQRScanPage({ user, onBack }: StudentQRScanPageProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

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
          
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });
          
          if (code) {
            console.log("[Student QR Scanner] QR code detected:", code.data);
            resolve(code.data);
          } else {
            reject(new Error('No QR code found in the image. Please ensure the image contains a clear, readable QR code.'));
          }
        } catch (error) {
          console.error("[Student QR Scanner] Error processing image:", error);
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

  const verifyAndLookupStudent = async (token: string) => {
    const verifyResponse = await backend.student.verifyQRToken({ token });
    
    if (!verifyResponse.valid || !verifyResponse.studentId) {
      throw new Error(verifyResponse.error || "Invalid QR code");
    }

    const studentResponse = await backend.student.searchById({ 
      studentId: verifyResponse.studentId 
    });

    if (!studentResponse.students || studentResponse.students.length === 0) {
      throw new Error("Student not found in database");
    }

    return studentResponse.students[0];
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
      
      const rawData = await scanQRCodeFromImage(selectedFile);
      const student = await verifyAndLookupStudent(rawData);
      
      setScanResult({
        success: true,
        studentId: student.studentId,
        studentName: student.studentName,
        grade: student.grade,
        rawData: rawData
      });
      
      toast({
        title: "QR Code Verified",
        description: `Student: ${student.studentName}`,
      });
    } catch (error) {
      console.error("[Student QR Scanner] Error:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to scan QR code';
      
      setScanResult({
        success: false,
        error: errorMessage,
      });
      
      toast({
        title: "Scan Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateAttendance = async () => {
    if (!scanResult?.success || !scanResult.studentId) {
      toast({
        title: "No Valid Scan",
        description: "Please scan a valid student QR code first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      const response = await backend.queue.updateAttendanceStatusByQRCode({
        studentId: scanResult.studentId,
        userId: user.userID
      });
      
      if (response.success) {
        toast({
          title: "Attendance Updated",
          description: `${scanResult.studentName} attendance updated via QR code`,
        });
        
        setScanResult(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update attendance status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[Student QR Scanner] Failed to update attendance:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update attendance",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsDismissed = async () => {
    if (!scanResult?.success || !scanResult.studentId) {
      toast({
        title: "No Valid Scan",
        description: "Please scan a valid student QR code first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      const response = await backend.student.updateDismissalStatusByStudent({
        studentId: scanResult.studentId,
        dismissalQueueStatus: "Dismissed",
        addToQueueMethod: "QR",
        dismissedAt: new Date(),
        userId: user.userID
      });
      
      if (response.success) {
        toast({
          title: "Student Dismissed",
          description: `${scanResult.studentName} marked as dismissed`,
        });
        
        setScanResult(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast({
          title: "Update Failed",
          description: response.error || "Failed to update dismissal status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[Student QR Scanner] Failed to mark as dismissed:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark as dismissed",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearScan = () => {
    setScanResult(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      
      const constraints = {
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });
        
        await videoRef.current.play();
      }
    } catch (error) {
      console.error("[Student QR Scanner] Failed to start camera:", error);
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
  };

  const scanFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const scan = async () => {
      if (!isCameraOpen || !video) return;

      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      const width = video.videoWidth;
      const height = video.videoHeight;

      if (width === 0 || height === 0) {
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
        console.log("[Student QR Scanner] QR code detected from camera:", code.data);
        
        try {
          const student = await verifyAndLookupStudent(code.data);
          
          setScanResult({
            success: true,
            studentId: student.studentId,
            studentName: student.studentName,
            grade: student.grade,
            rawData: code.data
          });
          
          toast({
            title: "QR Code Verified",
            description: `Student: ${student.studentName}`,
          });
          
          stopCamera();
          return;
        } catch (error) {
          console.error("[Student QR Scanner] Failed to verify QR code:", error);
        }
      }

      animationFrameRef.current = requestAnimationFrame(scan);
    };

    scan();
  };

  useEffect(() => {
    return () => {
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
      scanFromCamera();
    }
  }, [isCameraOpen, stream]);
  
  useEffect(() => {
    if (!videoRef.current || !stream) return;
    
    const video = videoRef.current;
    const handleCanPlay = () => scanFromCamera();
    
    if (video.readyState >= 2) {
      handleCanPlay();
    } else {
      video.addEventListener('canplay', handleCanPlay);
      return () => video.removeEventListener('canplay', handleCanPlay);
    }
  }, [stream]);

  return (
    <div className="space-y-6">
      <div>
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Student QR Code Scanner</h2>
        <p className="text-gray-600">Scan student QR codes to mark them as dismissed</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="w-5 h-5" />
            <span>Scan Student QR Code</span>
          </CardTitle>
          <CardDescription>
            Use your camera to scan QR codes or upload an image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isCameraOpen ? (
            <div className="space-y-4">
              <Button 
                onClick={startCamera} 
                className="w-full bg-purple-600 hover:bg-purple-700"
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
                <Label htmlFor="qr-upload">Upload Student QR Code Image</Label>
                <Input
                  ref={fileInputRef}
                  id="qr-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>

              {selectedFile && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Selected File:</span>
                    <span className="text-sm text-purple-700">{selectedFile.name}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <Button 
                  onClick={handleScanQRCode} 
                  disabled={!selectedFile || isScanning}
                  className="bg-purple-600 hover:bg-purple-700"
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
                    Position student QR code within the frame
                  </p>
                </div>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Scanning and verifying QR code...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {scanResult && (
        <Card className={scanResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${scanResult.success ? "text-green-800" : "text-red-800"}`}>
              {scanResult.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>QR Code {scanResult.success ? 'Verified' : 'Invalid'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scanResult.success ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300">
                    Verified Student
                  </Badge>
                  <div className="text-xs text-gray-500">
                    Scanned: {new Date().toLocaleTimeString()}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">Student Name</span>
                      </div>
                      <div className="pl-6">
                        <p className="text-lg font-semibold text-gray-900">{scanResult.studentName}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <GraduationCap className="w-4 h-4" />
                        <span className="text-sm font-medium">Grade</span>
                      </div>
                      <div className="pl-6">
                        <p className="text-lg font-semibold text-gray-900">{scanResult.grade}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Verified</h4>
                  <p className="text-sm text-green-700">
                    QR code signature verified. Student ID: <strong>{scanResult.studentId}</strong>
                  </p>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <Button 
                    onClick={handleUpdateAttendance}
                    size="lg"
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 px-8"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {isProcessing ? 'Processing...' : 'Update Attendance'}
                  </Button>
                  <Button 
                    onClick={handleMarkAsDismissed}
                    size="lg"
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 px-8"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {isProcessing ? 'Processing...' : 'Mark as Dismissed'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Scan Error</h4>
                  <p className="text-sm text-red-700">
                    {scanResult.error || "Invalid or tampered QR code"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-800">Secure Student QR Codes</CardTitle>
        </CardHeader>
        <CardContent className="text-purple-700">
          <div className="space-y-2 text-sm">
            <p><strong>Security:</strong> Student QR codes are cryptographically signed to prevent tampering.</p>
            <p><strong>Verification:</strong> Each scan verifies the signature before accepting the student ID.</p>
            <p><strong>Action:</strong> Successfully scanned students are marked as dismissed in the system.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
