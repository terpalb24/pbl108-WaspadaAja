export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	let filter = c.req.query("filter") ?? "oldest";
	if (!["newest", "oldest"].includes(filter)) filter = "newest";

	let page = parseInt(c.req.param("page") ?? 1);
	if (isNaN(page)) page = 1;

	let result = await data.report.get.all(page, filter);
	const reports = result.res;
	if (reports) await data.report.format(reports);

	return c.html(util.render("manage-reports/manager", {
		filter,
		reports,
		page,
		nextPage: result.nextPage
	}));
}