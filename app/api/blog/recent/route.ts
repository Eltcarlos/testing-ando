import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePresignedGetUrl } from "@/lib/s3";

export async function GET() {
  try {
    // Get the 3 most recent published blogs with approved review status
    const posts = await prisma.blog_posts.findMany({
      where: {
        status: "published",
        reviewStatus: "approved",
      },
      orderBy: {
        publishedAt: "desc", // Most recent first
      },
      take: 3,
    });

    // Get categories for the posts
    const categoryIds = [...new Set(posts.map(post => post.categoryId))];
    const categories = await prisma.categories.findMany({
      where: {
        id: { in: categoryIds },
      },
    });

    const categoryMap = Object.fromEntries(
      categories.map(cat => [cat.id, cat])
    );

    // Format posts with category information and generate public image URLs
    const formattedPosts = await Promise.all(posts.map(async post => {
      let featuredImageUrl = null;
      if (post.featuredImageKey) {
        try {
          featuredImageUrl = await generatePresignedGetUrl(post.featuredImageKey, 3600);
        } catch (error) {
          console.error(`Error generating URL for image ${post.featuredImageKey}:`, error);
        }
      }

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        topic: post.topic,
        category: categoryMap[post.categoryId] || null,
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
    }));

    return NextResponse.json({
      posts: formattedPosts,
    });
  } catch (error) {
    console.error("Error fetching recent blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent blog posts" },
      { status: 500 }
    );
  }
}
