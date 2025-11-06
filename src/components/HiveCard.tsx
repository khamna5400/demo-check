import { MapPin, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";
import { formatTime12Hour, cn } from "@/lib/utils";

const presetImages = {
  music: { gradient: 'from-purple-500 to-pink-500', emoji: '🎵' },
  food: { gradient: 'from-orange-500 to-red-500', emoji: '🍕' },
  sports: { gradient: 'from-blue-500 to-cyan-500', emoji: '⚽' },
  social: { gradient: 'from-yellow-500 to-amber-500', emoji: '🎉' },
  creative: { gradient: 'from-indigo-500 to-purple-500', emoji: '🎨' }
};

interface HiveCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  eventDate: string;
  eventTime: string;
  location: string;
  coverImageUrl?: string;
  attendeeCount: number;
  onClick: () => void;
}

export const HiveCard = ({
  title,
  description,
  category,
  eventDate,
  eventTime,
  location,
  coverImageUrl,
  attendeeCount,
  onClick,
}: HiveCardProps) => {
  const [imageError, setImageError] = useState(false);
  
  const categoryColors: Record<string, string> = {
    social: "bg-primary text-primary-foreground",
    sports: "bg-secondary text-secondary-foreground",
    arts: "bg-accent text-accent-foreground",
    food: "bg-orange-500 text-white",
    music: "bg-purple-500 text-white",
    gaming: "bg-blue-500 text-white",
    study: "bg-green-500 text-white",
    outdoors: "bg-teal-500 text-white",
    other: "bg-muted text-muted-foreground",
  };

  // Check if it's a preset image
  const isPreset = coverImageUrl?.startsWith('preset:');
  const presetId = isPreset ? coverImageUrl?.split(':')[1] : null;
  const preset = presetId ? presetImages[presetId as keyof typeof presetImages] : null;

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-0"
      style={{ boxShadow: "var(--shadow-card)" }}
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden bg-muted">
        {preset ? (
          <div className={cn(
            "w-full h-full bg-gradient-to-br flex items-center justify-center",
            preset.gradient
          )}>
            <span className="text-6xl">{preset.emoji}</span>
          </div>
        ) : coverImageUrl && !imageError ? (
          <img
            src={coverImageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <span className="text-6xl opacity-50">🎉</span>
          </div>
        )}
        <Badge className={`absolute top-3 left-3 ${categoryColors[category] || categoryColors.other}`}>
          {category}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-2">
        <h3 className="text-xl font-bold line-clamp-1">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(eventDate), "MMM d")} at {formatTime12Hour(eventTime)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{location}</span>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{attendeeCount} attending</span>
        </div>
      </CardFooter>
    </Card>
  );
};
