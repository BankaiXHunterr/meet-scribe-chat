import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  Copy, 
  Download, 
  CheckSquare,
  Clock,
  Calendar,
  Users,
  MessageSquare
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Mock meeting data
const mockMeetingData = {
  id: "1",
  title: "Q4 Product Planning Meeting",
  date: new Date(2024, 11, 20, 14, 0),
  duration: "1h 45m",
  participants: [
    { name: "Sarah Johnson", role: "Product Manager" },
    { name: "Mike Chen", role: "Engineering Lead" },
    { name: "Emily Davis", role: "UX Designer" },
    { name: "Alex Rodriguez", role: "Data Analyst" }
  ],
  keyHighlights: [
    "Finalized Q4 product roadmap with three major feature releases",
    "Allocated additional resources to mobile app development",
    "Established weekly check-ins with engineering team",
    "Set launch date for new analytics dashboard: January 15th"
  ],
  actionItems: [
    {
      task: "Create detailed technical specifications for analytics dashboard",
      assignee: "Mike Chen",
      deadline: "December 28, 2024",
      status: "pending"
    },
    {
      task: "Conduct user research for mobile app improvements",
      assignee: "Emily Davis", 
      deadline: "January 5, 2025",
      status: "pending"
    },
    {
      task: "Prepare resource allocation presentation for stakeholders",
      assignee: "Sarah Johnson",
      deadline: "December 22, 2024",
      status: "pending"
    },
    {
      task: "Set up weekly engineering team check-ins",
      assignee: "Alex Rodriguez",
      deadline: "December 20, 2024",
      status: "completed"
    }
  ],
  transcript: [
    {
      speaker: "Sarah Johnson",
      timestamp: "00:00:15",
      text: "Good afternoon everyone, thanks for joining the Q4 planning session. Let's start by reviewing our current progress and discussing the roadmap for the next quarter."
    },
    {
      speaker: "Mike Chen", 
      timestamp: "00:01:32",
      text: "The engineering team has made significant progress on the core platform. We're ahead of schedule on the API improvements and should be ready to start work on the analytics dashboard next week."
    },
    {
      speaker: "Emily Davis",
      timestamp: "00:03:45", 
      text: "From a UX perspective, we've completed the user research for the mobile app redesign. The findings suggest we should prioritize the notification system and simplify the navigation."
    },
    {
      speaker: "Alex Rodriguez",
      timestamp: "00:05:12",
      text: "The data shows that user engagement has increased by 23% since the last update. This suggests our current direction is working well, and we should continue focusing on user experience improvements."
    },
    {
      speaker: "Sarah Johnson",
      timestamp: "00:07:20",
      text: "Excellent updates everyone. Based on this progress, I think we can confidently move forward with the three major releases we discussed. Let's dive into the specifics of each release timeline."
    }
  ]
};

export default function MeetingDetails() {
  const { meetingId } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:05:32");
  const [totalTime] = useState("01:45:23");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could show a toast here
  };

  const copyAllHighlights = () => {
    const text = mockMeetingData.keyHighlights.map((highlight, index) => 
      `${index + 1}. ${highlight}`
    ).join('\n');
    copyToClipboard(text);
  };

  const copyAllActionItems = () => {
    const text = mockMeetingData.actionItems.map((item, index) => 
      `${index + 1}. ${item.task} (Assigned: ${item.assignee}, Due: ${item.deadline})`
    ).join('\n');
    copyToClipboard(text);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button asChild variant="ghost" size="icon">
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{mockMeetingData.title}</h1>
              <div className="flex items-center space-x-6 mt-2 text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDistanceToNow(mockMeetingData.date, { addSuffix: true })}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{mockMeetingData.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{mockMeetingData.participants.length} participants</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Player */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Volume2 className="w-5 h-5" />
                  <span>Recording Playback</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Volume2 className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">Audio Player</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    
                    <div className="flex-1">
                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>{currentTime}</span>
                        <span>{totalTime}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full w-1/3"></div>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="icon">
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meeting Content Tabs */}
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="participants">Participants</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-6">
                {/* Key Highlights */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Key Highlights</CardTitle>
                    <Button variant="outline" size="sm" onClick={copyAllHighlights}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {mockMeetingData.keyHighlights.map((highlight, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-semibold text-primary">{index + 1}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{highlight}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Action Items */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Action Items</CardTitle>
                    <Button variant="outline" size="sm" onClick={copyAllActionItems}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockMeetingData.actionItems.map((item, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                          <div className="pt-1">
                            <CheckSquare className={`w-4 h-4 ${
                              item.status === 'completed' ? 'text-success' : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{item.task}</p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>Assigned to: <strong>{item.assignee}</strong></span>
                              <span>Due: {item.deadline}</span>
                              <Badge 
                                variant={item.status === 'completed' ? 'default' : 'secondary'}
                                className={item.status === 'completed' ? 'bg-success text-success-foreground' : ''}
                              >
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="transcript">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Full Transcript</CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockMeetingData.transcript.map((entry, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {entry.timestamp}
                            </span>
                            <span className="text-sm font-semibold text-primary">
                              {entry.speaker}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed pl-4 border-l-2 border-muted">
                            {entry.text}
                          </p>
                          {index < mockMeetingData.transcript.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="participants">
                <Card>
                  <CardHeader>
                    <CardTitle>Meeting Participants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockMeetingData.participants.map((participant, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{participant.name}</p>
                            <p className="text-sm text-muted-foreground">{participant.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Chat Sidebar */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Ask AI Assistant</h2>
            </div>
            <ChatInterface meetingId={meetingId || "1"} />
          </div>
        </div>
      </main>
    </div>
  );
}