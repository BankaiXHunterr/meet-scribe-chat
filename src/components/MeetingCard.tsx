import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Calendar, Users, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MeetingCardProps {
  id: string;
  title: string;
  date: Date;
  duration: string;
  summary: string;
  participants: Array<{
    name: string;
    avatar?: string;
  }>;
  status: "completed" | "processing" | "failed";
}

export function MeetingCard({ 
  id, 
  title, 
  date, 
  duration, 
  summary, 
  participants, 
  status 
}: MeetingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "processing":
        return "bg-warning text-warning-foreground";
      case "failed":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Link to={`/meeting/${id}`}>
      <Card className="group h-full bg-gradient-card hover:shadow-medium transition-all duration-300 cursor-pointer border-0 hover:scale-[1.02]">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                {title}
              </h3>
              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{duration}</span>
                </div>
              </div>
            </div>
            <Badge className={getStatusColor(status)} variant="secondary">
              {status === "completed" && <Play className="w-3 h-3 mr-1" />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-muted-foreground line-clamp-3 mb-4">
            {summary}
          </p>
          
          {participants.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div className="flex -space-x-2">
                  {participants.slice(0, 4).map((participant, index) => (
                    <Avatar key={index} className="w-6 h-6 border-2 border-background">
                      <AvatarImage src={participant.avatar} alt={participant.name} />
                      <AvatarFallback className="text-xs">
                        {participant.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {participants.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        +{participants.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}