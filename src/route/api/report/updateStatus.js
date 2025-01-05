const requiredFormData = ["report-id", "status"]
export default async(c, util, data, cookie) => {

	try {

		const loggedIn = await util.loggedIn(c);
		if (!loggedIn) return error(util, c, "Anda belum masuk akun.");

		const formData = await c.req.parseBody();
		if (!formData) return error(util, c, "Form data tidak valid.");

		const dataIsInvalid = util.dataIsInvalid(formData, requiredFormData);
		if (dataIsInvalid) return error(util, c, "Form data tidak valid.");

		const sessionId = await cookie.get(c);
		const session = await data.session.get(sessionId);
		const accountId = session.account_id;
		const account = await data.account.get(accountId);

		if (account.role === "RESIDENT") {
			return error(util, c, "Kamu tidak bisa mengubah status laporan.");
		}

		const reportId = formData["report-id"].trim(),
		status = formData["status"];
		if (!reportId || !status) return error(util, c, "Form data tidak valid.");

		const isReportIdValid = util.validate.reportTitle(reportId);
		if (!isReportIdValid) return error(util, c, "ID laporan tidak valid.");

		const isStatusValid = util.validate.reportStatus(status);
		if (!isStatusValid) return error(util, c, "Status laporan tidak valid.");

		const report = await data.report.get.oneById(reportId);
		if (!report) return error(util, c, "Laporan tidak ditemukan.");



		await data.report.updateStatus(reportId, status);
		return c.redirect(`/report/${reportId}`);

	} catch(err) {
		console.error(`${import.meta.file}\t${err.message}`);
		return error(util, c, "Terdapat kesalahan pada server.");
	}

}

function error(util, c, errorMsg) {
	return c.html(util.error(errorMsg, "/dashboard"), 400);
}