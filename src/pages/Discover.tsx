import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, UserPlus, Check, X, Music } from "lucide-react";
import { toast } from "sonner";
import { FollowButton } from "@/components/FollowButton";
import { ConnectButton } from "@/components/ConnectButton";

const Discover = () => {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadData = async () => {
      await fetchUsers(user.id);
      await fetchConnections(user.id);
      await fetchSuggestedConnections(user.id);
      await fetchArtists(user.id);
      setLoading(false);
    };

    loadData();
  }, [user, navigate]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.interests?.some((i: string) => i.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async (currentUserId: string) => {
    // Use the secure function that only exposes public profile data
    const { data, error } = await supabase.rpc('get_all_public_profiles');

    if (error) {
      toast.error("Failed to load users");
      console.error(error);
    } else {
      // Filter out current user
      const filteredData = data?.filter((u: any) => u.id !== currentUserId) || [];
      setUsers(filteredData);
      setFilteredUsers(filteredData);
    }
  };

  const fetchConnections = async (userId: string) => {
    const { data, error } = await supabase
      .from("connections")
      .select("*")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) {
      console.error("Error fetching connections:", error);
    } else {
      setConnections(data || []);
    }
  };

  const fetchSuggestedConnections = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_connection_suggestions', {
        for_user_id: userId,
        limit_count: 6
      });

      if (error) throw error;
      setSuggestedUsers(data || []);
    } catch (error) {
      console.error("Failed to fetch suggested connections:", error);
    }
  };

  const fetchArtists = async (currentUserId: string) => {
    // Use the secure function that only exposes public profile data
    const { data, error } = await supabase.rpc('get_all_public_profiles');

    if (error) {
      console.error("Error fetching artists:", error);
      return;
    }

    // Filter for artists only, exclude current user, and limit results
    const artistData = data
      ?.filter((p: any) => p.user_type === 'artist' && p.id !== currentUserId)
      .sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0))
      .slice(0, 6);

    // Get follower counts separately
    const artistIds = artistData?.map(a => a.id) || [];
    if (artistIds.length > 0) {
      const { data: followersData } = await supabase
        .from("followers")
        .select("artist_id")
        .in("artist_id", artistIds);

      const followerCounts = new Map<string, number>();
      followersData?.forEach(f => {
        followerCounts.set(f.artist_id, (followerCounts.get(f.artist_id) || 0) + 1);
      });

      const artistsWithFollowers = artistData?.map(artist => ({
        ...artist,
        follower_count: followerCounts.get(artist.id) || 0
      }));

      setArtists(artistsWithFollowers || []);
    } else {
      setArtists(artistData || []);
    }
  };

  const getConnectionStatus = (userId: string) => {
    return connections.find(
      (c) =>
        (c.user_id === user?.id && c.friend_id === userId) ||
        (c.friend_id === user?.id && c.user_id === userId)
    );
  };

  const sendConnectionRequest = async (friendId: string) => {
    const { error } = await supabase
      .from("connections")
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: "pending",
      });

    if (error) {
      toast.error("Failed to send connection request");
      console.error(error);
    } else {
      toast.success("Connection request sent!");
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
          <h1 className="text-3xl font-bold mb-2">Discover People</h1>
          <p className="text-muted-foreground">
            Connect with others in your community
          </p>
        </div>

        {/* Artists to Follow */}
        {artists.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Music className="h-6 w-6 text-primary" />
                Artists to Follow
              </h2>
              <p className="text-muted-foreground">Discover and support local artists</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artists.map((artist) => (
                <Card key={artist.id} className="overflow-hidden border-primary/20">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={artist.avatar_url} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(artist.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{artist.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {artist.follower_count || 0} followers
                          </Badge>
                          <Badge className={`${getLevelColor(artist.level)} text-white capitalize`}>
                            {artist.level}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {artist.location && (
                      <CardDescription>{artist.location}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {artist.genres?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {artist.genres.slice(0, 3).map((genre: string) => (
                          <Badge key={genre} variant="outline">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {artist.artist_bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {artist.artist_bio}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/profile/${artist.id}`)}
                      >
                        View Profile
                      </Button>
                      <FollowButton artistId={artist.id} currentUserId={user?.id} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Connections */}
        {suggestedUsers.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Suggested Connections</h2>
              <p className="text-muted-foreground">People with similar interests</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestedUsers.slice(0, 3).map((suggestedUser) => {
                const connection = getConnectionStatus(suggestedUser.id);
                const isPending = connection?.status === "pending";
                const isConnected = connection?.status === "accepted";
                const isSentByMe = connection?.user_id === user?.id;

                return (
                  <Card key={suggestedUser.id} className="overflow-hidden border-primary/20">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={suggestedUser.avatar_url} />
                          <AvatarFallback>
                            {getInitials(suggestedUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {suggestedUser.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              className={`${getLevelColor(
                                suggestedUser.level
                              )} text-white capitalize`}
                            >
                              {suggestedUser.level}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {suggestedUser.shared_interests_count} shared interests
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {suggestedUser.location && (
                        <CardDescription>{suggestedUser.location}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {suggestedUser.interests?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {suggestedUser.interests.slice(0, 3).map((interest: string) => (
                            <Badge key={interest} variant="outline">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => navigate(`/profile/${suggestedUser.id}`)}
                        >
                          View Profile
                        </Button>
                        <ConnectButton 
                          userId={suggestedUser.id} 
                          currentUserId={user?.id} 
                          onConnectionChange={() => {
                            fetchConnections(user.id);
                            fetchSuggestedConnections(user.id);
                          }} 
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, location, or interests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((discoveredUser) => {
              const connection = getConnectionStatus(discoveredUser.id);
              const isPending = connection?.status === "pending";
              const isConnected = connection?.status === "accepted";
              const isSentByMe = connection?.user_id === user?.id;

              return (
                <Card key={discoveredUser.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={discoveredUser.avatar_url} />
                        <AvatarFallback>
                          {getInitials(discoveredUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {discoveredUser.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            className={`${getLevelColor(
                              discoveredUser.level
                            )} text-white capitalize`}
                          >
                            {discoveredUser.level}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {discoveredUser.xp} XP
                          </span>
                        </div>
                      </div>
                    </div>
                    {discoveredUser.location && (
                      <CardDescription>{discoveredUser.location}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {discoveredUser.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {discoveredUser.bio}
                      </p>
                    )}
                    {discoveredUser.interests?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {discoveredUser.interests.slice(0, 3).map((interest: string) => (
                          <Badge key={interest} variant="outline">
                            {interest}
                          </Badge>
                        ))}
                        {discoveredUser.interests.length > 3 && (
                          <Badge variant="outline">
                            +{discoveredUser.interests.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/profile/${discoveredUser.id}`)}
                      >
                        View Profile
                      </Button>
                      {discoveredUser.user_type === 'artist' ? (
                        <FollowButton artistId={discoveredUser.id} currentUserId={user?.id} />
                      ) : (
                        <ConnectButton 
                          userId={discoveredUser.id} 
                          currentUserId={user?.id} 
                          onConnectionChange={() => fetchConnections(user.id)} 
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
