// BlogPostPage — the /blog/:slug detail page.
// Editorial single-column layout. Same shared shell as the rest of the
// marketing surface, with the "solid" nav variant on top.

import { Link, Navigate, useParams } from "react-router-dom";

import { SlopeNav } from "@/components/marketing/SlopeNav";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import { formatBlogDate, getBlogPost } from "@/content/blog/posts";

type BlogPostPageProps = {
  signedIn?: boolean;
};

export function BlogPostPage({ signedIn = false }: BlogPostPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  // No matching post → bounce back to the blog index. Avoids 404 noise.
  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <SlopeShell signedIn={signedIn}>
      <SlopeNav signedIn={signedIn} variant="solid" />

      <article className="post-article">
        <header>
          {/* Back link sits above the headline like a small editorial folio */}
          <Link to="/blog" className="post-back">
            ← Field Notes
          </Link>
          <div className="post-meta">
            <time dateTime={post.publishedAt}>
              {formatBlogDate(post.publishedAt)}
            </time>
            <span className="post-meta-bull" aria-hidden />
            <span>{post.readMinutes} min read</span>
          </div>
          <h1>{post.title}</h1>
          <p className="post-excerpt-big">{post.excerpt}</p>
        </header>

        {/* Prose body — first paragraph gets a drop-cap via CSS */}
        <div className="post-prose">
          {post.body.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
      </article>
    </SlopeShell>
  );
}
