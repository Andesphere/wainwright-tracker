// BlogPostPage — the /blog/:slug detail page.
// Rich editorial layout using the same Slope design language as the rest of
// the marketing surface, with hero photography, tables, callouts and CTAs.

import Image from "next/image";
import { Link, Navigate, useParams } from "react-router-dom";

import { SlopeNav } from "@/components/marketing/SlopeNav";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import {
  type BlogBlock,
  formatBlogDate,
  getBlogPost,
} from "@/content/blog/posts";
import { trackBlogCtaClick } from "@/lib/analytics";

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

      <article className="post-article post-article-rich">
        <header className="post-header-rich">
          <Link to="/blog" className="post-back">
            ← Field Notes
          </Link>
          <div className="post-meta">
            <span>{post.category}</span>
            <span className="post-meta-bull" aria-hidden />
            <time dateTime={post.publishedAt}>
              {formatBlogDate(post.publishedAt)}
            </time>
            <span className="post-meta-bull" aria-hidden />
            <span>{post.readMinutes} min read</span>
          </div>
          <h1>{post.title}</h1>
          <p className="post-excerpt-big">{post.excerpt}</p>
          <div className="post-keywords" aria-label="Article topics">
            {post.keywords.slice(0, 4).map((keyword) => (
              <span key={keyword}>{keyword}</span>
            ))}
          </div>
        </header>

        <figure className="post-hero-media">
          <Image
            src={post.heroImage}
            alt={post.heroImageAlt}
            width={1200}
            height={670}
            priority
            sizes="(min-width: 1100px) 1040px, 100vw"
          />
        </figure>

        <div className="post-layout">
          <aside className="post-sidebar" aria-label="Article details">
            <span>Author</span>
            <strong>{post.author}</strong>
            <span>Filed under</span>
            <strong>{post.category}</strong>
          </aside>

          <div className="post-prose post-prose-rich">
            {post.body.map((block, index) => (
              <BlogBlockView
                block={block}
                key={`${block.type}-${index}`}
                slug={post.slug}
              />
            ))}
          </div>
        </div>
      </article>
    </SlopeShell>
  );
}

function BlogBlockView({ block, slug }: { block: BlogBlock; slug: string }) {
  if (block.type === "heading") {
    return <h2>{block.text}</h2>;
  }

  if (block.type === "paragraph") {
    return <p>{block.text}</p>;
  }

  if (block.type === "list") {
    return (
      <ul>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "table") {
    return (
      <figure className="post-table-wrap">
        {block.table.caption ? (
          <figcaption>{block.table.caption}</figcaption>
        ) : null}
        <div className="post-table-scroll">
          <table>
            <thead>
              <tr>
                {block.table.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.table.rows.map((row) => (
                <tr key={row.join("|")}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </figure>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote>
        <p>{block.text}</p>
        {block.cite ? <cite>{block.cite}</cite> : null}
      </blockquote>
    );
  }

  if (block.type === "image") {
    return (
      <figure className="post-inline-image">
        <Image
          src={block.src}
          alt={block.alt}
          width={1200}
          height={670}
          sizes="(min-width: 900px) 760px, 100vw"
        />
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <aside className="post-cta-box">
      <h2>{block.title}</h2>
      <p>{block.text}</p>
      <Link
        to={block.href}
        className="btn-pill btn-pill-light"
        onClick={() => trackBlogCtaClick(slug, block.label, block.href)}
      >
        {block.label}
        <i className="btn-arr" />
      </Link>
    </aside>
  );
}
