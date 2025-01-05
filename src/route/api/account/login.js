const requiredFormData = [
	"phone-number", "password"
];

export default async(c, util, data, cookie) => {
	try {

		const loggedIn = await util.loggedIn(c);
		if (loggedIn) return c.json({ error: "Anda sudah masuk akun." }, 400);

		const formData = await c.req.parseBody();
		if (!formData) return c.json({ error: "Form data tidak valid." }, 400);

		const dataIsInvalid = util.dataIsInvalid(formData, requiredFormData);
		if (dataIsInvalid) return c.json({ error: "Form data tidak valid." }, 400);



		const phoneNumber = formData["phone-number"].trim(),
		password = formData["password"].trim();

		const isPhoneNumberValid = util.validate.phoneNumber(phoneNumber);
		if (!isPhoneNumberValid) return error(util, c, "Nomor WhatsApp tidak valid.");

		const isPasswordValid = util.validate.password(password);
		if (!isPasswordValid) return error(util, c, "Kata sandi tidak valid.");

		const account = await data.account.get(phoneNumber);
		if (!account) {
			return error(util, c, "Tidak ada akun yang terdaftar dengan nomor WhatsApp tersebut.");
		}

		const hashedPassword = account.password;
		const passwordCorrect = await util.password.verify(password, hashedPassword);
		if (!passwordCorrect) return error(util, c, "Kata sandi salah.");


		const sessionId = util.generate.sessionId();
		await data.session.create(account.account_id, sessionId);
		await cookie.set(c, sessionId);

		return c.redirect("/dashboard");

	} catch(err) {
		console.error(`${import.meta.file}\t${err.message}`);
		return c.html(util.error("Terdapat kesalahan pada server."), 500);
	}
}

function error(util, c, errorMsg) {
	return c.html(util.error(errorMsg, "/login"), 400);
}