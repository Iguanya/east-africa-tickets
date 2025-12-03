import { useState, useEffect } from "react";
import { User, Mail, Phone, Save, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AppSidebar } from "@/components/AppSidebar";
import { userService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  points: number;
  created_at: string;
}

export default function UserProfile() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // In a real app, get the actual user ID from auth
      const userId = "user-id"; // Placeholder
      const data = await userService.getProfile(userId);
      setProfile(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      await userService.updateProfile(profile.id, {
        full_name: profile.full_name,
        phone: profile.phone,
      });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: string, value: string) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const getLoyaltyTier = (points: number) => {
    if (points >= 1000) return { name: "Platinum", color: "bg-purple-500" };
    if (points >= 500) return { name: "Gold", color: "bg-yellow-500" };
    if (points >= 100) return { name: "Silver", color: "bg-gray-400" };
    return { name: "Bronze", color: "bg-orange-500" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
          <p className="text-muted-foreground">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  const loyaltyTier = getLoyaltyTier(profile.points);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Manage your account information and preferences</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Card */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback className="text-lg">
                        {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{profile.full_name || 'Not set'}</h3>
                      <p className="text-muted-foreground">{profile.email}</p>
                      <Badge variant="outline" className={`mt-1 ${loyaltyTier.color} text-white`}>
                        {loyaltyTier.name} Member
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profile.full_name || ''}
                        onChange={(e) => updateProfile('full_name', e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => updateProfile('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Loyalty Points Card */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Loyalty Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {profile.points.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Total Points</p>
                    
                    <Badge variant="outline" className={`${loyaltyTier.color} text-white mb-4`}>
                      {loyaltyTier.name} Member
                    </Badge>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Bronze (0-99)</span>
                        <span>{profile.points >= 100 ? '✓' : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Silver (100-499)</span>
                        <span>{profile.points >= 500 ? '✓' : profile.points >= 100 ? 'Current' : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gold (500-999)</span>
                        <span>{profile.points >= 1000 ? '✓' : profile.points >= 500 ? 'Current' : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platinum (1000+)</span>
                        <span>{profile.points >= 1000 ? 'Current' : ''}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since:</span>
                    <span>{new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account ID:</span>
                    <span className="font-mono">{profile.id.slice(0, 8)}...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}