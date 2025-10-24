'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface ShareDialogProps {
  url?: string;
  title?: string;
  text?: string;
  children?: React.ReactNode;
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  buttonClassName?: string;
}

export function ShareDialog({
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = 'Check this out!',
  text = '',
  children,
  buttonVariant = 'default',
  buttonSize = 'default',
  buttonClassName = '',
}: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);

  useEffect(() => {
    // Check if native share is supported
    setSupportsNativeShare(
      typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    );
  }, []);

  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url,
    };

    if (supportsNativeShare) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          // If native share fails, fall back to dialog
          setOpen(true);
        }
      }
    } else {
      // Open custom dialog
      setOpen(true);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!', {
        description: 'The link has been copied to your clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error: any) {
      toast.error('Failed to copy', {
        description: error.message || 'Failed to copy link',
      });
    }
  };

  return (
    <>
      {children ? (
        <div onClick={handleShare} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <Button
          variant={buttonVariant}
          size={buttonSize}
          onClick={handleShare}
          className={buttonClassName}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this link</DialogTitle>
            <DialogDescription>
              Just send this QR code or link to your friends.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            {/* QR Code */}
            <QRCodeSVG
              imageSettings={{
                src: '/submark.svg',
                height: 40,
                width: 40,
                excavate: true,
              }}
              level="Q"
              boostLevel={true}
              fgColor="var(--color-background)"
              width={200}
              height={200}
              value={url}
            />

            {/* Copy Link */}
            <div className="flex w-full items-center gap-2">
              <Input
                readOnly
                value={url}
                className="flex-1"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0 bg-transparent"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
