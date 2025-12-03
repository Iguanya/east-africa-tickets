import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/lib/supabase";

const LOCAL_PREF_KEY = "ea_admin_preferences";

interface AdminPreferences {
  preferredCurrency: string;
  notifications: string;
  announcement: string;
}

const AdminSettingsPage = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
  });

  const [preferences, setPreferences] = useState<AdminPreferences>(() => {
    const stored = localStorage.getItem(LOCAL_PREF_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {
          preferredCurrency: "KSH",
          notifications: "all",
          announcement: "",
        };
      }
    }
    return {
      preferredCurrency: "KSH",
      notifications: "all",
      announcement: "",
    };
  });

  useEffect(() => {
    setProfileForm({
      full_name: user?.full_name || "",
      phone: user?.phone || "",
    });
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      await userService.updateProfile(user.id, profileForm);
      await refreshProfile();
      toast({ title: "Profile updated" });
    } catch (error) {
      console.error("[AdminSettings] Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Could not update profile.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      localStorage.setItem(LOCAL_PREF_KEY, JSON.stringify(preferences));
      toast({ title: "Preferences saved" });
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Control your administrator profile and platform preferences.</p>
      </div>

      <form onSubmit={handleProfileSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email} disabled />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <form onSubmit={handlePreferencesSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Platform Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="currency">Preferred currency</Label>
                <Input
                  id="currency"
                  value={preferences.preferredCurrency}
                  onChange={(e) => setPreferences((prev) => ({ ...prev, preferredCurrency: e.target.value }))}
                  placeholder="KSH"
                />
              </div>
              <div>
                <Label htmlFor="notifications">Notifications</Label>
                <Input
                  id="notifications"
                  value={preferences.notifications}
                  onChange={(e) => setPreferences((prev) => ({ ...prev, notifications: e.target.value }))}
                  placeholder="all / critical / none"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="announcement">Homepage announcement</Label>
              <Textarea
                id="announcement"
                value={preferences.announcement}
                onChange={(e) => setPreferences((prev) => ({ ...prev, announcement: e.target.value }))}
                placeholder="Share a short announcement with all admins."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Stored locally for now — wire this to a CMS or config service when ready.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" variant="outline" disabled={savingPrefs}>
              {savingPrefs ? "Saving..." : "Save Preferences"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default AdminSettingsPage;

