export default async(c, util, data) => {
	const loggedIn = await util.loggedIn(c);
	const posts = await data.post.getAllApproved();

	if (posts.length) {
		for (let post of posts) {
			post.caption = util.format.post.shortenCaption(post.caption) + "...";
		}

		await data.post.format(posts);
	}

	return c.html(util.render("bulletin", { loggedIn, posts }));
}