/**
 * RYVOLT — Feed & Professional Social Service
 * Multi-tier storage: Supabase PostgreSQL with schema cache tolerance,
 * persistent local storage fallback, and rich candidate community interaction.
 */

import { supabase, isSupabaseConfigured, isSchemaCacheError } from '../lib/supabase';
import { FeedPost, PostComment, PostReaction, PostType } from '../types/database';

const FEED_STORAGE_KEY = 'ryvolt_feed_posts';
const REACTIONS_STORAGE_KEY = 'ryvolt_post_reactions';
const COMMENTS_STORAGE_KEY = 'ryvolt_post_comments';

// Pre-seeded authentic community posts
const defaultStarterPosts: FeedPost[] = [
  {
    id: 'post-seed-1',
    author_id: 'seed-author-1',
    content:
      'Just verified our Raft consensus cluster failover benchmarks in RYVOLT BuildLab. 5-node partition healing passed in under 4.2 seconds with linearizable leader election and 94.8% test coverage. Zero packet drops during asymmetric network splits.',
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    link_url: 'https://github.com/ryvolt-labs/raft-consensus-go',
    post_type: 'project_update',
    likes_count: 14,
    comments_count: 3,
    has_liked: false,
    author_profile: {
      display_name: 'Elena Rostova',
      headline: 'Staff Systems Engineer · Distributed Infrastructure',
      avatar_path: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&q=80',
      location: 'San Francisco, CA',
    },
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'post-seed-2',
    author_id: 'seed-author-2',
    content:
      'Excited to announce our High-Throughput Event Mesh paper was accepted at the Systems Architecture Summit 2026! We tuned zero-copy lock-free ringbuffers in Rust to hit 2.1M ops/sec with sub-millisecond p99 latency.',
    image_url: null,
    link_url: 'https://github.com/ryvolt-labs/high-throughput-event-mesh',
    post_type: 'achievement',
    likes_count: 28,
    comments_count: 6,
    has_liked: true,
    author_profile: {
      display_name: 'Marcus Chen',
      headline: 'Rust Systems Architect · Zero-Copy Networking',
      avatar_path: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&q=80',
      location: 'Seattle, WA',
    },
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'post-seed-3',
    author_id: 'seed-author-3',
    content:
      'Passed the tier-1 distributed storage engineering technical interview today! The interviewer specifically referenced the verified code artifacts on my RYVOLT Career Twin rather than quizzing me on generic leetcode questions. Proof beats resumes.',
    image_url: null,
    link_url: null,
    post_type: 'milestone',
    likes_count: 42,
    comments_count: 8,
    has_liked: false,
    author_profile: {
      display_name: 'Devon Vance',
      headline: 'Backend Infrastructure Engineer · MIT Alumni',
      avatar_path: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&q=80',
      location: 'Austin, TX',
    },
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
];

function getLocalPosts(): FeedPost[] {
  try {
    const raw = localStorage.getItem(FEED_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return defaultStarterPosts;
}

function setLocalPosts(posts: FeedPost[]): void {
  try {
    localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // Ignore
  }
}

function getLocalComments(): PostComment[] {
  try {
    const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

function setLocalComments(comments: PostComment[]): void {
  try {
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
  } catch {
    // Ignore
  }
}

export const feedService = {
  /**
   * Fetch feed posts with author profiles and liked states
   */
  async getPosts(currentUserId?: string): Promise<FeedPost[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('feed_posts')
          .select('*, author_profile:profiles(display_name, headline, avatar_path, location)')
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && data && data.length > 0) {
          let userReactions: string[] = [];
          if (currentUserId) {
            const { data: reactions } = await supabase
              .from('post_reactions')
              .select('post_id')
              .eq('user_id', currentUserId);
            if (reactions) {
              userReactions = reactions.map((r: any) => r.post_id);
            }
          }

          const formatted = (data as any[]).map((post) => ({
            ...post,
            has_liked: userReactions.includes(post.id),
          }));

          setLocalPosts(formatted);
          return formatted;
        }

        if (error && !isSchemaCacheError(error)) {
          console.warn('[RYVOLT] feed_posts query warning:', error.message);
        }
      } catch (err) {
        console.warn('[RYVOLT] feed_posts fetch exception:', err);
      }
    }

    const localPosts = getLocalPosts();
    return localPosts;
  },

  /**
   * Create a new post
   */
  async createPost(
    authorId: string,
    content: string,
    postType: PostType = 'general',
    imageUrl?: string | null,
    linkUrl?: string | null,
    authorProfile?: FeedPost['author_profile']
  ): Promise<FeedPost> {
    const newPost: FeedPost = {
      id: crypto.randomUUID(),
      author_id: authorId,
      content,
      image_url: imageUrl || null,
      link_url: linkUrl || null,
      post_type: postType,
      likes_count: 0,
      comments_count: 0,
      has_liked: false,
      author_profile: authorProfile || {
        display_name: 'You',
        headline: 'Candidate · Software Engineer',
        avatar_path: null,
        location: null,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.from('feed_posts') as any)
          .insert({
            author_id: authorId,
            content,
            post_type: postType,
            image_url: imageUrl || null,
            link_url: linkUrl || null,
          })
          .select('*, author_profile:profiles(display_name, headline, avatar_path, location)')
          .single();

        if (!error && data) {
          const formatted: FeedPost = { ...data, has_liked: false };
          const posts = getLocalPosts();
          setLocalPosts([formatted, ...posts]);
          return formatted;
        }

        if (error && !isSchemaCacheError(error)) {
          console.warn('[RYVOLT] feed_posts insert warning:', error.message);
        }
      } catch (err) {
        console.warn('[RYVOLT] feed_posts insert exception:', err);
      }
    }

    const posts = getLocalPosts();
    setLocalPosts([newPost, ...posts]);
    return newPost;
  },

  /**
   * Delete a post
   */
  async deletePost(postId: string, authorId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('feed_posts')
          .delete()
          .eq('id', postId)
          .eq('author_id', authorId);
      } catch {
        // Fallback
      }
    }

    const posts = getLocalPosts();
    setLocalPosts(posts.filter((p) => p.id !== postId));
  },

  /**
   * Toggle reaction (like / unlike) on a post
   */
  async toggleReaction(postId: string, userId: string): Promise<{ hasLiked: boolean; count: number }> {
    let hasLiked = false;
    let count = 0;

    const posts = getLocalPosts();
    const postIndex = posts.findIndex((p) => p.id === postId);

    if (isSupabaseConfigured()) {
      try {
        const { data: existing } = await (supabase.from('post_reactions') as any)
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          // Unlike
          await (supabase.from('post_reactions') as any).delete().eq('id', existing.id);
          hasLiked = false;
        } else {
          // Like
          await (supabase.from('post_reactions') as any).insert({
            post_id: postId,
            user_id: userId,
            reaction_type: 'like',
          });
          hasLiked = true;
        }

        // Get updated count
        const { count: freshCount } = await (supabase.from('post_reactions') as any)
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        count = freshCount ?? (hasLiked ? 1 : 0);
        await (supabase.from('feed_posts') as any)
          .update({ likes_count: count })
          .eq('id', postId);

        if (postIndex !== -1) {
          posts[postIndex].has_liked = hasLiked;
          posts[postIndex].likes_count = count;
          setLocalPosts(posts);
        }

        return { hasLiked, count };
      } catch (err) {
        console.warn('[RYVOLT] reaction error:', err);
      }
    }

    // Local fallback
    if (postIndex !== -1) {
      const current = posts[postIndex];
      hasLiked = !current.has_liked;
      count = Math.max(0, current.likes_count + (hasLiked ? 1 : -1));
      posts[postIndex].has_liked = hasLiked;
      posts[postIndex].likes_count = count;
      setLocalPosts(posts);
    }

    return { hasLiked, count };
  },

  /**
   * Get comments for a post
   */
  async getComments(postId: string): Promise<PostComment[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.from('post_comments') as any)
          .select('*, author_profile:profiles(display_name, avatar_path, headline)')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          return data as PostComment[];
        }
      } catch {
        // Fallback
      }
    }

    const all = getLocalComments();
    return all.filter((c) => c.post_id === postId);
  },

  /**
   * Add comment to a post
   */
  async createComment(
    postId: string,
    authorId: string,
    content: string,
    authorProfile?: PostComment['author_profile']
  ): Promise<PostComment> {
    const newComment: PostComment = {
      id: crypto.randomUUID(),
      post_id: postId,
      author_id: authorId,
      content,
      author_profile: authorProfile || {
        display_name: 'You',
        avatar_path: null,
        headline: 'Candidate',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.from('post_comments') as any)
          .insert({
            post_id: postId,
            author_id: authorId,
            content,
          })
          .select('*, author_profile:profiles(display_name, avatar_path, headline)')
          .single();

        if (!error && data) {
          return data as PostComment;
        }
      } catch {
        // Fallback
      }
    }

    const all = getLocalComments();
    setLocalComments([...all, newComment]);

    // Update post comments_count in local store
    const posts = getLocalPosts();
    const idx = posts.findIndex((p) => p.id === postId);
    if (idx !== -1) {
      posts[idx].comments_count = (posts[idx].comments_count || 0) + 1;
      setLocalPosts(posts);
    }

    return newComment;
  },

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, authorId: string, postId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await (supabase.from('post_comments') as any)
          .delete()
          .eq('id', commentId)
          .eq('author_id', authorId);
      } catch {
        // Fallback
      }
    }

    const all = getLocalComments();
    setLocalComments(all.filter((c) => c.id !== commentId));

    const posts = getLocalPosts();
    const idx = posts.findIndex((p) => p.id === postId);
    if (idx !== -1) {
      posts[idx].comments_count = Math.max(0, (posts[idx].comments_count || 1) - 1);
      setLocalPosts(posts);
    }
  },
};
