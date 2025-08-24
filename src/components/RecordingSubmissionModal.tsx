import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmailChipInput } from './EmailChipInput';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface RecordingSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingBlob: Blob | null;
  recordingDuration: number;
}

interface SubmissionData {
  emails: string[];
  meetingTitle: string;
  meetingId: string;
  dateTime: Date;
  recordingBlob: Blob;
}

export const RecordingSubmissionModal = ({
  isOpen,
  onClose,
  recordingBlob,
  recordingDuration
}: RecordingSubmissionModalProps) => {
  const [emails, setEmails] = useState<string[]>([]);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const generateMeetingId = () => {
    return `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const formatRecordingDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recordingBlob || emails.length === 0 || !meetingTitle) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const meetingId = generateMeetingId();
      
      const formData = new FormData();
      formData.append('recording', recordingBlob, `${meetingId}.webm`);
      formData.append('emails', JSON.stringify(emails));
      formData.append('meetingTitle', meetingTitle);
      formData.append('meetingId', meetingId);
      formData.append('dateTime', meetingDate.toISOString());
      formData.append('duration', recordingDuration.toString());

      // Replace with your Python backend URL
      const response = await fetch('/api/process-meeting', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      toast({
        title: "Meeting Submitted Successfully!",
        description: "Your meeting is being processed. You'll be notified when it's ready.",
      });

      // Reset form and close modal
      setEmails([]);
      setMeetingTitle('');
      setMeetingDate(new Date());
      onClose();
      
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit the meeting. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = emails.length > 0 && meetingTitle.trim() && !isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Meeting Recording</DialogTitle>
          <DialogDescription>
            Complete the meeting details to process your recording with AI-powered analysis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recording Info */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Recording Details</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Duration:</strong> {formatRecordingDuration(recordingDuration)}</p>
              <p><strong>Size:</strong> {recordingBlob ? `${(recordingBlob.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}</p>
              <p><strong>Format:</strong> Audio (WebM)</p>
            </div>
          </div>

          {/* Email Participants */}
          <EmailChipInput
            emails={emails}
            onChange={setEmails}
            label="Meeting Participants"
            placeholder="Enter your email first, then other participants..."
            required
          />

          {/* Meeting Title */}
          <div className="space-y-2">
            <Label htmlFor="meetingTitle">
              Meeting Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="meetingTitle"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="Enter meeting title..."
              required
            />
          </div>

          {/* Meeting Date */}
          <div className="space-y-2">
            <Label>Meeting Date & Time</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !meetingDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {meetingDate ? format(meetingDate, "PPP 'at' p") : "Select date and time"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={meetingDate}
                  onSelect={(date) => date && setMeetingDate(date)}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Meeting'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};