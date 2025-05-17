"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ShareTrackingLinkProps {
  deliveryId: string;
  orderId: string;
}

export function ShareTrackingLink({
  deliveryId,
  orderId,
}: Readonly<ShareTrackingLinkProps>) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  // Generate the tracking link
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
  const trackingLink = `${baseUrl}/track?deliveryId=${deliveryId}&orderId=${orderId}`;

  // Handle copying to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(trackingLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Tracking link copied to clipboard",
      });

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  // Handle sharing via native share API (mobile devices)
  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Track My Delivery",
          text: "Follow my food delivery in real-time!",
          url: trackingLink,
        });

        toast({
          title: "Link shared!",
          description: "Tracking link has been shared",
        });

        setOpen(false);
      } catch (error) {
        console.error("Failed to share:", error);
      }
    } else {
      // Fallback if Web Share API is not available
      copyToClipboard();
    }
  };

  // Open tracking link in new tab
  const openInNewTab = () => {
    window.open(trackingLink, "_blank");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share Tracking
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Delivery Tracking</DialogTitle>
          <DialogDescription>
            Share this link to let others track this delivery in real-time
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 mt-4">
          <div className="grid flex-1 gap-2">
            <Input
              value={trackingLink}
              readOnly
              className="font-mono text-xs md:text-sm"
            />
          </div>
          <Button size="sm" variant="outline" onClick={copyToClipboard}>
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={shareLink} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>

          <Button variant="default" onClick={openInNewTab} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Open Tracking
          </Button>
        </div>

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
