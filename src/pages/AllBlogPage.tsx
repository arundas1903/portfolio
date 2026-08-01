import React from 'react';
import SubpageNav from '../components/ios26/SubpageNav';
import BlogCard from '../components/BlogCard';
import { blogPosts } from '../blog/posts';

export default function AllBlogPage() {
  return (
    <div className="blog-index-page">
      <div className="blog-index-page__background" aria-hidden />

      <div className="blog-index-page__inner">
        <SubpageNav to="/#blog" label="Blog" />

        <header className="blog-index-page__header">
          <h1 className="ios26-large-title ios26-large-title--emphasized">All posts</h1>
          <p className="ios26-subheadline blog-index-page__lead">
            Product thinking, AI-assisted building, A2P SMS, and more.
          </p>
        </header>

        <div className={`blog-grid${blogPosts.length === 1 ? ' blog-grid--single' : ''}`}>
          {blogPosts.map((post, index) => (
            <BlogCard key={post.slug} post={post} index={index} animate={false} />
          ))}
        </div>
      </div>
    </div>
  );
}
