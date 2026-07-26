import React from 'react';
import { useParams } from 'react-router-dom';
import BlogPostContent from '../components/blog/BlogPostContent';
import Button from '../components/ios26/Button';
import SubpageNav from '../components/ios26/SubpageNav';
import { formatBlogDate, getPostBySlug } from '../blog/posts';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) {
    return (
      <div className="blog-page">
        <div className="blog-page-background" aria-hidden />
        <div className="blog-page-inner">
          <SubpageNav to="/" label="Portfolio" />
          <h1 className="ios26-large-title">Post not found</h1>
          <p className="ios26-body" style={{ color: 'var(--color-label-secondary)' }}>
            This article doesn&apos;t exist or may have been moved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page">
      <div className="blog-page-background" aria-hidden />

      <article className="blog-page-inner">
        <SubpageNav to="/" label="Portfolio" />

        <header className="blog-article-header ios26-liquid-glass-la glass-surface">
          <div className="blog-article-header__meta ios26-caption2">
            <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
            <span aria-hidden>·</span>
            <span>{post.readTime}</span>
          </div>
          <h1 className="ios26-large-title ios26-large-title--emphasized">{post.title}</h1>
          <div className="blog-card__tags">
            {post.tags.map((tag) => (
              <span key={tag} className="project-tag">{tag}</span>
            ))}
          </div>
        </header>

        <div className="blog-article-body ios26-liquid-glass-me glass-surface">
          <BlogPostContent blocks={post.content} />
        </div>

        {post.liveDemo && (
          <div className="blog-article-cta ios26-liquid-glass-me glass-surface">
            <p className="ios26-headline" style={{ margin: '0 0 6px' }}>Explore the map</p>
            <p className="ios26-footnote" style={{ margin: '0 0 16px', color: 'var(--color-label-secondary)' }}>
              See A2P SMS origination support by country across alphanumeric, short code, long code, and toll-free channels.
            </p>
            <Button variant="filled" to={post.liveDemo}>
              Open A2P Atlas
            </Button>
          </div>
        )}
      </article>
    </div>
  );
}
