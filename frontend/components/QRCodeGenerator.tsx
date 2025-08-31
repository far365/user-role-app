import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode } from "lucide-react";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  name: string;
  phone: string;
  title: string;
  parentID?: string;
  isAlternateContact?: boolean;
  alternateName?: string;
  parentName?: string;
}

export function QRCodeGenerator({ name, phone, title, parentID, isAlternateContact = false, alternateName, parentName }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const generateQRCode = async () => {
    if (!name || !phone) {
      return;
    }

    setIsGenerating(true);
    
    try {
      const currentDate = new Date().toLocaleDateString();
      let qrData = "";
      
      if (isAlternateContact && alternateName && parentName) {
        // For alternate contacts, include both parent and alternate information
        qrData = `Parent: ${parentName}\nAlternate Pickup by: ${alternateName}\nPhone: ${phone}\nDate: ${currentDate}`;
        if (parentID) {
          qrData = `Parent: ${parentName}\nAlternate Pickup by: ${alternateName}\nPhone: ${phone}\nParent ID: ${parentID}\nDate: ${currentDate}`;
        }
      } else if (parentID) {
        // For regular parent contacts
        qrData = `Name: ${name}\nPhone: ${phone}\nParent ID: ${parentID}\nDate: ${currentDate}`;
      } else {
        // Fallback for contacts without parent ID
        qrData = `Name: ${name}\nPhone: ${phone}\nDate: ${currentDate}`;
      }
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
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
    const fileName = isAlternateContact && alternateName 
      ? `qr-code-alternate-${alternateName.replace(/\s+/g, '-').toLowerCase()}.png`
      : `qr-code-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.download = fileName;
    link.href = qrCodeUrl;
    link.click();
  };

  const isDisabled = !name || !phone;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isDisabled}
          className="flex items-center space-x-2 border-green-300 bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <QrCode className="w-4 h-4" />
          <span>Generate QR Code</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code - {title}</DialogTitle>
          <DialogDescription>
            QR code containing contact information for {isAlternateContact && alternateName ? `${alternateName} (alternate pickup for ${parentName})` : name || 'this contact'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          {isGenerating ? (
            <div className="flex items-center justify-center w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Generating QR Code...</p>
              </div>
            </div>
          ) : qrCodeUrl ? (
            <div className="text-center">
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="mx-auto border rounded-lg shadow-sm"
              />
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                {isAlternateContact && alternateName && parentName ? (
                  <>
                    <p><strong>Parent:</strong> {parentName}</p>
                    <p><strong>Alternate Pickup by:</strong> {alternateName}</p>
                    <p><strong>Phone:</strong> {phone}</p>
                    {parentID && <p><strong>Parent ID:</strong> {parentID}</p>}
                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                  </>
                ) : (
                  <>
                    <p><strong>Name:</strong> {name}</p>
                    <p><strong>Phone:</strong> {phone}</p>
                    {parentID && <p><strong>Parent ID:</strong> {parentID}</p>}
                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-sm text-gray-500">QR Code will appear here</p>
            </div>
          )}
          
          {qrCodeUrl && (
            <div className="flex space-x-2">
              <Button onClick={downloadQRCode} variant="outline" size="sm">
                Download QR Code
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
