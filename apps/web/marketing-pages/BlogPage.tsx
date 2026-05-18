// BlogPage — the /blog index.
// Same Slope design language as the landing: paper background, pine
// display type, monochromatic green accents. The nav uses the "solid"
// variant because this page has no hero image behind it.

import { Link } from "react-router-dom";

import { SlopeNav } from "@/components/marketing/SlopeNav";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import { BLOG_POSTS, formatBlogDate } from "@/content/blog/posts";

type BlogPageProps = {
  signedIn?: boolean;
};

export function BlogPage({ signedIn = false }: BlogPageProps) {
  return (
    <SlopeShell signedIn={signedIn}>
      <SlopeNav signedIn={signedIn} variant="solid" />

      {/* ── BANNER — small editorial header instead of a hero image */}
      <header className="slope-banner">
        <p className="slope-banner-tag">— journal notes</p>
        <h1 className="slope-banner-h">
          Field <em>Notes</em>
        </h1>
        <p className="slope-banner-lede">
          Quiet dispatches from the long Wainwright round — updates from the
          tracker, stories from the dales, and the occasional walking note.
        </p>
      </header>

      {/* ── POST LIST — each card is a full-width clickable block */}
      <ul className="post-list">
        {BLOG_POSTS.map((post) => (
          <li key={post.slug} className="post-card">
            <Link to={`/blog/${post.slug}`}>
              <div className="post-meta">
                <time dateTime={post.publishedAt}>
                  {formatBlogDate(post.publishedAt)}
                </time>
                <span className="post-meta-bull" aria-hidden />
                <span>{post.readMinutes} min read</span>
              </div>
              <h2 className="post-title">{post.title}</h2>
              <p className="post-excerpt">{post.excerpt}</p>
              <span className="post-readmore">Read note →</span>
            </Link>
          </li>
        ))}
      </ul>
    </SlopeShell>
  );
}
