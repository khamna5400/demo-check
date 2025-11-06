import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Trophy, Zap, Music, Building2, Users, Camera } from "lucide-react";
import { ArtistProfileFields } from "@/components/ArtistProfileFields";
import { VenueProfileFields } from "@/components/VenueProfileFields";
import { FollowButton } from "@/components/FollowButton";
import { ConnectButton } from "@/components/ConnectButton";

const Profile = () => {
  const { id: profileId } = useParams();
  const { user, profile: currentUserProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  
  // Artist fields
  const [genres, setGenres] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<any>({});
  const [artistBio, setArtistBio] = useState("");
  
  // Venue fields
  const [capacity, setCapacity] = useState<number | null>(null);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [venueType, setVenueType] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  
  const navigate = useNavigate();

  const isOwnProfile = !profileId || (user && profileId === user.id);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user && !profileId) {
        navigate("/auth");
        return;
      }

      const targetUserId = profileId || user?.id;
      if (targetUserId) {
        await fetchProfile(targetUserId);
      }
    };

    loadProfile();
  }, [navigate, profileId, user]);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    
    // If viewing own profile, query profiles table directly (has full access via RLS)
    // If viewing other's profile, use secure function (excludes contact info)
    const isOwnProfileView = user && userId === user.id;
    
    if (isOwnProfileView) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } else {
        setProfile(data);
        setName(data.name || "");
        setBio(data.bio || "");
        setLocation(data.location || "");
        
        // Artist fields
        setGenres(data.genres || []);
        setSocialLinks(data.social_links || {});
        setArtistBio(data.artist_bio || "");
        
        // Venue fields
        setCapacity(data.capacity);
        setAmenities(data.amenities || []);
        setVenueType(data.venue_type || "");
        setContactEmail(data.contact_email || "");
        setContactPhone(data.contact_phone || "");
      }
    } else {
      // Use secure function for other users' profiles (no contact info)
      const { data, error } = await supabase.rpc('get_public_profile', { profile_id: userId });

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } else if (data && data.length > 0) {
        const profileData = data[0];
        setProfile(profileData);
        setName(profileData.name || "");
        setBio(profileData.bio || "");
        setLocation(profileData.location || "");
        
        // Artist fields
        setGenres(profileData.genres || []);
        setSocialLinks(profileData.social_links || {});
        setArtistBio(profileData.artist_bio || "");
        
        // Venue fields
        setCapacity(profileData.capacity);
        setAmenities(profileData.amenities || []);
        setVenueType(profileData.venue_type || "");
        // Contact info not available for other users' profiles
        setContactEmail("");
        setContactPhone("");
      }
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updateData: any = {
      name,
      bio,
      location,
    };

    // Add artist-specific fields if user is an artist
    if (profile?.user_type === 'artist') {
      updateData.genres = genres;
      updateData.social_links = socialLinks;
      updateData.artist_bio = artistBio;
    }

    // Add venue-specific fields if user is a venue
    if (profile?.user_type === 'venue') {
      updateData.capacity = capacity;
      updateData.amenities = amenities;
      updateData.venue_type = venueType;
      updateData.contact_email = contactEmail;
      updateData.contact_phone = contactPhone;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user!.id);

    if (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } else {
      toast.success("Profile updated!");
      await refreshProfile();
      await fetchProfile(user!.id);
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WEBP image");
      return;
    }

    setUploadingAvatar(true);

    try {
      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success("Profile picture updated!");
      await fetchProfile(user.id);
      await refreshProfile();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error("Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getLevelProgress = (xp: number) => {
    const levels = [
      { name: "newbie", min: 0, max: 50 },
      { name: "explorer", min: 50, max: 200 },
      { name: "connector", min: 200, max: 500 },
      { name: "influencer", min: 500, max: 1000 },
      { name: "legend", min: 1000, max: Infinity },
    ];
    
    const currentLevel = levels.find(l => l.name === profile?.level) || levels[0];
    const progress = currentLevel.max === Infinity 
      ? 100 
      : ((xp - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;
    
    return Math.min(progress, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} profile={currentUserProfile} />
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} profile={currentUserProfile} />

      <div className="container py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Profile Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                      {profile?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">{profile?.name}</h1>
                    {!isOwnProfile && (
                      profile?.user_type === 'artist' ? (
                        <FollowButton artistId={profile.id} currentUserId={user?.id} />
                      ) : (
                        <ConnectButton userId={profile.id} currentUserId={user?.id} />
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                    <Badge variant="secondary" className="capitalize">
                      {profile?.level || "newbie"}
                    </Badge>
                    <Badge variant="outline" className="capitalize flex items-center gap-1">
                      {profile?.user_type === 'artist' && <Music className="h-3 w-3" />}
                      {profile?.user_type === 'venue' && <Building2 className="h-3 w-3" />}
                      {profile?.user_type === 'fan' && <Users className="h-3 w-3" />}
                      {profile?.user_type || "fan"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {profile?.xp || 0} XP
                    </span>
                  </div>
                  {profile?.location && (
                    <p className="text-muted-foreground">{profile.location}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* XP Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Level Progress</span>
                  <span className="font-medium">{Math.round(getLevelProgress(profile?.xp || 0))}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                    style={{ width: `${getLevelProgress(profile?.xp || 0)}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total XP</p>
                    <p className="font-semibold">{profile?.xp || 0}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rank</p>
                  <p className="font-semibold capitalize">{profile?.level || "Newbie"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Form - Only show for own profile */}
          {isOwnProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, State"
                    />
                  </div>

                  {/* Artist-specific fields */}
                  {profile?.user_type === 'artist' && (
                    <ArtistProfileFields
                      genres={genres}
                      socialLinks={socialLinks}
                      artistBio={artistBio}
                      onGenresChange={setGenres}
                      onSocialLinksChange={setSocialLinks}
                      onArtistBioChange={setArtistBio}
                    />
                  )}

                  {/* Venue-specific fields */}
                  {profile?.user_type === 'venue' && (
                    <VenueProfileFields
                      capacity={capacity}
                      amenities={amenities}
                      venueType={venueType}
                      contactEmail={contactEmail}
                      contactPhone={contactPhone}
                      onCapacityChange={setCapacity}
                      onAmenitiesChange={setAmenities}
                      onVenueTypeChange={setVenueType}
                      onContactEmailChange={setContactEmail}
                      onContactPhoneChange={setContactPhone}
                    />
                  )}

                  <Button type="submit" disabled={saving} className="w-full">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Bio display for other users */}
          {!isOwnProfile && profile?.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Artist-specific info display */}
          {profile?.user_type === 'artist' && !isOwnProfile && (
            <>
              {profile?.artist_bio && (
                <Card>
                  <CardHeader>
                    <CardTitle>About the Artist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{profile.artist_bio}</p>
                  </CardContent>
                </Card>
              )}
              
              {profile?.genres && profile.genres.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Genres</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.genres.map((genre: string) => (
                        <Badge key={genre} variant="secondary">{genre}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {profile?.social_links && Object.keys(profile.social_links).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Social Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {profile.social_links.spotify && (
                      <a href={profile.social_links.spotify} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline block">
                        🎵 Spotify
                      </a>
                    )}
                    {profile.social_links.instagram && (
                      <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer"
                         className="text-primary hover:underline block">
                        📸 Instagram
                      </a>
                    )}
                    {profile.social_links.youtube && (
                      <a href={profile.social_links.youtube} target="_blank" rel="noopener noreferrer"
                         className="text-primary hover:underline block">
                        🎬 YouTube
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Venue-specific info display */}
          {profile?.user_type === 'venue' && !isOwnProfile && (
            <>
              {profile?.venue_type && (
                <Card>
                  <CardHeader>
                    <CardTitle>Venue Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{profile.venue_type}</p>
                    </div>
                    {profile.capacity && (
                      <div>
                        <p className="text-sm text-muted-foreground">Capacity</p>
                        <p className="font-medium">{profile.capacity} people</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {profile?.amenities && profile.amenities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.amenities.map((amenity: string) => (
                        <Badge key={amenity} variant="secondary">{amenity}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(profile?.contact_email || profile?.contact_phone) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {profile.contact_email && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <a href={`mailto:${profile.contact_email}`} className="text-primary hover:underline">
                          {profile.contact_email}
                        </a>
                      </div>
                    )}
                    {profile.contact_phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <a href={`tel:${profile.contact_phone}`} className="text-primary hover:underline">
                          {profile.contact_phone}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
