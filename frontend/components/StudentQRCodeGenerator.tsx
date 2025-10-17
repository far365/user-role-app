import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode } from "lucide-react";
import QRCode from "qrcode";
import backend from "~backend/client";
import { useToast } from "@/components/ui/use-toast";

interface StudentQRCodeGeneratorProps {
  studentId: string;
  studentName: string;
  grade: string;
}

export function StudentQRCodeGenerator({ studentId, studentName, grade }: StudentQRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const generateQRCode = async () => {
    if (!studentId) {
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await backend.student.generateQRToken({ studentId });
      const qrData = response.token;
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 96,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !qrCodeUrl) {
      generateQRCode();
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    const fileName = `student-qr-${studentId}.png`;
    link.download = fileName;
    link.href = qrCodeUrl;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 text-xs h-8 px-3"
        >
          <QrCode className="w-3 h-3 mr-1.5" />
          Generate Student QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Student QR Code</DialogTitle>
          <DialogDescription>
            QR code for {studentName}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          {isGenerating ? (
            <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">Generating...</p>
              </div>
            </div>
          ) : qrCodeUrl ? (
            <div className="text-center">
              <img 
                src={qrCodeUrl} 
                alt="Student QR Code" 
                className="mx-auto border rounded-lg shadow-sm w-24 h-24"
                style={{ width: '96px', height: '96px' }}
              />
              <div className="mt-2 text-sm font-medium text-gray-900">
                {studentName}
              </div>
              <div className="text-xs text-gray-600">
                ({grade})
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-xs text-gray-500">QR Code will appear here</p>
            </div>
          )}
          
          {qrCodeUrl && (
            <div className="flex space-x-2">
              <Button onClick={downloadQRCode} variant="outline" size="sm">
                Download
              </Button>
              <Button onClick={generateQRCode} variant="outline" size="sm">
                Regenerate
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
