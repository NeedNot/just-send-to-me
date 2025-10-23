'use client';

import type React from 'react';

import {
  Book,
  FolderPlus,
  HelpCircle,
  LogOut,
  Menu,
  Sunset,
  Trees,
  User,
  Zap,
} from 'lucide-react';

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
import { Link, useNavigate } from '@tanstack/react-router';
import { Skeleton } from './ui/skeleton';

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface NavbarSignedInProps {
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

const NavbarSignedIn = ({
  logo = {
    url: '/',
    src: '/logo.svg',
    submarkSrc: '/submark.svg',
    alt: 'JustSendTo.Me logo',
    title: 'Justsendto.me',
  },
  menu = [
    { title: 'Home', url: '#' },
    {
      title: 'Products',
      url: '#',
      items: [
        {
          title: 'Blog',
          description: 'The latest industry news, updates, and info',
          icon: <Book className="size-5 shrink-0" />,
          url: '#',
        },
        {
          title: 'Company',
          description: 'Our mission is to innovate and empower the world',
          icon: <Trees className="size-5 shrink-0" />,
          url: '#',
        },
        {
          title: 'Careers',
          description: 'Browse job listing and discover our workspace',
          icon: <Sunset className="size-5 shrink-0" />,
          url: '#',
        },
        {
          title: 'Support',
          description:
            'Get in touch with our support team or visit our community forums',
          icon: <Zap className="size-5 shrink-0" />,
          url: '#',
        },
      ],
    },
    {
      title: 'Resources',
      url: '#',
      items: [
        {
          title: 'Help Center',
          description: 'Get all the answers you need right here',
          icon: <Zap className="size-5 shrink-0" />,
          url: '#',
        },
        {
          title: 'Contact Us',
          description: 'We are here to help you with any questions you have',
          icon: <Sunset className="size-5 shrink-0" />,
          url: '#',
        },
        {
          title: 'Status',
          description: 'Check the current status of our services and APIs',
          icon: <Trees className="size-5 shrink-0" />,
          url: '#',
        },
        {
          title: 'Terms of Service',
          description: 'Our terms and conditions for using our services',
          icon: <Book className="size-5 shrink-0" />,
          url: '#',
        },
      ],
    },
    {
      title: 'Pricing',
      url: '#',
    },
    {
      title: 'Blog',
      url: '#',
    },
  ],
  user = {
    name: '',
    email: '',
    credits: 0,
    maxCredits: 0,
  },
  isLoading = false,
  onSignOut = () => console.log('Sign out clicked'),
  onHelp = () => console.log('Help clicked'),
}: NavbarSignedInProps) => {
  const navigate = useNavigate();
  const onCreateFolder = () => navigate({ to: '/new' });
  const creditPercentage = (user.credits / user.maxCredits) * 100;
  const userInitials = user.name
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
                src={logo.src || '/placeholder.svg'}
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
          <div className="flex items-center gap-3">
            <Button onClick={onCreateFolder} size="sm" variant="outline">
              <FolderPlus className="mr-2 size-4" />
              Create Folder
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {isLoading ? (
                  <Skeleton className="size-9 rounded-full" />
                ) : (
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center gap-3">
                      {isLoading ? (
                        <Skeleton className="size-10 rounded-full" />
                      ) : (
                        <Avatar className="size-10">
                          <AvatarFallback className="text-xs">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-col space-y-1">
                        {isLoading ? (
                          <Skeleton className="h-3.5 w-3/4" />
                        ) : (
                          <p className="text-sm leading-none font-semibold">
                            {user.name}
                          </p>
                        )}
                        {isLoading ? (
                          <Skeleton className="h-3 w-40" />
                        ) : (
                          <p className="text-muted-foreground text-xs leading-none">
                            {user.email}
                          </p>
                        )}
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
                <DropdownMenuItem onClick={() => navigate({ to: '/account' })}>
                  <User className="mr-2 size-4" />
                  Account
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
              <Button onClick={onCreateFolder} size="sm" variant="outline">
                <FolderPlus className="size-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {isLoading ? (
                    <Skeleton className="size-8 rounded-full" />
                  ) : (
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center gap-3">
                        {isLoading ? (
                          <Skeleton className="size-10 rounded-full" />
                        ) : (
                          <Avatar className="size-10">
                            <AvatarFallback className="text-xs">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col space-y-1">
                          {isLoading ? (
                            <Skeleton className="h-3.5 w-3/4" />
                          ) : (
                            <p className="text-sm leading-none font-semibold">
                              {user.name}
                            </p>
                          )}
                          {isLoading ? (
                            <Skeleton className="h-3 w-40" />
                          ) : (
                            <p className="text-muted-foreground text-xs leading-none">
                              {user.email}
                            </p>
                          )}
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
                  <DropdownMenuItem
                    onClick={() => navigate({ to: '/account' })}
                  >
                    <User className="mr-2 size-4" />
                    Account
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Link to={logo.url} className="flex items-center gap-2">
                      <img
                        src={logo.submarkSrc}
                        className="max-h-8"
                        alt={logo.alt}
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
                  <Button onClick={onCreateFolder} variant="outline">
                    <FolderPlus className="mr-2 size-4" />
                    Create Folder
                  </Button>
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
        href={item.url}
        className="bg-background hover:bg-muted hover:text-accent-foreground group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
      >
        {item.title}
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
    <a key={item.title} href={item.url} className="text-md font-semibold">
      {item.title}
    </a>
  );
};

const SubMenuLink = ({ item }: { item: MenuItem }) => {
  return (
    <a
      className="hover:bg-muted hover:text-accent-foreground flex min-w-80 flex-row gap-4 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
      href={item.url}
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
    </a>
  );
};

export { NavbarSignedIn };
