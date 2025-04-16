import { useState } from 'react';
import { 
  FaFacebook, 
  FaTwitter, 
  FaWhatsapp, 
  FaEnvelope, 
  FaLink,
  FaShareAlt
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { FiCopy } from 'react-icons/fi';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  iconOnly?: boolean;
}

export function ShareButton({ 
  url, 
  title, 
  description = '', 
  image = '',
  className,
  variant = 'outline',
  size = 'default',
  iconOnly = false
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Add the current domain if the URL is relative
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  
  // Sharing functions
  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}&quote=${encodeURIComponent(title)}`;
    window.open(facebookUrl, '_blank');
    setIsOpen(false);
  };
  
  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`;
    window.open(twitterUrl, '_blank');
    setIsOpen(false);
  };
  
  const shareToWhatsApp = () => {
    const whatsappText = `${title} - ${fullUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
  };
  
  const shareViaEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${title}\n\n${description || ''}\n\n${fullUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setIsOpen(false);
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
        duration: 3000,
      });
      setIsOpen(false);
    }).catch(err => {
      console.error('Failed to copy link:', err);
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
        duration: 3000,
      });
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={cn(
            "font-medium",
            iconOnly ? "p-2" : "",
            className
          )}
        >
          <FaShareAlt className={cn("h-4 w-4", iconOnly ? "" : "mr-2")} />
          {!iconOnly && "Share"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="text-sm font-medium mb-2">Share this {description ? 'deal' : 'page'}</div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          <Button 
            onClick={shareToFacebook}
            variant="outline" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-blue-50 hover:bg-blue-100 border-blue-100"
          >
            <FaFacebook className="h-5 w-5 text-blue-600" />
          </Button>
          <Button 
            onClick={shareToTwitter}
            variant="outline" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-blue-50 hover:bg-blue-100 border-blue-100"
          >
            <FaTwitter className="h-5 w-5 text-blue-400" />
          </Button>
          <Button 
            onClick={shareToWhatsApp}
            variant="outline" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-green-50 hover:bg-green-100 border-green-100"
          >
            <FaWhatsapp className="h-5 w-5 text-green-500" />
          </Button>
          <Button 
            onClick={shareViaEmail}
            variant="outline" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-gray-50 hover:bg-gray-100 border-gray-100"
          >
            <FaEnvelope className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={copyToClipboard}
            variant="secondary" 
            className="w-full text-sm justify-start" 
            size="sm"
          >
            <FiCopy className="h-4 w-4 mr-2" />
            <span className="truncate max-w-[180px]">{fullUrl}</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}