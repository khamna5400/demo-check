import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, LogOut, Home, Plus, Users, UserCheck, Radio, LayoutDashboard, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import hiverLogo from "@/assets/hiver-logo.png";
import hiverIcon from "@/assets/hiver-icon.png";

interface HeaderProps {
  user: any;
  profile: any;
}

export const Header = ({ user, profile }: HeaderProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src={hiverLogo} 
            alt="Hiver" 
            className="h-8 sm:h-10 w-auto hover:opacity-80 transition-opacity"
          />
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/discover")}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Discover</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/connections")}
                className="gap-2"
              >
                <UserCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Connections</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/feed")}
                className="gap-2"
              >
                <Radio className="h-4 w-4" />
                <span className="hidden sm:inline">Feed</span>
              </Button>

              {profile?.user_type === 'artist' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/artist-dashboard")}
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              )}

              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/create-hive")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Hive</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {profile?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {profile?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">{profile?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Level: {profile?.level || "newbie"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/notification-settings")}>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")}>Sign in</Button>
          )}
        </div>
      </div>
    </header>
  );
};
