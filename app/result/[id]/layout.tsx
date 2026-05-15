import { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "My Elite Magazine Cover | CoverStar AI",
    description: "Check out my custom magazine cover created with CoverStar AI. High-fidelity editorial styling and identity preservation.",
    openGraph: {
      title: "My Elite Magazine Cover | CoverStar AI",
      description: "Check out my custom magazine cover created with CoverStar AI.",
      type: "website",
      images: [
        {
          url: "https://picsum.photos/seed/magazine/1200/630",
          width: 1200,
          height: 630,
          alt: "Magazine Cover Preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "My Elite Magazine Cover | CoverStar AI",
      description: "Check out my custom magazine cover created with CoverStar AI.",
      images: ["https://picsum.photos/seed/magazine/1200/630"],
    },
  };
}

export default function ResultLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  return <>{children}</>;
}
