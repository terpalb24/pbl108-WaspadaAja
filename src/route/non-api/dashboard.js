import resident from "../dashboard/resident";

export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);
	const reporterId = session.account_id;

	let filter = await c.req.parseBody();
	if (!filter.filter) {
		return c.html(util.error("Data tidak valid", "/dashboard"), 400);
	}

	if (!["newest", "oldest"].includes(filter.filter)) {
		return c.html(util.error("Data tidak valid", "/dashboard"), 400);
	}

	filter = filter.filter;
	const reports = await data.report.get.allByAccountId(reporterId, filter);
	await data.report.format(reports);



	const role = await data.account.getRole(session.account_id);
	if (!role) return c.html(util.error("Terdapat kesalahan pada server.", "/"));

	if (role === "RESIDENT") {
		const args = { reports, filter };
		return c.html(util.render("dashboard/resident", args));
	}
}