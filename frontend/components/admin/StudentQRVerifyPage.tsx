import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Upload, QrCode, Camera, X, CheckCircle, AlertCircle, IdCard } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import backend from "~backend/client";
import type { User } from "~backend/user/types";
import jsQR from "jsqr";

interface StudentQRVerifyPageProps {
  user: User;
  onBack: () => void;
}

interface VerificationResult {
  valid: boolean;
  studentId?: string;
  error?: string;
}

export function StudentQRVerifyPage({ user, onBack }: StudentQRVerifyPageProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
            resolve(code.data);
          } else {
            reject(new Error('No QR code found in the image. Please ensure the image contains a clear, readable QR code.'));
          }
        } catch (error) {
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

  const verifyQRToken = async (token: string) => {
    try {
      const result = await backend.student.verifyQRToken({ token });
      setVerificationResult(result);
      setShowResultDialog(true);
      
      if (result.valid) {
        toast({
          title: "QR Code Verified",
          description: `Student ID: ${result.studentId}`,
        });
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Invalid QR code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying QR token:", error);
      setVerificationResult({
        valid: false,
        error: error instanceof Error ? error.message : "Failed to verify QR code"
      });
      setShowResultDialog(true);
      toast({
        title: "Error",
        description: "Failed to verify QR code",
        variant: "destructive",
      });
    }
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
      setVerificationResult(null);
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
      setVerificationResult(null);
      
      const rawData = await scanQRCodeFromImage(selectedFile);
      await verifyQRToken(rawData);
      
    } catch (error) {
      console.error("QR code scan error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to scan QR code. Please try again.";
      
      toast({
        title: "Scan Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleClearScan = () => {
    setVerificationResult(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateAttendance = async () => {
    if (!verificationResult?.valid || !verificationResult.studentId) {
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
        studentId: verificationResult.studentId,
        userId: user.userID
      });
      
      if (response.success) {
        toast({
          title: "Attendance Updated",
          description: `Student ${verificationResult.studentId} attendance updated via QR code`,
        });
        
        setShowResultDialog(false);
        handleClearScan();
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update attendance status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update attendance:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update attendance",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
            videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          }
        });
        
        await videoRef.current.play();
      }
    } catch (error) {
      console.error("Failed to start camera:", error);
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
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

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
        verifyQRToken(code.data);
        stopCamera();
        return;
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
    const handleCanPlay = () => {
      scanFromCamera();
    };
    
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
        <h2 className="text-2xl font-bold text-gray-900">Scan QR Code for Student</h2>
        <p className="text-gray-600">Scan student ID QR code to verify and generate new code</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="w-5 h-5" />
            <span>Scan Student QR Code</span>
          </CardTitle>
          <CardDescription>
            Use your camera to scan student QR codes or upload an image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                <Label htmlFor="qr-upload">Upload Student QR Code Image</Label>
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
                
                {(selectedFile || verificationResult) && (
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Scanning QR code...</p>
                <p className="text-xs text-gray-500 mt-1">Processing and verifying token</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {verificationResult?.valid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span>{verificationResult?.valid ? "QR Code Verified" : "Verification Failed"}</span>
            </DialogTitle>
            <DialogDescription>
              {verificationResult?.valid 
                ? "The student QR code has been successfully verified."
                : "The QR code could not be verified."}
            </DialogDescription>
          </DialogHeader>
          
          <div className={`p-4 rounded-lg ${verificationResult?.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {verificationResult?.valid ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <IdCard className="w-5 h-5 text-green-700" />
                  <span className="font-medium text-green-900">Student ID</span>
                </div>
                <div className="pl-7">
                  <p className="text-2xl font-bold text-green-900">{verificationResult.studentId}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{verificationResult?.error || "Unknown error"}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {verificationResult?.valid && (
              <Button 
                onClick={handleUpdateAttendance}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isProcessing ? "Processing..." : "Update Attendance"}
              </Button>
            )}
            <Button 
              onClick={() => {
                setShowResultDialog(false);
                handleClearScan();
              }}
              variant={verificationResult?.valid ? "outline" : "destructive"}
              disabled={isProcessing}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-2 text-sm">
            <p><strong>Purpose:</strong> Scan a student's QR code to verify and decrypt their student ID.</p>
            <p><strong>Process:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use the camera or upload an image of the student QR code</li>
              <li>The system will verify the QR code signature</li>
              <li>If valid, the decrypted student ID will be displayed</li>
              <li>The student ID can then be used to generate a new QR code</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
