import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { HiveCard } from "@/components/HiveCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import heroImage from "@/assets/hero-image.jpg";
import hiverLogo from "@/assets/hiver-logo.png";

const categories = [
  "all",
  "social",
  "sports",
  "arts",
  "food",
  "music",
  "gaming",
  "study",
  "outdoors",
  "other",
];

const Home = () => {
  const { user, profile, session } = useAuth();
  const [hives, setHives] = useState<any[]>([]);
  const [filteredHives, setFilteredHives] = useState<any[]>([]);
  const [recommendedHives, setRecommendedHives] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchHives();
    if (user && session) {
      fetchRecommendations();
    }
  }, [user, session]);

  useEffect(() => {
    let filtered = hives;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((hive) => hive.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (hive) =>
          hive.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hive.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredHives(filtered);
  }, [selectedCategory, searchQuery, hives]);

  const fetchRecommendations = async () => {
    if (!user || !session) return;
    if (!isSupabaseConfigured) return;
    setLoadingRecommendations(true);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-hives', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      setRecommendedHives(data?.recommendations || []);
    } catch (error: any) {
      console.error('Failed to fetch recommendations:', error);
      // Silently fail for recommendations
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchHives = async () => {
    if (!isSupabaseConfigured) {
      try {
        const snap = await getDocs(collection(db, "hives"));
        const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        const now = new Date();
        const upcoming = docs.filter((hive: any) => {
          const dateStr = hive.event_date;
          const timeStr = hive.event_time;
          if (!dateStr || !timeStr) return true;
          try {
            const [year, month, day] = String(dateStr).split('-').map(Number);
            const [hours, minutes] = String(timeStr).split(':').map(Number);
            const dt = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0);
            return dt > now;
          } catch {
            return true;
          }
        });
        setHives(upcoming);
        setFilteredHives(upcoming);
      } catch (e) {
        console.error("Failed to read hives from Firestore:", e);
        setHives([]);
        setFilteredHives([]);
      }
      return;
    }

    const { data, error } = await supabase
      .from("hives")
      .select(`
        *,
        profiles:host_id (
          name,
          avatar_url
        ),
        hive_rsvps (count)
      `)
      .order("event_date", { ascending: true });

    if (error) {
      toast.error("Failed to load events");
      console.error(error);
    } else {
      // Filter out past events (only filter if event date+time has truly passed)
      const now = new Date();
      const upcomingHives = (data || []).filter((hive) => {
        try {
          // Create date in local timezone
          const [year, month, day] = hive.event_date.split('-').map(Number);
          const [hours, minutes] = hive.event_time.split(':').map(Number);
          const eventDateTime = new Date(year, month - 1, day, hours, minutes);
          return eventDateTime > now;
        } catch (e) {
          console.error('Error parsing date:', e);
          return true; // Keep the hive if date parsing fails
        }
      });
      setHives(upcomingHives);
      setFilteredHives(upcomingHives);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} profile={profile} />

      {/* Hero Section */}
      {!user && (
        <section className="relative h-[500px] overflow-hidden">
          <img
            src={heroImage}
            alt="Community gathering"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center text-center px-4">
            <div className="max-w-2xl space-y-6">
              <img 
                src={hiverLogo} 
                alt="Hiver" 
                className="h-20 sm:h-24 w-auto mx-auto mb-4"
              />
              <p className="text-xl sm:text-2xl text-foreground font-medium">
                Connect with your community through local events. Real connections, real experiences.
              </p>
              <Button
                size="lg"
                className="text-lg px-8"
                onClick={() => navigate("/auth")}
              >
                Join Hiver
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className="container py-8 space-y-8">
        {/* AI Recommendations */}
        {user && recommendedHives.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Recommended for You</h2>
                <p className="text-muted-foreground">AI-powered personalized suggestions</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedHives.slice(0, 3).map((hive) => (
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
                  attendeeCount={0}
                  onClick={() => navigate(`/hive/${hive.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap capitalize"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Hives Grid */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredHives.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">
              No events found. {user && "Be the first to create one!"}
            </p>
            {user && (
              <Button
                className="mt-4"
                onClick={() => navigate("/create-hive")}
              >
                Create Hive
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHives.map((hive) => (
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
                attendeeCount={hive.hive_rsvps?.[0]?.count || 0}
                onClick={() => navigate(`/hive/${hive.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
