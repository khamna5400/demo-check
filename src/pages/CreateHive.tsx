import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { db, storage } from "@/integrations/firebase/client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, CalendarIcon, Link as LinkIcon, Upload, ImageIcon, Sparkles, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type ImageMode = 'file' | 'url' | 'preset' | 'none';

interface PresetImage {
  id: string;
  label: string;
  gradient: string;
  emoji: string;
}

const presetImages: PresetImage[] = [
  { id: 'music', label: 'Music', gradient: 'from-purple-500 to-pink-500', emoji: '🎵' },
  { id: 'food', label: 'Food & Drinks', gradient: 'from-orange-500 to-red-500', emoji: '🍕' },
  { id: 'sports', label: 'Sports & Fitness', gradient: 'from-blue-500 to-cyan-500', emoji: '⚽' },
  { id: 'social', label: 'Social Gathering', gradient: 'from-yellow-500 to-amber-500', emoji: '🎉' },
  { id: 'creative', label: 'Arts & Creative', gradient: 'from-indigo-500 to-purple-500', emoji: '🎨' }
];

const categories = [
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

const CreateHive = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [recurrenceType, setRecurrenceType] = useState("none");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date>();
  
  // Image options state
  const [imageMode, setImageMode] = useState<ImageMode>('none');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [externalLink, setExternalLink] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    // Update preview when image mode or selections change
    if (imageMode === 'file' && imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else if (imageMode === 'url' && imageUrl) {
      setImagePreview(imageUrl);
    } else if (imageMode === 'preset' && selectedPreset) {
      const preset = presetImages.find(p => p.id === selectedPreset);
      if (preset) {
        setImagePreview(`preset:${preset.id}`);
      }
    } else {
      setImagePreview("");
    }
  }, [imageMode, imageFile, imageUrl, selectedPreset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5242880) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP, and GIF files are allowed");
      return;
    }

    setImageFile(file);
    setImageMode('file');
  };


  const handlePresetSelect = (preset: PresetImage) => {
    setSelectedPreset(preset.id);
    setImageMode('preset');
    setImagePreview(''); // Clear preview for presets
  };

  const clearImage = () => {
    setImageFile(null);
    setImageUrl("");
    setSelectedPreset("");
    setImagePreview("");
    setImageMode('none');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate image URL if provided
    if (imageMode === 'url' && imageUrl) {
      try {
        new URL(imageUrl);
        if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) && !imageUrl.includes('imgur') && !imageUrl.includes('cloudinary')) {
          toast.error("Please provide a valid image URL (jpg, png, gif, webp, or svg)");
          return;
        }
      } catch {
        toast.error("Please provide a valid URL");
        return;
      }
    }

    setLoading(true);

    try {
      let coverImageUrl: string | null = null;

      // Handle image upload based on mode
      if (imageMode === 'file' && imageFile) {
        if (isSupabaseConfigured) {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('hive-images')
            .upload(fileName, imageFile);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage
            .from('hive-images')
            .getPublicUrl(fileName);
          coverImageUrl = publicUrl;
        } else {
          const fileExt = imageFile.name.split('.').pop();
          const path = `hive-images/${(user as any).uid}/${Date.now()}.${fileExt}`;
          const ref = storageRef(storage, path);
          await uploadBytes(ref, imageFile);
          coverImageUrl = await getDownloadURL(ref);
        }
      } else if (imageMode === 'url' && imageUrl) {
        coverImageUrl = imageUrl;
      } else if (imageMode === 'preset' && selectedPreset) {
        const preset = presetImages.find(p => p.id === selectedPreset);
        coverImageUrl = preset ? `preset:${preset.id}` : null;
      }

      if (isSupabaseConfigured) {
        const { error } = await supabase.from("hives").insert([{
          title,
          description,
          location,
          category: category as any,
          event_date: format(date, "yyyy-MM-dd"),
          event_time: time,
          host_id: (user as any).id,
          cover_image_url: coverImageUrl,
          recurrence_type: recurrenceType,
          recurrence_end_date: recurrenceEndDate ? format(recurrenceEndDate, "yyyy-MM-dd") : null,
        }]);
        if (error) throw error;
      } else {
        await addDoc(collection(db, "hives"), {
          title,
          description,
          location,
          category,
          event_date: format(date, "yyyy-MM-dd"),
          event_time: time,
          host_id: (user as any).uid,
          cover_image_url: coverImageUrl,
          recurrence_type: recurrenceType,
          recurrence_end_date: recurrenceEndDate ? format(recurrenceEndDate, "yyyy-MM-dd") : null,
          created_at: serverTimestamp(),
        });
      }

      toast.success("Hive created successfully! 🎉");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to create hive");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} profile={profile} />

      <div className="container py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Create a Hive</CardTitle>
            <CardDescription>
              Share an event and bring your community together
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name of Hive */}
              <div className="space-y-2">
                <Label htmlFor="title">Name of Hive *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Coffee & Connect Downtown"
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Central Park, NYC"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell people what this hive is all about..."
                  rows={4}
                  required
                />
              </div>

              {/* Image Options and External Link - Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Options */}
                <div className="space-y-3">
                  <Label>Cover Image (Optional)</Label>
                  <Tabs value={imageMode} onValueChange={(value) => setImageMode(value as ImageMode)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="file"><Upload className="h-4 w-4" /></TabsTrigger>
                      <TabsTrigger value="url"><ImageIcon className="h-4 w-4" /></TabsTrigger>
                      <TabsTrigger value="preset"><Sparkles className="h-4 w-4" /></TabsTrigger>
                      <TabsTrigger value="none"><X className="h-4 w-4" /></TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="file" className="space-y-3 mt-3">
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                        <Input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload image (max 5MB)
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG, WEBP, GIF
                          </p>
                        </label>
                      </div>
                      {imagePreview && imageMode === 'file' && (
                        <div className="relative">
                          <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={clearImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="url" className="space-y-3 mt-3">
                      <Input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/image.jpg"
                      />
                      {imagePreview && imageMode === 'url' && (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-32 object-cover rounded-lg"
                            onError={() => setImagePreview('')}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={clearImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="preset" className="mt-3">
                      <div className="grid grid-cols-2 gap-3">
                        {presetImages.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handlePresetSelect(preset)}
                            className={cn(
                              "p-4 rounded-lg border-2 transition-all hover:scale-105",
                              selectedPreset === preset.id 
                                ? "border-primary ring-2 ring-primary" 
                                : "border-border"
                            )}
                          >
                            <div className={cn(
                              "w-full h-20 rounded-md bg-gradient-to-br flex items-center justify-center text-3xl mb-2",
                              preset.gradient
                            )}>
                              {preset.emoji}
                            </div>
                            <p className="text-xs font-medium text-center">{preset.label}</p>
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="none" className="mt-3">
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No image will be displayed</p>
                        <p className="text-xs mt-1">A default gradient will be used</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* External Link */}
                <div className="space-y-3">
                  <Label htmlFor="external-link">External Link (Optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Add a link to RSVP page, event website, or more info
                  </p>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="external-link"
                      type="url"
                      value={externalLink}
                      onChange={(e) => setExternalLink(e.target.value)}
                      placeholder="https://example.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Hive Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility */}
              <div className="space-y-3">
                <Label>Who are you telling? *</Label>
                <RadioGroup value={visibility} onValueChange={setVisibility}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public" className="font-normal cursor-pointer">
                      Public - Anyone can see and join
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private" className="font-normal cursor-pointer">
                      Private - Only invited people can join
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="connections" id="connections" />
                    <Label htmlFor="connections" className="font-normal cursor-pointer">
                      Just my connections
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Recurring Options */}
              <div className="space-y-3">
                <Label>Recurring Event</Label>
                <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Does not repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                
                {recurrenceType !== "none" && (
                  <div className="space-y-2 mt-3">
                    <Label>Repeat Until</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !recurrenceEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : "Pick an end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={recurrenceEndDate}
                          onSelect={setRecurrenceEndDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Hive
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateHive;
