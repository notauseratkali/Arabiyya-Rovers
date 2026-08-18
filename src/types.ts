export type NavSection = 
  | 'dashboard' 
  | 'chat' 
  | 'announcements' 
  | 'notebook' 
  | 'members' 
  | 'settings'
  | 'governance'
  | 'finance'
  | 'progress'
  | 'events'
  | 'media'
  | 'records';

export type NoteStatus = 'draft' | 'published' | 'archived';

export type NoteCategory = 
  | 'General'
  | 'Crew Meeting'
  | 'Expedition & Hike'
  | 'Training & Badges'
  | 'Crew Project'
  | 'Field Log'
  | 'Announcement';

export interface NoteItem {
  id: string;
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  status: NoteStatus;
  category: NoteCategory;
  tags: string[];
  author: string;
  authorRole: string;
  createdAt: string;
  updatedAt: string;
  coverColor?: string;
  pinned?: boolean;
}

export type AnnouncementPriority = 'urgent' | 'high' | 'normal';
export type AnnouncementCategory = 'General' | 'Council Notice' | 'Expedition' | 'Training' | 'Urgent';

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  createdAt: string;
  pinned?: boolean;
  eventDate?: string;
  location?: string;
  attachments?: { name: string; url: string }[];
}
