export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);

	const role = await data.account.getRole(session.account_id);
	if (!role) return c.html(util.error("Terdapat kesalahan pada server.", "/"));

	if (role !== "ADMIN") {
		return c.redirect("/dashboard");
	}

	let accId = c.req.param("id");
	const accInfo = await data.account.get(accId);
	if (!accId) {
		return c.redirect("/dashboard");
	}

	return c.html( util.render("view-security-acc", { account: accInfo }) );
}