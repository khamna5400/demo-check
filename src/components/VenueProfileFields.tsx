import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface VenueProfileFieldsProps {
  capacity: number | null;
  amenities: string[];
  venueType: string;
  contactEmail: string;
  contactPhone: string;
  onCapacityChange: (capacity: number | null) => void;
  onAmenitiesChange: (amenities: string[]) => void;
  onVenueTypeChange: (type: string) => void;
  onContactEmailChange: (email: string) => void;
  onContactPhoneChange: (phone: string) => void;
}

export const VenueProfileFields = ({
  capacity,
  amenities,
  venueType,
  contactEmail,
  contactPhone,
  onCapacityChange,
  onAmenitiesChange,
  onVenueTypeChange,
  onContactEmailChange,
  onContactPhoneChange,
}: VenueProfileFieldsProps) => {
  const [newAmenity, setNewAmenity] = useState("");

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      onAmenitiesChange([...amenities, newAmenity.trim()]);
      setNewAmenity("");
    }
  };

  const removeAmenity = (amenity: string) => {
    onAmenitiesChange(amenities.filter(a => a !== amenity));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="venue-type">Venue Type</Label>
        <Input
          id="venue-type"
          value={venueType}
          onChange={(e) => onVenueTypeChange(e.target.value)}
          placeholder="e.g., Restaurant, Bar, Coffee Shop, Concert Hall"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          value={capacity || ""}
          onChange={(e) => onCapacityChange(e.target.value ? parseInt(e.target.value) : null)}
          placeholder="Maximum number of attendees"
        />
      </div>

      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="flex gap-2">
          <Input
            value={newAmenity}
            onChange={(e) => setNewAmenity(e.target.value)}
            placeholder="Add amenity (e.g., Sound System, Stage)"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
          />
          <Button type="button" onClick={addAmenity} variant="secondary">
            Add
          </Button>
        </div>
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {amenities.map((amenity) => (
              <Badge key={amenity} variant="secondary" className="gap-1">
                {amenity}
                <button
                  type="button"
                  onClick={() => removeAmenity(amenity)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">Contact Email</Label>
        <Input
          id="contact-email"
          type="email"
          value={contactEmail}
          onChange={(e) => onContactEmailChange(e.target.value)}
          placeholder="bookings@venue.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-phone">Contact Phone</Label>
        <Input
          id="contact-phone"
          type="tel"
          value={contactPhone}
          onChange={(e) => onContactPhoneChange(e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>
    </div>
  );
};
