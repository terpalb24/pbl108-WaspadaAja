const requiredFormData = [
	"title", "category", "description", "address",
	"image-1", "image-2", "image-3"
];

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
		const reporterId = session.account_id;



		const title = formData["title"].trim(),
		category = formData["category"].trim(),
		description = formData["description"].trim(),
		address = formData["address"].trim();

		if (!title || !category || !description || !address) {
			return error(util, c, "Form data tidak valid.");
		}

		const images = [
			{ id: 1, file: formData["image-1"] },
			{ id: 2, file: formData["image-2"] },
			{ id: 3, file: formData["image-3"] }
		];



		const result = await util.saveImages({
			tableName: "report_images", images
		});

		let reportId;
		if (result.error) {
			return error(util, c, result.error);
		} else if (result.success) {

			reportId = await util.generate.reportId();

			// input data gambar ke database
			for await (let imageName of result.imagesName) {
				await data.report.insertImage(reportId, imageName);
			}

		}

		// input data laporan ke database
		await data.report.create({
			reportId, reporterId, category, title, description, address
		});


		return c.redirect(`/report/${reportId}`);
	} catch(err) {
		console.error(`${import.meta.file}\t${err.message}`);
		return error(util, c, "Terdapat kesalahan pada server.");
	}
}

function error(util, c, errorMsg) {
	return c.html(util.error(errorMsg, "/create-report"), 400);
}