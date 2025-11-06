import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  MapPin,
  Calendar,
  Clock,
  Users,
  Share2,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { formatTime12Hour } from "@/lib/utils";

const HiveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [hive, setHive] = useState<any>(null);
  const [host, setHost] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [hasRSVP, setHasRSVP] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchHiveDetails();
    }
  }, [id, user]);

  const fetchHiveDetails = async () => {
    setLoading(true);
    
    // Fetch hive details
    const { data: hiveData, error: hiveError } = await supabase
      .from("hives")
      .select("*")
      .eq("id", id)
      .single();

    if (hiveError) {
      toast.error("Failed to load hive details");
      navigate("/");
      return;
    }

    setHive(hiveData);

    // Fetch host details
    const { data: hostData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", hiveData.host_id)
      .single();
    setHost(hostData);

    // Fetch attendees
    const { data: rsvpData } = await supabase
      .from("hive_rsvps")
      .select("*, profiles(*)")
      .eq("hive_id", id);
    setAttendees(rsvpData || []);

    // Check if current user has RSVP'd
    if (user) {
      const userRSVP = rsvpData?.find((r) => r.user_id === user.id);
      setHasRSVP(!!userRSVP);
    }

    setLoading(false);
  };

  const handleRSVP = async () => {
    if (!user) {
      toast.error("Please sign in to RSVP");
      navigate("/auth");
      return;
    }

    setRsvpLoading(true);

    try {
      if (hasRSVP) {
        // Remove RSVP
        const { error } = await supabase
          .from("hive_rsvps")
          .delete()
          .eq("hive_id", id)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("RSVP removed");
        setHasRSVP(false);
      } else {
        // Add RSVP
        const { error } = await supabase
          .from("hive_rsvps")
          .insert({
            hive_id: id,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success("You're in! See you there 🎉");
        setHasRSVP(true);
      }
      
      fetchHiveDetails();
    } catch (error: any) {
      toast.error(error.message || "Failed to update RSVP");
    } finally {
      setRsvpLoading(false);
    }
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

  if (!hive) {
    return null;
  }

  const categoryColors: Record<string, string> = {
    social: "bg-primary text-primary-foreground",
    sports: "bg-secondary text-secondary-foreground",
    arts: "bg-purple-500 text-white",
    food: "bg-orange-500 text-white",
    music: "bg-pink-500 text-white",
    gaming: "bg-blue-500 text-white",
    study: "bg-green-500 text-white",
    outdoors: "bg-teal-500 text-white",
    other: "bg-muted text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} profile={profile} />

      <div className="container py-8 max-w-4xl">
        {/* Hero Image */}
        <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-6">
          {hive.cover_image_url ? (
            <img
              src={hive.cover_image_url}
              alt={hive.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
              <span className="text-8xl">🎉</span>
            </div>
          )}
          <Badge
            className={`absolute top-4 left-4 ${
              categoryColors[hive.category] || categoryColors.other
            }`}
          >
            {hive.category}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                    {hive.title}
                  </h1>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {hive.description}
                  </p>
                </div>

                <Separator />

                {/* Event Details */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Date</p>
                      <p className="text-muted-foreground">
                        {format(new Date(hive.event_date), "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Time</p>
                      <p className="text-muted-foreground">{formatTime12Hour(hive.event_time)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Location</p>
                      <p className="text-muted-foreground">{hive.location}</p>
                    </div>
                  </div>

                  {hive.cover_image_url && hive.cover_image_url.startsWith("http") && (
                    <div className="flex items-start gap-3">
                      <ExternalLink className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-semibold">Link</p>
                        <a
                          href={hive.cover_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {hive.cover_image_url}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Host Info */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Hosted by</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={host?.avatar_url} alt={host?.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {host?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{host?.name}</p>
                    {host?.bio && (
                      <p className="text-sm text-muted-foreground">{host.bio}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RSVP Card */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">
                    {attendees.length} {attendees.length === 1 ? "person" : "people"} attending
                  </span>
                </div>

                <Button
                  onClick={handleRSVP}
                  disabled={rsvpLoading}
                  className="w-full"
                  variant={hasRSVP ? "outline" : "default"}
                >
                  {rsvpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {hasRSVP ? "Cancel RSVP" : "RSVP to Hive"}
                </Button>

                <Button variant="ghost" className="w-full gap-2">
                  <Share2 className="h-4 w-4" />
                  Share Event
                </Button>
              </CardContent>
            </Card>

            {/* Attendees */}
            {attendees.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Attendees</h3>
                  <div className="space-y-3">
                    {attendees.slice(0, 5).map((attendee) => (
                      <div key={attendee.id} className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={attendee.profiles?.avatar_url}
                            alt={attendee.profiles?.name}
                          />
                          <AvatarFallback className="bg-muted text-xs">
                            {attendee.profiles?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{attendee.profiles?.name}</span>
                      </div>
                    ))}
                    {attendees.length > 5 && (
                      <p className="text-sm text-muted-foreground">
                        +{attendees.length - 5} more
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HiveDetail;
