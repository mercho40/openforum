import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, MessageSquare, User, Clock, CheckCircle, XCircle } from "lucide-react"

// Mock data - replace with actual data fetching
const mockReports = [
  {
    id: "1",
    type: "spam",
    status: "pending",
    reportedBy: { name: "John Doe", id: "1" },
    reportedUser: { name: "Spammer User", id: "2" },
    content: "This post contains spam content...",
    reason: "Posting promotional content repeatedly",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    type: "harassment",
    status: "resolved",
    reportedBy: { name: "Jane Smith", id: "3" },
    reportedUser: { name: "Toxic User", id: "4" },
    content: "Inappropriate language and harassment...",
    reason: "Using offensive language towards other users",
    createdAt: new Date("2024-01-14"),
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports Management</h1>
        <p className="text-muted-foreground">Review and handle user reports and moderation requests</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Reports handled today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total This Week</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">All reports this week</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Latest user reports requiring moderation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockReports.map((report) => (
              <div key={report.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium capitalize">{report.type} Report</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>Reported by {report.reportedBy.name}</span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>{report.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={
                      report.status === "pending"
                        ? "destructive"
                        : report.status === "resolved"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {report.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm">
                    <strong>Reported User:</strong> {report.reportedUser.name}
                  </p>
                  <p className="text-sm">
                    <strong>Reason:</strong> {report.reason}
                  </p>
                  <p className="text-sm">
                    <strong>Content:</strong> {report.content}
                  </p>
                </div>

                {report.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="default">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Resolve
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Contact User
                    </Button>
                    <Button size="sm" variant="destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
