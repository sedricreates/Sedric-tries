import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Building2,
  TrendingUp,
  Users,
  Leaf,
  MapPin,
  Mail,
  Phone,
  Globe,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";

export default function CompanyDashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please log in to access the company dashboard.
            </p>
            <Link href="/">
              <Button className="w-full">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: companies = [], isLoading } = trpc.company.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Mock data for demonstration
  const diseaseData = [
    { name: "Early Blight", detections: 245, farmers: 89 },
    { name: "Powdery Mildew", detections: 198, farmers: 72 },
    { name: "Leaf Spot", detections: 167, farmers: 61 },
    { name: "Rust", detections: 142, farmers: 53 },
    { name: "Blight", detections: 128, farmers: 48 },
  ];

  const regionData = [
    { name: "North", value: 320, fill: "#10b981" },
    { name: "South", value: 280, fill: "#3b82f6" },
    { name: "East", value: 240, fill: "#f59e0b" },
    { name: "West", value: 210, fill: "#ef4444" },
  ];

  const totalDetections = diseaseData.reduce((sum, item) => sum + item.detections, 0);
  const totalFarmers = diseaseData.reduce((sum, item) => sum + item.farmers, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="mb-8 fade-in">
          <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
            Agro Company Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time disease trends and farmer connections
          </p>
        </div>

        {/* Admin Notice */}
        {user?.role === "admin" && (
          <Alert className="mb-8 border-blue-200 bg-blue-50">
            <Building2 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              You have admin access. Manage company partnerships and view system-wide analytics.
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mb-8 slide-in-left">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Total Detections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{totalDetections}</p>
              <p className="text-xs text-muted-foreground mt-1">Across all diseases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                Affected Farmers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{totalFarmers}</p>
              <p className="text-xs text-muted-foreground mt-1">Unique users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                Partners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {companies?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Active companies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Leaf className="h-4 w-4 text-orange-600" />
                Top Disease
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {diseaseData[0]?.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {diseaseData[0]?.detections} detections
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-8 lg:grid-cols-2 mb-8 slide-in-left">
          {/* Disease Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Disease Detection Trends</CardTitle>
              <CardDescription>
                Most detected diseases in the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={diseaseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="detections" fill="#10b981" name="Detections" />
                  <Bar dataKey="farmers" fill="#3b82f6" name="Farmers Affected" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Regional Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Regional Distribution</CardTitle>
              <CardDescription>
                Disease detections by geographic region
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={regionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {regionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Company Partners */}
        <Card className="slide-in-left">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Partner Companies</CardTitle>
                <CardDescription>
                  Agricultural companies connected to the platform
                </CardDescription>
              </div>
              {user?.role === "admin" && (
                <Link href="/admin/companies/new">
                  <Button size="sm">Add Company</Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {companies && companies.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {companies.map((company: any) => (
                  <Card key={company.id} className="border-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{company.name}</CardTitle>
                          {company.verified && (
                            <Badge className="mt-2 bg-green-100 text-green-800">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {company.contactPerson && (
                        <p className="text-muted-foreground">
                          <strong>Contact:</strong> {company.contactPerson}
                        </p>
                      )}
                      {company.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${company.email}`} className="hover:underline">
                            {company.email}
                          </a>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${company.phone}`} className="hover:underline">
                            {company.phone}
                          </a>
                        </div>
                      )}
                      {company.website && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-4 w-4" />
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                      {company.specializations && (
                        <div>
                          <p className="font-medium text-foreground mb-2">
                            Specializations:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {(company.specializations ? JSON.parse(company.specializations) : []).map(
                              (spec: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {spec}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No partner companies yet. Start by adding your first partner.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3 justify-center fade-in">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin">
              <Button>Admin Panel</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
0

