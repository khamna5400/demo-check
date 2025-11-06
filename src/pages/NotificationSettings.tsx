import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Bell } from "lucide-react";

const NotificationSettings = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    email_new_post: true,
    email_new_event: true,
    email_event_reminder: true,
    email_new_follower: true,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchPreferences();
  }, [user, navigate]);

  const fetchPreferences = async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching preferences:", error);
    } else if (data) {
      setPreferences({
        email_new_post: data.email_new_post,
        email_new_event: data.email_new_event,
        email_event_reminder: data.email_event_reminder,
        email_new_follower: data.email_new_follower,
      });
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    // Check if preferences exist
    const { data: existing } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let error;

    if (existing) {
      // Update existing preferences
      const result = await supabase
        .from("notification_preferences")
        .update(preferences)
        .eq("user_id", user.id);
      error = result.error;
    } else {
      // Insert new preferences
      const result = await supabase
        .from("notification_preferences")
        .insert({ ...preferences, user_id: user.id });
      error = result.error;
    }

    if (error) {
      toast.error("Failed to save preferences");
      console.error(error);
    } else {
      toast.success("Notification preferences saved!");
    }

    setSaving(false);
  };

  const updatePreference = (key: keyof typeof preferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} profile={profile} />
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} profile={profile} />

      <div className="container py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage how you want to be notified about activity
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Choose what updates you want to receive via email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="new-post">New Posts from Artists</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when artists you follow post updates
                </p>
              </div>
              <Switch
                id="new-post"
                checked={preferences.email_new_post}
                onCheckedChange={(checked) =>
                  updatePreference("email_new_post", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="new-event">New Events</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about new events in your area
                </p>
              </div>
              <Switch
                id="new-event"
                checked={preferences.email_new_event}
                onCheckedChange={(checked) =>
                  updatePreference("email_new_event", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="event-reminder">Event Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded about events you've RSVP'd to
                </p>
              </div>
              <Switch
                id="event-reminder"
                checked={preferences.email_event_reminder}
                onCheckedChange={(checked) =>
                  updatePreference("email_event_reminder", checked)
                }
              />
            </div>

            {profile?.user_type === "artist" && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-follower">New Followers</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone follows you
                  </p>
                </div>
                <Switch
                  id="new-follower"
                  checked={preferences.email_new_follower}
                  onCheckedChange={(checked) =>
                    updatePreference("email_new_follower", checked)
                  }
                />
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationSettings;
