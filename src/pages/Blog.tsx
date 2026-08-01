import React from 'react';
import Button from '../components/ios26/Button';
import BlogCard from '../components/BlogCard';
import { trackEvent } from '../analytics/mixpanel';
import { FEATURED_BLOG_COUNT, blogPosts } from '../blog/posts';

const featuredPosts = blogPosts.slice(0, FEATURED_BLOG_COUNT);
const remainingCount = blogPosts.length - FEATURED_BLOG_COUNT;

const Blog = () => {
  return (
    <section id="blog" className="section">
      <div className="section-header">
        <h2 className="ios26-large-title">Blog</h2>
        <p className="ios26-subheadline">Product thinking, AI-assisted building, A2P SMS, and more</p>
      </div>

      <div className={`blog-grid${featuredPosts.length === 1 ? ' blog-grid--single' : ''}`}>
        {featuredPosts.map((post, index) => (
          <BlogCard key={post.slug} post={post} index={index} />
        ))}
      </div>

      {remainingCount > 0 && (
        <div className="blog-more">
          <Button
            variant="tinted"
            to="/blog"
            onClick={() => trackEvent('Blog More Click', { remaining: remainingCount })}
          >
            View all posts ({blogPosts.length})
          </Button>
        </div>
      )}
    </section>
  );
};

export default Blog;
