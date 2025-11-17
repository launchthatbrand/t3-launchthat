import type { Post } from "@/src/store";
import { useEffect } from "react";
import { useSocialStore } from "@/src/store";
import { Loader2 } from "lucide-react";

import { Button } from "@acme/ui/button";

interface SocialFeedProps {
  groupId?: string;
  userId?: string;
  filterTags?: string[];
}

export function SocialFeedContainer({
  groupId,
  userId,
  filterTags,
}: SocialFeedProps) {
  // Get posts and loading state from store with proper typing
  const { posts, isLoadingPosts, postPagination } = useSocialStore((state) => ({
    posts: state.posts,
    isLoadingPosts: state.isLoadingPosts,
    postPagination: state.postPagination,
  }));

  // Get actions from store
  const { setPosts, addPosts, setIsLoadingPosts, setPostPagination } =
    useSocialStore();

  // Simulate loading posts on mount
  useEffect(() => {
    const loadPosts = () => {
      setIsLoadingPosts(true);

      try {
        // Here you would fetch posts from your API
        // For demonstration, we'll mock some data
        const mockPosts: Post[] = Array.from({ length: 5 }, (_, i) => ({
          _id: `post-${i + 1}`,
          authorId: `author-${(i % 3) + 1}`,
          content: `This is post ${i + 1} content`,
          createdAt: new Date().toISOString(),
          likes: Math.floor(Math.random() * 100),
          commentCount: Math.floor(Math.random() * 20),
          shareCount: Math.floor(Math.random() * 10),
          liked: Math.random() > 0.5,
        }));

        // Set posts in store
        setPosts(mockPosts);

        // Update pagination
        setPostPagination({
          cursor: "next-page-cursor",
          hasMore: true,
        });
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    loadPosts();
  }, [
    groupId,
    userId,
    filterTags,
    setPosts,
    setIsLoadingPosts,
    setPostPagination,
  ]);

  // Function to load more posts
  const handleLoadMore = () => {
    if (isLoadingPosts || !postPagination.hasMore) return;

    setIsLoadingPosts(true);

    try {
      // Here you would fetch more posts using the cursor
      // For demonstration, we'll mock some data
      const mockMorePosts: Post[] = Array.from({ length: 5 }, (_, i) => ({
        _id: `post-${posts.length + i + 1}`,
        authorId: `author-${((i + posts.length) % 3) + 1}`,
        content: `This is post ${posts.length + i + 1} content`,
        createdAt: new Date().toISOString(),
        likes: Math.floor(Math.random() * 100),
        commentCount: Math.floor(Math.random() * 20),
        shareCount: Math.floor(Math.random() * 10),
        liked: Math.random() > 0.5,
      }));

      // Add posts to store
      addPosts(mockMorePosts);

      // Update pagination
      setPostPagination({
        cursor: mockMorePosts.length < 5 ? null : "next-page-cursor",
        hasMore: mockMorePosts.length === 5,
      });
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Posts list */}
      {posts.length === 0 && !isLoadingPosts ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-lg font-medium">No posts yet</p>
          <p className="text-sm text-muted-foreground">
            Be the first to share something!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post._id} className="rounded-lg border p-4 shadow-sm">
              <p className="font-medium">Author ID: {post.authorId}</p>
              <p className="mt-2">{post.content}</p>
              <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>{post.likes} likes</span>
                <span>{post.commentCount} comments</span>
                <span>{post.shareCount} shares</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more button */}
      {postPagination.hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingPosts}
          >
            {isLoadingPosts ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
