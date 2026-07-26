import React from 'react';
import type { BlogBlock } from '../../blog/types';

interface BlogPostContentProps {
  blocks: BlogBlock[];
}

export default function BlogPostContent({ blocks }: BlogPostContentProps) {
  return (
    <div className="blog-post-content">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={index} className="ios26-title3 blog-post-content__heading">
                {block.text}
              </h2>
            );
          case 'ul':
            return (
              <ul key={index} className="blog-post-content__list ios26-body">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          default:
            return (
              <p key={index} className="ios26-body blog-post-content__paragraph">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}
