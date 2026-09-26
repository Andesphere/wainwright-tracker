import { notFound } from "next/navigation";

import { BOOKS } from "@/lib/fells";
import { buildMetadata, getRouteSeo, JsonLd } from "@/lib/seo";
import { BookPage } from "@/marketing-pages/BookPage";

// Seven books; any other slug is a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return BOOKS.map((book) => ({ book: book.slug }));
}

type BookRouteProps = {
  params: Promise<{ book: string }>;
};

async function bookSeo({ params }: BookRouteProps) {
  const { book } = await params;
  return getRouteSeo(["fells", "books", book]);
}

export async function generateMetadata(props: BookRouteProps) {
  return buildMetadata(await bookSeo(props));
}

export default async function BookRoute(props: BookRouteProps) {
  const seo = await bookSeo(props);
  const { book } = seo;
  if (!book) notFound();
  return (
    <>
      <JsonLd seo={seo} />
      <BookPage seo={{ ...seo, book }} />
    </>
  );
}
