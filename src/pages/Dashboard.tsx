import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { MeetingCard } from "@/components/MeetingCard";
import { RecordingControls } from "@/components/RecordingControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Filter, 
  Calendar,
  Clock,
  Users,
  BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for demonstration
const mockMeetings = [
  {
    id: "1",
    title: "Q4 Product Planning Meeting",
    date: new Date(2024, 11, 20, 14, 0),
    duration: "1h 45m",
    summary: "Discussed product roadmap for Q4, identified key milestones and resource allocation. Team agreed on three major feature releases and timeline adjustments.",
    participants: [
      { name: "Sarah Johnson", avatar: "/placeholder.svg" },
      { name: "Mike Chen", avatar: "/placeholder.svg" },
      { name: "Emily Davis", avatar: "/placeholder.svg" },
      { name: "Alex Rodriguez", avatar: "/placeholder.svg" }
    ],
    status: "completed" as const
  },
  {
    id: "2", 
    title: "Weekly Team Standup",
    date: new Date(2024, 11, 19, 9, 30),
    duration: "45m",
    summary: "Quick status updates from all team members. Discussed current blockers and upcoming priorities for the week.",
    participants: [
      { name: "Sarah Johnson", avatar: "/placeholder.svg" },
      { name: "Mike Chen", avatar: "/placeholder.svg" },
      { name: "Tom Wilson", avatar: "/placeholder.svg" }
    ],
    status: "completed" as const
  },
  {
    id: "3",
    title: "Client Onboarding Session",
    date: new Date(2024, 11, 18, 16, 0),
    duration: "2h 15m", 
    summary: "Comprehensive onboarding session with new enterprise client. Covered platform features, integration requirements, and training schedule.",
    participants: [
      { name: "Emily Davis", avatar: "/placeholder.svg" },
      { name: "John Smith", avatar: "/placeholder.svg" },
      { name: "Lisa Brown", avatar: "/placeholder.svg" },
      { name: "David Lee", avatar: "/placeholder.svg" },
      { name: "Maria Garcia", avatar: "/placeholder.svg" }
    ],
    status: "completed" as const
  },
  {
    id: "4",
    title: "Budget Review Meeting",
    date: new Date(2024, 11, 17, 11, 0),
    duration: "1h 20m",
    summary: "Quarterly budget review with finance team. Analyzed spending patterns and projected Q1 budget requirements.",
    participants: [
      { name: "Alex Rodriguez", avatar: "/placeholder.svg" },
      { name: "Jennifer Kim", avatar: "/placeholder.svg" }
    ],
    status: "processing" as const
  }
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredMeetings = mockMeetings
    .filter(meeting => {
      const matchesSearch = meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           meeting.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || meeting.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return b.date.getTime() - a.date.getTime();
        case "date-asc":
          return a.date.getTime() - b.date.getTime();
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  const stats = {
    total: mockMeetings.length,
    thisWeek: mockMeetings.filter(m => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return m.date >= weekAgo;
    }).length,
    totalDuration: "8h 5m",
    participants: new Set(mockMeetings.flatMap(m => m.participants.map(p => p.name))).size
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">Meeting Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Manage and explore your meeting summaries
              </p>
            </div>
            <Button asChild variant="hero" size="lg">
              <Link to="/upload">
                <Plus className="w-5 h-5" />
                New Meeting
              </Link>
            </Button>
          </div>

          {/* Live Recording Controls */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Record Live Meeting</h2>
            <RecordingControls />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-card rounded-lg p-4 border shadow-card">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Total Meetings</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="bg-gradient-card rounded-lg p-4 border shadow-card">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-muted-foreground">This Week</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.thisWeek}</p>
            </div>
            <div className="bg-gradient-card rounded-lg p-4 border shadow-card">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-success" />
                <span className="text-sm font-medium text-muted-foreground">Total Duration</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalDuration}</p>
            </div>
            <div className="bg-gradient-card rounded-lg p-4 border shadow-card">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-warning" />
                <span className="text-sm font-medium text-muted-foreground">Participants</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.participants}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Meetings Grid */}
        {filteredMeetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} {...meeting} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No meetings found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || filterStatus !== "all" 
                ? "Try adjusting your search or filters" 
                : "Upload your first meeting recording to get started"
              }
            </p>
            {!searchQuery && filterStatus === "all" && (
              <Button asChild variant="hero" size="lg">
                <Link to="/upload">
                  <Plus className="w-5 h-5" />
                  Upload Your First Meeting
                </Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}