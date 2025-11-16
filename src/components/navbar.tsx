'use client';

import type React from 'react';

import { FolderPlus, HelpCircle, LogOut, Menu, User } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Link, useRouterState } from '@tanstack/react-router';
import { Route as AccountRoute } from '../app/routes/account';

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface NavbarProps {
  logo?: {
    url: string;
    src: string;
    submarkSrc: string;
    alt: string;
    title: string;
  };
  menu?: MenuItem[];
  user?: {
    name: string;
    email: string;
    credits: number;
    maxCredits: number;
  };
  isLoading?: boolean;
  onCreateFolder?: () => void;
  onSignOut?: () => void;
  onHelp?: () => void;
}

const Navbar = ({
  logo = {
    url: '/',
    src: '/logo.svg',
    submarkSrc: '/submark.svg',
    alt: 'JustSendTo.Me logo',
    title: 'Justsendto.me',
  },
  menu = [
    { title: 'Home', url: '/' },
    { title: 'Pricing', url: '/#pricing' },
    { title: 'About', url: '/about' },
  ],
  user,
  onSignOut,
  onHelp = () => console.log('Help clicked'), //todo
}: NavbarProps) => {
  const route = useRouterState();
  const creditPercentage = user && (user.credits / user.maxCredits) * 100;
  const userInitials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <section className="border-b py-4">
      <div className="container mx-auto px-4">
        {/* Desktop Menu */}
        <nav className="hidden justify-between lg:flex">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to={logo.url} className="flex items-center gap-2">
              <img
                src={logo.src}
                className="max-h-8"
                alt={logo.alt}
                width={175}
              />
            </Link>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <Button asChild size="sm" variant="outline">
                <Link to="/new">
                  <FolderPlus className="mr-2 size-4" />
                  Create Folder
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarFallback className="text-xs">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm leading-none font-semibold">
                            {user.name}
                          </p>
                          <p className="text-muted-foreground text-xs leading-none">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Credits</span>
                          <span className="font-medium">
                            {user.credits} / {user.maxCredits}
                          </span>
                        </div>
                        <Progress value={creditPercentage} className="h-2" />
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={AccountRoute.to}>
                      <User className="mr-2 size-4" />
                      Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onHelp}>
                    <HelpCircle className="mr-2 size-4" />
                    Help
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSignOut}>
                    <LogOut className="mr-2 size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link
                  to={'/sign-in'}
                  search={{
                    redirect:
                      route.location.pathname !== '/change-password'
                        ? location.pathname
                        : undefined,
                  }}
                >
                  Sign in
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link
                  to={'/sign-up'}
                  search={{
                    redirect:
                      route.location.pathname !== '/change-password'
                        ? location.pathname
                        : undefined,
                  }}
                >
                  Sign up
                </Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile Menu */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to={logo.url} className="flex items-center gap-2">
              <img
                src={logo.src}
                className="max-h-8"
                width={175}
                alt={logo.alt}
              />
            </Link>
            <div className="mr-2 ml-auto flex items-center gap-2">
              {user ? (
                <>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/new">
                      <FolderPlus className="size-4" />
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-72" align="end">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-10">
                              <AvatarFallback className="text-xs">
                                {userInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col space-y-1">
                              <p className="text-sm leading-none font-semibold">
                                {user.name}
                              </p>
                              <p className="text-muted-foreground text-xs leading-none">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Credits
                              </span>
                              <span className="font-medium">
                                {user.credits} / {user.maxCredits}
                              </span>
                            </div>
                            <Progress
                              value={creditPercentage}
                              className="h-2"
                            />
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/account">
                          <User className="mr-2 size-4" />
                          Account
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onHelp}>
                        <HelpCircle className="mr-2 size-4" />
                        Help
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onSignOut}>
                        <LogOut className="mr-2 size-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button asChild size="sm">
                  <Link
                    to={'/sign-up'}
                    search={{
                      redirect:
                        route.location.pathname !== '/change-password'
                          ? location.pathname
                          : undefined,
                    }}
                  >
                    Sign up
                  </Link>
                </Button>
              )}
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Link to={logo.url} className="inline-block h-8">
                      <img
                        src={logo.submarkSrc}
                        className="max-h-8"
                        alt={logo.alt}
                        height={32}
                        width={45}
                      />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  <Accordion
                    type="single"
                    collapsible
                    className="flex w-full flex-col gap-4"
                  >
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>
                  {user ? (
                    <Button asChild variant="outline">
                      <Link to="/new">
                        <FolderPlus className="mr-2 size-4" />
                        Create Folder
                      </Link>
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Button asChild variant="outline">
                        <Link
                          to={'/sign-in'}
                          search={{
                            redirect:
                              route.location.pathname !== '/change-password'
                                ? location.pathname
                                : undefined,
                          }}
                        >
                          Sign in
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link
                          to={'/sign-in'}
                          search={{
                            redirect:
                              route.location.pathname !== '/change-password'
                                ? location.pathname
                                : undefined,
                          }}
                        >
                          Sign up
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
};

const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent className="bg-popover text-popover-foreground">
          {item.items.map((subItem) => (
            <NavigationMenuLink asChild key={subItem.title} className="w-80">
              <SubMenuLink item={subItem} />
            </NavigationMenuLink>
          ))}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink
        asChild
        className="bg-background hover:bg-muted hover:text-accent-foreground group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
      >
        <Link to={item.url}>{item.title}</Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <SubMenuLink key={subItem.title} item={subItem} />
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <Link key={item.title} to={item.url} className="text-md font-semibold">
      {item.title}
    </Link>
  );
};

const SubMenuLink = ({ item }: { item: MenuItem }) => {
  return (
    <Link
      className="hover:bg-muted hover:text-accent-foreground flex min-w-80 flex-row gap-4 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
      to={item.url}
    >
      <div className="text-foreground">{item.icon}</div>
      <div>
        <div className="text-sm font-semibold">{item.title}</div>
        {item.description && (
          <p className="text-muted-foreground text-sm leading-snug">
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
};

export { Navbar };
