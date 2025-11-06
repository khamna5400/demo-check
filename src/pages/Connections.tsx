import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check, X, UserCheck, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { HiveCard } from "@/components/HiveCard";

const Connections = () => {
  const { user, profile } = useAuth();
  const [connections, setConnections] = useState<any[]>([]);
  const [trendingHives, setTrendingHives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadConnections = async () => {
      await fetchConnections(user.id);
      await fetchTrendingHives();
      setLoading(false);
    };

    loadConnections();
  }, [user, navigate]);

  const fetchConnections = async (userId: string) => {
    const { data, error } = await supabase
      .from("connections")
      .select(`
        *,
        user_profile:profiles!connections_user_id_fkey(id, name, avatar_url, level, xp, location),
        friend_profile:profiles!connections_friend_id_fkey(id, name, avatar_url, level, xp, location)
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load connections");
      console.error(error);
    } else {
      setConnections(data || []);
    }
  };

  const fetchTrendingHives = async () => {
    try {
      const { data, error } = await supabase.rpc('get_trending_hives', { limit_count: 5 });
      if (error) throw error;
      setTrendingHives(data || []);
    } catch (error) {
      console.error("Failed to fetch trending hives:", error);
    }
  };

  const acceptConnection = async (connectionId: string) => {
    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("id", connectionId);

    if (error) {
      toast.error("Failed to accept connection");
      console.error(error);
    } else {
      toast.success("Connection accepted!");
      await fetchConnections(user.id);
    }
  };

  const rejectConnection = async (connectionId: string) => {
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId);

    if (error) {
      toast.error("Failed to reject connection");
      console.error(error);
    } else {
      toast.success("Connection rejected");
      await fetchConnections(user.id);
    }
  };

  const removeConnection = async (connectionId: string) => {
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId);

    if (error) {
      toast.error("Failed to remove connection");
      console.error(error);
    } else {
      toast.success("Connection removed");
      await fetchConnections(user.id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      newbie: "bg-gray-500",
      explorer: "bg-blue-500",
      connector: "bg-green-500",
      influencer: "bg-purple-500",
      legend: "bg-yellow-500",
    };
    return colors[level] || "bg-gray-500";
  };

  const acceptedConnections = connections.filter((c) => c.status === "accepted");
  const pendingReceived = connections.filter(
    (c) => c.status === "pending" && c.friend_id === user?.id
  );
  const pendingSent = connections.filter(
    (c) => c.status === "pending" && c.user_id === user?.id
  );

  const renderConnectionCard = (
    connection: any,
    showActions: "accept" | "remove" | "cancel" | null
  ) => {
    const otherUser =
      connection.user_id === user?.id
        ? connection.friend_profile
        : connection.user_profile;

    if (!otherUser) return null;

    return (
      <Card key={connection.id}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={otherUser.avatar_url} />
                <AvatarFallback>{getInitials(otherUser.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{otherUser.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={`${getLevelColor(otherUser.level)} text-white capitalize`}
                  >
                    {otherUser.level}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {otherUser.xp} XP
                  </span>
                </div>
                {otherUser.location && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {otherUser.location}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/profile/${otherUser.id}`)}
          >
            View Profile
          </Button>
          {showActions === "accept" && (
            <>
              <Button
                className="flex-1"
                onClick={() => acceptConnection(connection.id)}
              >
                <Check className="h-4 w-4 mr-2" />
                Accept
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectConnection(connection.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          {showActions === "remove" && (
            <Button
              variant="destructive"
              onClick={() => removeConnection(connection.id)}
            >
              Remove
            </Button>
          )}
          {showActions === "cancel" && (
            <Button
              variant="destructive"
              onClick={() => rejectConnection(connection.id)}
            >
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    );
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

      <div className="container py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Connections</h1>
          <p className="text-muted-foreground">
            Manage your connections and requests
          </p>
        </div>

        {/* Trending Hives */}
        {trendingHives.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Trending Hives</h2>
                <p className="text-muted-foreground">Most popular events right now</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingHives.slice(0, 3).map((hive) => (
                <HiveCard
                  key={hive.id}
                  id={hive.id}
                  title={hive.title}
                  description={hive.description}
                  category={hive.category}
                  eventDate={hive.event_date}
                  eventTime={hive.event_time}
                  location={hive.location}
                  coverImageUrl={hive.cover_image_url}
                  attendeeCount={hive.rsvp_count || 0}
                  onClick={() => navigate(`/hive/${hive.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="connections" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connections">
              Connected ({acceptedConnections.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({pendingReceived.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent ({pendingSent.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-4 mt-6">
            {acceptedConnections.length === 0 ? (
              <div className="text-center py-16">
                <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground mb-4">
                  No connections yet
                </p>
                <Button onClick={() => navigate("/discover")}>
                  Discover People
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {acceptedConnections.map((connection) =>
                  renderConnectionCard(connection, "remove")
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4 mt-6">
            {pendingReceived.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">
                  No pending requests
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingReceived.map((connection) =>
                  renderConnectionCard(connection, "accept")
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4 mt-6">
            {pendingSent.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">
                  No pending sent requests
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingSent.map((connection) =>
                  renderConnectionCard(connection, "cancel")
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Connections;
