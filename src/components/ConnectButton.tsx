import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserPlus, UserMinus, Clock, Loader2 } from "lucide-react";

interface ConnectButtonProps {
  userId: string;
  currentUserId: string | undefined;
  onConnectionChange?: () => void;
}

export const ConnectButton = ({ userId, currentUserId, onConnectionChange }: ConnectButtonProps) => {
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'connected'>('none');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (currentUserId) {
      checkConnectionStatus();
    } else {
      setLoading(false);
    }
  }, [currentUserId, userId]);

  const checkConnectionStatus = async () => {
    if (!currentUserId) return;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("connections")
        .select("*")
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUserId})`)
        .maybeSingle();
      if (!error && data) {
        if (data.status === 'accepted') setConnectionStatus('connected');
        else if (data.user_id === currentUserId) setConnectionStatus('pending_sent');
        else setConnectionStatus('pending_received');
      } else {
        setConnectionStatus('none');
      }
      setLoading(false);
      return;
    }

    // Firestore fallback
    const q = query(
      collection(db, "connections"),
      where("user_id", "in", [currentUserId, userId]),
      where("friend_id", "in", [currentUserId, userId])
    );
    const snap = await getDocs(q);
    const match = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .find(d => (d.user_id === currentUserId && d.friend_id === userId) || (d.user_id === userId && d.friend_id === currentUserId));
    if (match) {
      if (match.status === 'accepted') setConnectionStatus('connected');
      else if (match.user_id === currentUserId) setConnectionStatus('pending_sent');
      else setConnectionStatus('pending_received');
    } else {
      setConnectionStatus('none');
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to connect with users");
      return;
    }

    setProcessing(true);

    if (connectionStatus === 'connected' || connectionStatus === 'pending_sent') {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from("connections")
          .delete()
          .or(`and(user_id.eq.${currentUserId},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUserId})`);
        if (error) {
          toast.error("Failed to remove connection");
          console.error(error);
        } else {
          setConnectionStatus('none');
          toast.success(connectionStatus === 'connected' ? "Connection removed" : "Request cancelled");
          onConnectionChange?.();
        }
      } else {
        const q = query(
          collection(db, "connections"),
          where("user_id", "in", [currentUserId, userId]),
          where("friend_id", "in", [currentUserId, userId])
        );
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "connections", d.id))));
        setConnectionStatus('none');
        toast.success(connectionStatus === 'connected' ? "Connection removed" : "Request cancelled");
        onConnectionChange?.();
      }
    } else if (connectionStatus === 'pending_received') {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from("connections")
          .update({ status: 'accepted' })
          .eq('user_id', userId)
          .eq('friend_id', currentUserId);
        if (error) {
          toast.error("Failed to accept connection");
          console.error(error);
        } else {
          setConnectionStatus('connected');
          toast.success("Connection accepted!");
          onConnectionChange?.();
        }
      } else {
        // Find pending doc and mark accepted
        const q = query(
          collection(db, "connections"),
          where("user_id", "==", userId),
          where("friend_id", "==", currentUserId)
        );
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map(d => updateDoc(doc(db, "connections", d.id), { status: 'accepted' })));
        setConnectionStatus('connected');
        toast.success("Connection accepted!");
        onConnectionChange?.();
      }
    } else {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from("connections")
          .insert({ user_id: currentUserId, friend_id: userId, status: 'pending' });
        if (error) {
          toast.error("Failed to send connection request");
          console.error(error);
        } else {
          setConnectionStatus('pending_sent');
          toast.success("Connection request sent!");
          onConnectionChange?.();
        }
      } else {
        await addDoc(collection(db, "connections"), { user_id: currentUserId, friend_id: userId, status: 'pending' });
        setConnectionStatus('pending_sent');
        toast.success("Connection request sent!");
        onConnectionChange?.();
      }
    }

    setProcessing(false);
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!currentUserId || currentUserId === userId) {
    return null;
  }

  const getButtonContent = () => {
    if (processing) {
      return <Loader2 className="h-4 w-4 animate-spin mr-2" />;
    }

    switch (connectionStatus) {
      case 'connected':
        return <UserMinus className="h-4 w-4 mr-2" />;
      case 'pending_sent':
        return <Clock className="h-4 w-4 mr-2" />;
      case 'pending_received':
        return <UserPlus className="h-4 w-4 mr-2" />;
      default:
        return <UserPlus className="h-4 w-4 mr-2" />;
    }
  };

  const getButtonText = () => {
    switch (connectionStatus) {
      case 'connected':
        return "Connected";
      case 'pending_sent':
        return "Pending";
      case 'pending_received':
        return "Accept";
      default:
        return "Connect";
    }
  };

  return (
    <Button
      variant={connectionStatus === 'none' || connectionStatus === 'pending_received' ? "default" : "outline"}
      size="sm"
      onClick={handleConnect}
      disabled={processing}
    >
      {getButtonContent()}
      {getButtonText()}
    </Button>
  );
};
