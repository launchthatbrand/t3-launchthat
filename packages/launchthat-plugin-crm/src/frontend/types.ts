export type ContactRow = {
  _id: string;
  _creationTime: number;
  title: string;
  content?: string;
  excerpt?: string;
  slug: string;
  status: string;
  category?: string;
  tags?: string[];
  featuredImageUrl?: string;
  postTypeSlug: string;
  organizationId?: string;
  authorId?: string;
  userId?: string;
  createdAt: number;
  updatedAt?: number;
};

export type ContactMetaRow = {
  _id: string;
  _creationTime: number;
  contactId: string;
  key: string;
  value?: string | number | boolean | null;
  createdAt: number;
  updatedAt?: number;
};

export type ContactFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  tags: string;
  notes: string;
};
