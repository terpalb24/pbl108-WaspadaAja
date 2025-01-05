export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);

	const accountId = session.account_id;
	const account = await data.account.get(accountId);

	const postId = c.req.param("id");
	const post = await data.post.getOne(postId);

	if (!post) {
		return c.html(util.error("Postingan tidak ditemukan", "/bulletin"), 404);
	}

	await data.post.format([post]);

	const images = await data.post.getImages(postId);
	const args = { post, images };

	return c.html(util.render("view-post/admin", args));
}