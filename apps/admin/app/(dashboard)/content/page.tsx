import { getBlogPosts } from "./actions"
import { BlogPostsTable } from "./blog-posts-table"

export default async function ContentPage() {
	const posts = await getBlogPosts()

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<BlogPostsTable posts={posts} />
		</div>
	)
}
