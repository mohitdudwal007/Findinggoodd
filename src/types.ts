export interface Movie {
  id: string | number;
  title: string;
  year: string;
  rating: number;
  poster: string;
  genre: string;
  size: string;
  downloadLink?: string;
  watchLink?: string;
  isTrending?: boolean;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface MovieRequest {
  id: string;
  title: string;
  message?: string;
  status: 'pending' | 'fulfilled' | 'rejected';
  createdAt: any;
  updatedAt: any;
}

export interface AdSettings {
  content: string;
  posterUrl: string;
  isActive: boolean;
  timerSeconds: number;
  updatedAt: any;
}

export interface SiteSettings {
  siteName: string;
  copyrightText: string;
  omdbApiKey: string;
  updatedAt: any;
}
