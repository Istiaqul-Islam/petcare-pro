// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  phone: string | null;
  address: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

// Pet types
export interface Pet {
  id: string;
  userId: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  birthDate: Date | null;
  weight: number | null;
  color: string | null;
  photo: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PetFormData {
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  birthDate?: string;
  weight?: number;
  color?: string;
  photo?: string;
  notes?: string;
}

// Veterinarian types
export interface Veterinarian {
  id: string;
  name: string;
  specialization: string;
  clinic: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  photo: string | null;
  qualification: string | null;
  experience: number | null;
  rating: number;
  reviewCount: number;
  consultationFee: number | null;
  availability: string | null;
  bio: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Availability {
  [key: string]: { start: string; end: string } | null;
}

// Appointment types
export interface Appointment {
  id: string;
  userId: string;
  petId: string;
  vetId: string;
  date: Date;
  time: string;
  duration: number;
  reason: string | null;
  type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  fee: number | null;
  createdAt: Date;
  updatedAt: Date;
  pet?: Pet;
  vet?: Veterinarian;
}

export interface AppointmentFormData {
  petId: string;
  vetId: string;
  date: string;
  time: string;
  duration?: number;
  reason?: string;
  type?: string;
  notes?: string;
}

// Vaccination types
export interface Vaccination {
  id: string;
  petId: string;
  userId: string;
  name: string;
  type: string | null;
  manufacturer: string | null;
  dateAdministered: Date | null;
  nextDueDate: Date | null;
  veterinarian: string | null;
  clinic: string | null;
  batchNumber: string | null;
  notes: string | null;
  status: 'scheduled' | 'completed' | 'overdue' | 'cancelled';
  reminderSent: boolean;
  reminderDays: number;
  createdAt: Date;
  updatedAt: Date;
  pet?: Pet;
}

export interface VaccinationFormData {
  petId: string;
  name: string;
  type?: string;
  manufacturer?: string;
  dateAdministered?: string;
  nextDueDate?: string;
  veterinarian?: string;
  clinic?: string;
  batchNumber?: string;
  notes?: string;
  reminderDays?: number;
}

// Social types
export interface Post {
  id: string;
  userId: string;
  content: string;
  images: string | null;
  likesCount: number;
  commentsCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  isLiked?: boolean;
}

export interface PostFormData {
  content: string;
  images?: string[];
  isPublic?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

// Feedback types
export interface Feedback {
  id: string;
  userId: string;
  rating: number;
  category: string;
  subject: string | null;
  message: string;
  status: 'pending' | 'reviewed' | 'resolved';
  adminResponse: string | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface FeedbackFormData {
  rating: number;
  category: string;
  subject?: string;
  message: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'vaccination' | 'appointment' | 'system' | 'social';
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Stats types
export interface DashboardStats {
  totalPets: number;
  totalAppointments: number;
  upcomingVaccinations: number;
  totalPosts: number;
}
