import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Users, Heart, MessageSquare, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ArtistDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    followers: 0,
    totalLikes: 0,
    totalPosts: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (profile?.user_type !== "artist") {
      toast.error("This page is only for artists");
      navigate("/");
      return;
    }

    fetchDashboardData();
  }, [user, profile, navigate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch follower count
    const { count: followerCount } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("artist_id", user.id);

    // Fetch posts with like counts
    const { data: postsData, error: postsError } = await supabase
      .from("artist_posts")
      .select(`
        *,
        post_likes(count)
      `)
      .eq("artist_id", user.id)
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Error fetching posts:", postsError);
    } else {
      setPosts(postsData || []);
      
      const totalLikes = postsData?.reduce((sum, post) => {
        return sum + (post.post_likes?.[0]?.count || 0);
      }, 0) || 0;

      setStats({
        followers: followerCount || 0,
        totalLikes,
        totalPosts: postsData?.length || 0,
      });
    }

    setLoading(false);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) {
      toast.error("Please write something");
      return;
    }

    setPosting(true);

    const { error } = await supabase
      .from("artist_posts")
      .insert({
        artist_id: user!.id,
        content: postContent,
      });

    if (error) {
      toast.error("Failed to create post");
      console.error(error);
    } else {
      toast.success("Post created! Your followers will see it.");
      setPostContent("");
      fetchDashboardData();
    }

    setPosting(false);
  };

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase
      .from("artist_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      toast.error("Failed to delete post");
      console.error(error);
    } else {
      toast.success("Post deleted");
      fetchDashboardData();
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

      <div className="container py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Artist Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your content and track your fan engagement
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Followers</p>
                  <p className="text-2xl font-bold">{stats.followers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                  <p className="text-2xl font-bold">{stats.totalLikes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Posts</p>
                  <p className="text-2xl font-bold">{stats.totalPosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Post Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Create Announcement</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="post-content">Share with your fans</Label>
                    <Textarea
                      id="post-content"
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="Share updates, upcoming shows, new music..."
                      rows={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={posting}>
                    {posting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post Announcement
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Posts Feed */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold">Your Posts</h2>
            {posts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No posts yet. Create your first announcement!</p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <p className="whitespace-pre-wrap">{post.content}</p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(post.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.post_likes?.[0]?.count || 0}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDashboard;
