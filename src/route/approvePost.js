export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);

	const accountId = session.account_id;
	const account = await data.account.get(accountId);

	if (account.role === "RESIDENT") {
		return error("Kamu tidak bisa menghapus postingan.");
	}

	const postId = c.req.param("id");
	const post = await data.post.getOne(postId);

	if (!post) {
		return c.html(util.error("Postingan tidak ditemukan", "/dashboard"), 404);
	}

	await data.post.setStatus(postId, "ACCEPTED");
	return c.html( util.info(
		"Postingan Disetujui", "Berhasil menyetujui postingan untuk dipublikasi", "/manage-posts"
	) );
}

function error(util, c, errorMsg) {
	return c.html(util.error(errorMsg, "/dashboard"), 400);
}