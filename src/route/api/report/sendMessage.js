const requiredFormData = ["report-id", "message"]
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
		const senderId = session.account_id;
		const sender = await data.account.get(senderId);

		const reportId = formData["report-id"].trim(),
		message = formData["message"];
		if (!reportId || !message) return error(util, c, "Form data tidak valid.");

		const isReportIdValid = util.validate.reportTitle(reportId);
		if (!isReportIdValid) return error(util, c, "ID laporan tidak valid.");

		const isMessageValid = util.validate.message(message);
		if (!isMessageValid) return error(util, c, "Pesan tidak valid.");

		const report = await data.report.get.oneById(reportId);
		if (!report) return error(util, c, "Laporan tidak ditemukan.");

		if (sender.role === "RESIDENT" && senderId !== report.reporter_id) {
			return error(util, c, "Kamu tidak bisa membalas pesan pada laporan ini.");
		}


		await data.message.insert(reportId, senderId, message);
		return c.redirect(`/report/${reportId}`);

	} catch(err) {
		console.error(`${import.meta.file}\t${err.message}`);
		return error(util, c, "Terdapat kesalahan pada server.");
	}

}

function error(util, c, errorMsg) {
	return c.html(util.error(errorMsg, "/dashboard"), 400);
}