export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);
	const accountId = session.account_id;

	const account = await data.account.get(accountId);

	const reportId = c.req.param("reportId");
	const report = await data.report.get.oneById(reportId);

	if (report.reporter_id !== accountId) {
		return c.html(
			util.error("Kamu tidak punya izin untuk melihat laporan ini", "/dashboard"),
			400
		);
	}

	await data.report.format([report]);

	const images = await data.report.getImages(reportId);
	const messages = await data.message.getAll(reportId);
	await data.message.format(messages);

	const args = { report, images, messages, viewerIsResident: true };

	return c.html(util.render("report/resident", args));
}