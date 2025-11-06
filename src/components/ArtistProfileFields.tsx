import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ArtistProfileFieldsProps {
  genres: string[];
  socialLinks: any;
  artistBio: string;
  onGenresChange: (genres: string[]) => void;
  onSocialLinksChange: (links: any) => void;
  onArtistBioChange: (bio: string) => void;
}

export const ArtistProfileFields = ({
  genres,
  socialLinks,
  artistBio,
  onGenresChange,
  onSocialLinksChange,
  onArtistBioChange,
}: ArtistProfileFieldsProps) => {
  const [newGenre, setNewGenre] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState(socialLinks?.spotify || "");
  const [instagramUrl, setInstagramUrl] = useState(socialLinks?.instagram || "");
  const [youtubeUrl, setYoutubeUrl] = useState(socialLinks?.youtube || "");

  const addGenre = () => {
    if (newGenre.trim() && !genres.includes(newGenre.trim())) {
      onGenresChange([...genres, newGenre.trim()]);
      setNewGenre("");
    }
  };

  const removeGenre = (genre: string) => {
    onGenresChange(genres.filter(g => g !== genre));
  };

  const handleSocialLinksBlur = () => {
    onSocialLinksChange({
      spotify: spotifyUrl,
      instagram: instagramUrl,
      youtube: youtubeUrl,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="artist-bio">Artist Bio</Label>
        <Textarea
          id="artist-bio"
          value={artistBio}
          onChange={(e) => onArtistBioChange(e.target.value)}
          placeholder="Tell fans about your music and journey..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Genres</Label>
        <div className="flex gap-2">
          <Input
            value={newGenre}
            onChange={(e) => setNewGenre(e.target.value)}
            placeholder="Add a genre (e.g., Rock, Jazz)"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
          />
          <Button type="button" onClick={addGenre} variant="secondary">
            Add
          </Button>
        </div>
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {genres.map((genre) => (
              <Badge key={genre} variant="secondary" className="gap-1">
                {genre}
                <button
                  type="button"
                  onClick={() => removeGenre(genre)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Label>Social Links</Label>
        <div className="space-y-2">
          <Input
            placeholder="Spotify Profile URL"
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            onBlur={handleSocialLinksBlur}
          />
          <Input
            placeholder="Instagram Profile URL"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            onBlur={handleSocialLinksBlur}
          />
          <Input
            placeholder="YouTube Channel URL"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onBlur={handleSocialLinksBlur}
          />
        </div>
      </div>
    </div>
  );
};
