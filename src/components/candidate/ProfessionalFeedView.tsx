import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { feedService } from '../../services/feedService';
import { privacySettingsService } from '../../services/privacySettingsService';
import { FeedPost, PostComment, PostType } from '../../types/database';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import {
  Heart,
  MessageSquare,
  Share2,
  Send,
  Sparkles,
  Link2,
  Image,
  Award,
  Hammer,
  Flag,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  ExternalLink,
  Code,
  Flame,
  Filter,
} from 'lucide-react';

interface ProfessionalFeedViewProps {
  onNavigateToProfile?: () => void;
  onNavigateToBuildLab?: () => void;
  onNavigateToNetwork?: () => void;
}

export const ProfessionalFeedView: React.FC<ProfessionalFeedViewProps> = ({
  onNavigateToProfile,
  onNavigateToBuildLab,
  onNavigateToNetwork,
}) => {
  const { user, profile } = useAuth();
  const currentUserId = user?.id || 'demo-candidate';

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'project_update' | 'achievement' | 'milestone' | 'my_posts'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // New post composer state
  const [postContent, setPostContent] = useState('');
  const [selectedPostType, setSelectedPostType] = useState<PostType>('general');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showAttachInputs, setShowAttachInputs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active comments drawer
  const [expandedPostComments, setExpandedPostComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, PostComment[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Notification / toast feedback
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadFeed();
  }, [user]);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const data = await feedService.getPosts(currentUserId);
      setPosts(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setIsSubmitting(true);
    try {
      const authorProfile = {
        display_name: profile?.display_name || user?.email?.split('@')[0] || 'Candidate',
        headline: profile?.headline || 'Software Systems Engineer',
        avatar_path: profile?.avatar_path || null,
        location: profile?.location || null,
      };

      const created = await feedService.createPost(
        currentUserId,
        postContent.trim(),
        selectedPostType,
        imageUrl.trim() || null,
        linkUrl.trim() || null,
        authorProfile
      );

      setPosts((prev) => [created, ...prev]);
      setPostContent('');
      setImageUrl('');
      setLinkUrl('');
      setShowAttachInputs(false);
      setSelectedPostType('general');

      setFeedback({ message: 'Post published to professional network.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ message: 'Failed to publish post.', type: 'error' });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const result = await feedService.toggleReaction(postId, currentUserId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, has_liked: result.hasLiked, likes_count: result.count } : p
        )
      );
    } catch (err) {
      console.warn('Like toggle error:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await feedService.deletePost(postId, currentUserId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setFeedback({ message: 'Post deleted.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ message: 'Could not delete post.', type: 'error' });
    }
  };

  const toggleComments = async (postId: string) => {
    const isExpanded = expandedPostComments[postId];
    setExpandedPostComments((prev) => ({ ...prev, [postId]: !isExpanded }));

    if (!isExpanded && !commentsMap[postId]) {
      const comments = await feedService.getComments(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: comments }));
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = newCommentText[postId]?.trim();
    if (!text) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const authorProfile = {
        display_name: profile?.display_name || user?.email?.split('@')[0] || 'You',
        headline: profile?.headline || 'Candidate',
        avatar_path: profile?.avatar_path || null,
      };

      const comment = await feedService.createComment(postId, currentUserId, text, authorProfile);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment],
      }));
      setNewCommentText((prev) => ({ ...prev, [postId]: '' }));

      // Increment count on post card
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
      );
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleShareLink = (post: FeedPost) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/#post-${post.id}`);
      setFeedback({ message: 'Post link copied to clipboard.', type: 'success' });
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleReportPost = async (post: FeedPost) => {
    const reason = prompt('Please specify the reason for reporting this post:');
    if (!reason) return;
    await privacySettingsService.reportContent(currentUserId, post.author_id, reason);
    setFeedback({ message: 'Report submitted for review.', type: 'success' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  const filteredPosts = posts.filter((p) => {
    if (filterType === 'all') return true;
    if (filterType === 'my_posts') return p.author_id === currentUserId;
    return p.post_type === filterType;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div
          role="status"
          className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Main Grid: Feed Stream + Right Insights Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Composer & Posts */}
        <div className="lg:col-span-2 space-y-5">
          {/* Post Creation Composer */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="flex items-start gap-3.5">
              <Avatar
                name={profile?.display_name || user?.email || 'You'}
                src={profile?.avatar_path || undefined}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share an engineering milestone, verified project update, or technical architecture learning..."
                    rows={3}
                    className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none transition-colors"
                  />

                  {/* Optional Attachments Inputs */}
                  {showAttachInputs && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Image URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Project Link / GitHub Repo (Optional)
                        </label>
                        <input
                          type="url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://github.com/org/repo"
                          className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Composer Controls & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                    {/* Post Type Selector (Segmented buttons) */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setSelectedPostType('general')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          selectedPostType === 'general'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        General
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPostType('project_update')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          selectedPostType === 'project_update'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Project Proof
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPostType('achievement')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          selectedPostType === 'achievement'
                            ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Achievement
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPostType('milestone')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          selectedPostType === 'milestone'
                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Milestone
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAttachInputs(!showAttachInputs)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Add image or project link"
                      >
                        <Image className="w-4 h-4" />
                      </button>

                      <Button
                        type="submit"
                        size="sm"
                        variant="primary"
                        disabled={!postContent.trim() || isSubmitting}
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                      >
                        {isSubmitting ? 'Posting...' : 'Publish'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All Community
              </button>
              <button
                onClick={() => setFilterType('project_update')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'project_update'
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Project Proofs
              </button>
              <button
                onClick={() => setFilterType('achievement')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'achievement'
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Achievements
              </button>
              <button
                onClick={() => setFilterType('milestone')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'milestone'
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Career Milestones
              </button>
              <button
                onClick={() => setFilterType('my_posts')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'my_posts'
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                My Posts
              </button>
            </div>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              {filteredPosts.length} posts
            </span>
          </div>

          {/* Posts Stream */}
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-mono animate-pulse">
              Syncing verified feed from PostgreSQL...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
              <Code className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No posts in this stream</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Be the first to share an engineering milestone or project proof with your network.
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isAuthor = post.author_id === currentUserId;
              const isExpanded = expandedPostComments[post.id];
              const comments = commentsMap[post.id] || [];

              return (
                <article
                  key={post.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4 transition-colors"
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={post.author_profile?.display_name || 'Engineer'}
                        src={post.author_profile?.avatar_path || undefined}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white hover:underline cursor-pointer">
                            {post.author_profile?.display_name || 'Anonymous Engineer'}
                          </h4>
                          {post.post_type === 'project_update' && (
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                              · Project Proof
                            </span>
                          )}
                          {post.post_type === 'achievement' && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                              · Achievement
                            </span>
                          )}
                          {post.post_type === 'milestone' && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                              · Milestone
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm">
                          {post.author_profile?.headline || 'Candidate Software Engineer'}
                        </p>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{formatTimeAgo(post.created_at)}</span>
                          {post.author_profile?.location && (
                            <>
                              <span>·</span>
                              <span>{post.author_profile.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isAuthor ? (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReportPost(post)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
                          title="Report post"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Post Attachments */}
                  {post.image_url && (
                    <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 max-h-80 bg-slate-100 dark:bg-slate-800">
                      <img
                        src={post.image_url}
                        alt="Post media"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {post.link_url && (
                    <a
                      href={post.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-indigo-600 dark:text-indigo-400 hover:underline group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Link2 className="w-4 h-4 shrink-0 text-slate-400" />
                        <span className="truncate">{post.link_url}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                    </a>
                  )}

                  {/* Interaction Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className={`flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                          post.has_liked
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${post.has_liked ? 'fill-current text-rose-600' : ''}`}
                        />
                        <span>{post.likes_count}</span>
                      </button>

                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1.5 font-medium hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments_count}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleShareLink(post)}
                      className="flex items-center gap-1.5 font-medium hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* Comments Drawer */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      {/* Comment Input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCommentText[post.id] || ''}
                          onChange={(e) =>
                            setNewCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                          placeholder="Write a constructive engineering comment..."
                          className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={!newCommentText[post.id]?.trim() || submittingComment[post.id]}
                          onClick={() => handleAddComment(post.id)}
                        >
                          Comment
                        </Button>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-2.5 pt-1">
                        {comments.length === 0 ? (
                          <div className="text-[11px] text-slate-400 py-1 font-mono">
                            No comments yet. Start the conversation.
                          </div>
                        ) : (
                          comments.map((c) => (
                            <div
                              key={c.id}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {c.author_profile?.display_name || 'Peer'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {formatTimeAgo(c.created_at)}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                {c.content}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Right 1 Col: Candidate Mini-Card & Insights */}
        <div className="space-y-5">
          {/* Candidate Profile Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4 transition-colors">
            <div className="text-center space-y-2">
              <Avatar
                name={profile?.display_name || user?.email || 'Candidate'}
                src={profile?.avatar_path || undefined}
                size="lg"
                className="mx-auto"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {profile?.display_name || 'Alex Vance'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {profile?.headline || 'Senior Distributed Systems Engineer'}
                </p>
                <div className="text-[11px] text-slate-400 mt-1">
                  {profile?.location || 'San Francisco, CA'}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-center text-xs">
              <div>
                <div className="font-bold text-slate-900 dark:text-white font-mono">
                  {posts.filter((p) => p.author_id === currentUserId).length}
                </div>
                <div className="text-[10px] text-slate-500">Posts</div>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {profile?.phone_verified ? 'Verified' : 'Pending'}
                </div>
                <div className="text-[10px] text-slate-500">Candidate Proof</div>
              </div>
            </div>

            {onNavigateToProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToProfile}
                className="w-full justify-center"
              >
                View Full Profile
              </Button>
            )}
          </div>

          {/* Quick Ecosystem Shortcuts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3 transition-colors">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Engineering Proof Hubs
            </h4>
            <div className="space-y-2 text-xs">
              {onNavigateToBuildLab && (
                <button
                  onClick={onNavigateToBuildLab}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Hammer className="w-4 h-4 text-indigo-500" />
                    <span>Run BuildLab Test Suite</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Docker</span>
                </button>
              )}

              {onNavigateToNetwork && (
                <button
                  onClick={onNavigateToNetwork}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    <span>Discover Peer Engineers</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Network</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
