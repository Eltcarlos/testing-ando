import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePresignedGetUrl } from "@/lib/s3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find the blog post by slug
    const post = await prisma.blog_posts.findFirst({
      where: {
        slug,
        status: "published",
        reviewStatus: "approved",
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Get the category information
    const category = await prisma.categories.findUnique({
      where: { id: post.categoryId },
    });

    // Generate public image URL
    let featuredImageUrl = null;
    if (post.featuredImageKey) {
      try {
        featuredImageUrl = await generatePresignedGetUrl(post.featuredImageKey, 3600);
      } catch (error) {
        console.error(`Error generating URL for image ${post.featuredImageKey}:`, error);
      }
    }

    // Format the post with category information
    const formattedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      topic: post.topic,
      category: category || null,
      source: post.source,
      editorialTeamType: post.editorialTeamType,
      authorName: post.authorName,
      authorPosition: post.authorPosition,
      featuredImageKey: post.featuredImageKey,
      featuredImageUrl,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };

    return NextResponse.json({
      post: formattedPost,
    });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}
