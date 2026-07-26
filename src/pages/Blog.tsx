import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/ios26/GlassCard';
import { blogPosts, formatBlogDate } from '../blog/posts';

const Blog = () => {
  return (
    <section id="blog" className="section">
      <div className="section-header">
        <h2 className="ios26-large-title">Blog</h2>
        <p className="ios26-subheadline">Product thinking on A2P SMS and market expansion</p>
      </div>

      <div className={`blog-grid${blogPosts.length === 1 ? ' blog-grid--single' : ''}`}>
        {blogPosts.map((post, index) => (
          <motion.div
            key={post.slug}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <Link to={`/blog/${post.slug}`} className="blog-card-link">
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
                    <span key={tag} className="project-tag">{tag}</span>
                  ))}
                </div>
                <span className="blog-card__read ios26-footnote">Read article →</span>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Blog;
