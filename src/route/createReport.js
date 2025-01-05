export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);
	const accountId = session.account_id;
	const account = await data.account.get(accountId);

	return c.html(util.render("createReport", { address: account.address }));
}