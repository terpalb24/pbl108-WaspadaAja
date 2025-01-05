export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);

	const accountId = session.account_id;
	const account = await data.account.get(accountId);

	if (account.role === "RESIDENT") {
		return error("Kamu tidak bisa menghapus laporan.");
	}

	const reportId = c.req.param("id");
	const report = await data.report.get.oneById(reportId);

	if (!report) {
		return c.html(util.error("Laporan tidak ditemukan", "/dashboard"), 404);
	}

	const reportImages = await data.report.getImages(reportId);
	let imagesFileName = [];
	if (reportImages.length) {
		for(let image of reportImages) {
			imagesFileName.push(image.file_name);
		}

		await util.deleteImageFromStorage("reports", imagesFileName);
	}

	await data.report.delete(reportId);
	await data.report.deleteImages(reportId);
	await data.message.delete(reportId);
	return c.html( util.info("Laporan Terhapus", "Berhasil menghapus laporan", "/manage-reports") );
}

function error(util, c, errorMsg) {
	return c.html(util.error(errorMsg, "/dashboard"), 400);
}