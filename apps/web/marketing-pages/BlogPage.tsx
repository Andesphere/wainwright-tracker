// BlogPage — the /blog index.
// Same Slope design language as the landing, upgraded with editorial cards,
// thumbnails and richer metadata for SEO-led posts.

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

      {/* ── BANNER — editorial header for SEO field guides */}
      <header className="slope-banner slope-banner-rich">
        <p className="slope-banner-tag">— field notes and fell guides</p>
        <h1 className="slope-banner-h">
          Wainwright <em>Journal</em>
        </h1>
        <p className="slope-banner-lede">
          Practical guides for tracking, planning and remembering the long
          round: checklists, maps, notes, photos and slow Lake District days.
        </p>
      </header>

      {/* ── POST LIST — thumbnail cards with the same quality bar as Andy/Loki */}
      <ul className="post-list post-list-rich">
        {BLOG_POSTS.map((post) => (
          <li key={post.slug} className="post-card post-card-rich">
            <Link to={`/blog/${post.slug}`}>
              <img
                src={post.heroImage}
                alt={post.heroImageAlt}
                className="post-card-image"
                loading="lazy"
              />
              <div className="post-card-copy">
                <div className="post-meta">
                  <span>{post.category}</span>
                  <span className="post-meta-bull" aria-hidden />
                  <time dateTime={post.publishedAt}>
                    {formatBlogDate(post.publishedAt)}
                  </time>
                  <span className="post-meta-bull" aria-hidden />
                  <span>{post.readMinutes} min read</span>
                </div>
                <h2 className="post-title">{post.title}</h2>
                <p className="post-excerpt">{post.excerpt}</p>
                <div className="post-card-tags">
                  {post.keywords.slice(0, 3).map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </div>
                <span className="post-readmore">Read guide →</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </SlopeShell>
  );
}
