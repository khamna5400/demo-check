import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
  artistId: string;
  currentUserId: string | undefined;
}

export const FollowButton = ({ artistId, currentUserId }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (currentUserId) {
      checkFollowStatus();
    } else {
      setLoading(false);
    }
  }, [currentUserId, artistId]);

  const checkFollowStatus = async () => {
    if (!currentUserId) return;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("followers")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("artist_id", artistId)
        .maybeSingle();
      if (!error) setIsFollowing(!!data);
      setLoading(false);
      return;
    }

    // Firestore fallback
    const q = query(
      collection(db, "followers"),
      where("user_id", "==", currentUserId),
      where("artist_id", "==", artistId)
    );
    const snap = await getDocs(q);
    setIsFollowing(!snap.empty);
    setLoading(false);
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to follow artists");
      return;
    }

    setProcessing(true);

    if (isFollowing) {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("user_id", currentUserId)
          .eq("artist_id", artistId);
        if (error) {
          toast.error("Failed to unfollow");
          console.error(error);
        } else {
          setIsFollowing(false);
          toast.success("Unfollowed successfully");
        }
      } else {
        // Find and delete matching doc(s)
        const q = query(
          collection(db, "followers"),
          where("user_id", "==", currentUserId),
          where("artist_id", "==", artistId)
        );
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "followers", d.id))));
        setIsFollowing(false);
        toast.success("Unfollowed successfully");
      }
    } else {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from("followers")
          .insert({ user_id: currentUserId, artist_id: artistId });
        if (error) {
          toast.error("Failed to follow");
          console.error(error);
        } else {
          setIsFollowing(true);
          toast.success("Following! You'll see their posts and events.");
        }
      } else {
        await addDoc(collection(db, "followers"), { user_id: currentUserId, artist_id: artistId });
        setIsFollowing(true);
        toast.success("Following! You'll see their posts and events.");
      }
    }

    setProcessing(false);
  };

  if (loading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!currentUserId || currentUserId === artistId) {
    return null;
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      onClick={handleFollow}
      disabled={processing}
    >
      {processing ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : isFollowing ? (
        <UserMinus className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
};
