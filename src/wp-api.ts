export const enum PostStatus {
  Draft = 'draft',
  Publish = 'publish',
  // Future = 'future'
}

export const enum CommentStatus {
  Open = 'open',
  Closed = 'closed'
}

export interface Term {
  id: string;
  name: string;
  slug: string;
  taxonomy: string;
  description: string;
  parent: string;
  count: number;
}

export interface Category {
  categoryId: string;
  parentId: string;
  categoryName: string;
  categoryDescription: string;
  description: string;
  htmlUrl: string;
  rssUrl: string;
}
