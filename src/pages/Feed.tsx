import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Heart, Music, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Feed = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchFeed();
  }, [user, navigate]);

  const fetchFeed = async () => {
    if (!user) return;

    setLoading(true);

    // Get followed artists
    const { data: followedArtists, error: followError } = await supabase
      .from("followers")
      .select("artist_id")
      .eq("user_id", user.id);

    if (followError) {
      console.error("Error fetching followed artists:", followError);
      setLoading(false);
      return;
    }

    const artistIds = followedArtists?.map((f) => f.artist_id) || [];

    if (artistIds.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch posts from followed artists
    const { data: postsData, error: postsError } = await supabase
      .from("artist_posts")
      .select(`
        *,
        profiles:artist_id (
          name,
          avatar_url,
          user_type
        )
      `)
      .in("artist_id", artistIds)
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      toast.error("Failed to load feed");
      setLoading(false);
      return;
    }

    // Get like counts for each post
    const postIds = postsData?.map(p => p.id) || [];
    if (postIds.length > 0) {
      const { data: likesData } = await supabase
        .from("post_likes")
        .select("post_id, user_id")
        .in("post_id", postIds);

      // Add like counts to posts and track user's likes
      const liked = new Set<string>();
      const likeCounts = new Map<string, number>();
      
      likesData?.forEach((like) => {
        likeCounts.set(like.post_id, (likeCounts.get(like.post_id) || 0) + 1);
        if (like.user_id === user.id) {
          liked.add(like.post_id);
        }
      });

      const postsWithLikes = postsData?.map(post => ({
        ...post,
        like_count: likeCounts.get(post.id) || 0
      }));

      setPosts(postsWithLikes || []);
      setLikedPosts(liked);
    } else {
      setPosts(postsData || []);
    }

    setLoading(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    const isLiked = likedPosts.has(postId);

    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Failed to unlike");
        console.error(error);
      } else {
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        fetchFeed(); // Refresh to update counts
      }
    } else {
      // Like
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: user.id });

      if (error) {
        toast.error("Failed to like");
        console.error(error);
      } else {
        setLikedPosts((prev) => new Set(prev).add(postId));
        fetchFeed(); // Refresh to update counts
      }
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

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} profile={profile} />

      <div className="container py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Feed</h1>
          <p className="text-muted-foreground">
            Updates from artists you follow
          </p>
        </div>

        {posts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">
                Follow some artists to see their updates here
              </p>
              <Button onClick={() => navigate("/discover")}>
                Discover Artists
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Artist Info */}
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => navigate(`/profile/${post.artist_id}`)}
                    >
                      <Avatar>
                        <AvatarImage src={post.profiles?.avatar_url} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {post.profiles?.name?.charAt(0).toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{post.profiles?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="whitespace-pre-wrap text-foreground">
                      {post.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className={likedPosts.has(post.id) ? "text-red-500" : ""}
                      >
                        <Heart
                          className={`h-4 w-4 mr-1 ${
                            likedPosts.has(post.id) ? "fill-current" : ""
                          }`}
                        />
                        {post.like_count || 0}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
