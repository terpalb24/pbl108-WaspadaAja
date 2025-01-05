import resident from "./report/resident";

export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);

	const accountId = session.account_id;
	const account = await data.account.get(accountId);

	const posts = await data.post.getAllByAccountId(accountId);

	for (let post of posts) {
		post.caption = util.format.post.shortenCaption(post.caption) + "...";
	}
	await data.post.format(posts);

	return c.html(util.render("posts", { posts }));
}