import type { FC } from "react";
import { LogOut } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/shared/ui";
import { signOut, useAnalytics } from "~/shared/lib";

interface UserMenuProps {
  email: string;
}

const getInitials = (email: string): string => {
  const name = email.split("@")[0];
  return name.slice(0, 2).toUpperCase();
};

export const UserMenu: FC<UserMenuProps> = ({ email }) => {
  const analytics = useAnalytics();

  const handleSignOut = async () => {
    analytics.reset();
    await signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/8 text-xs font-bold text-secondary dark:text-primary">
              {getInitials(email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="size-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
