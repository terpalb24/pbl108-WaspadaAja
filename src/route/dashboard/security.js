export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);
	const accountId = session.account_id;

	const account = await data.account.get(accountId);
	const reports = await data.report.get.allByAccountId(accountId, "newest");
	await data.report.format(reports);

	const args = { reports, filter: "newest" };
	return c.html(util.render("dashboard/security", args));
}