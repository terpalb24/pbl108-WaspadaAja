export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);

	const role = await data.account.getRole(session.account_id);
	if (!role) return c.html(util.error("Terdapat kesalahan pada server.", "/"));

	if (role !== "ADMIN") {
		return c.html(u6til.error("Kamu tidak bisa melihat halaman ini.", "/"));
	}

	let accounts = await data.account.getAllSecurities();

	return c.html(util.render("manage-security", {
		accounts
	}));
}