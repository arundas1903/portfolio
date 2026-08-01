import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from './ios26/GlassCard';
import { trackEvent } from '../analytics/mixpanel';
import { formatBlogDate } from '../blog/posts';
import type { BlogPost } from '../blog/types';

interface BlogCardProps {
  post: BlogPost;
  index?: number;
  animate?: boolean;
}

export default function BlogCard({ post, index = 0, animate = true }: BlogCardProps) {
  const card = (
    <Link
      to={`/blog/${post.slug}`}
      className="blog-card-link"
      onClick={() =>
        trackEvent('Blog Post Click', {
          slug: post.slug,
          title: post.title,
        })
      }
    >
      <GlassCard size="la" className="blog-card">
        <div
          className="blog-card__accent"
          style={{ background: `linear-gradient(90deg, ${post.accent}, transparent)` }}
          aria-hidden
        />
        <div className="blog-card__meta ios26-caption2">
          <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span>{post.readTime}</span>
        </div>
        <h3 className="ios26-title3 blog-card__title">{post.title}</h3>
        <p className="ios26-footnote blog-card__excerpt">{post.excerpt}</p>
        <div className="blog-card__tags">
          {post.tags.map((tag) => (
            <span key={tag} className="project-tag">
              {tag}
            </span>
          ))}
        </div>
        <span className="blog-card__read ios26-footnote">Read article →</span>
      </GlassCard>
    </Link>
  );

  if (!animate) {
    return card;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      {card}
    </motion.div>
  );
}
