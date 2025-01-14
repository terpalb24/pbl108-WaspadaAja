import { Eta } from "eta";
import { join } from "node:path";
import { unlink } from "node:fs/promises";
import { randomUUID } from "crypto";
import ENUM from "./ENUM.json";
import * as cookie from "./cookie";
import * as data from "./database";

const etaPagesPath = join(import.meta.dir, "/../pages/eta");
const htmlPagesPath = join(import.meta.dir, "/../pages/html");
const eta = new Eta({ views: etaPagesPath });


export const render = (fileName, args) => {
	return eta.render(fileName, args);
}

export const html = async(fileName) => {
	const file = Bun.file(join(htmlPagesPath, `/${fileName}.html`));
	const text = await file.text();
	return text;
}

export const error = (errorMsg, back) => {
	return render("error", { errorMsg, back });
}

export const info = (pageTitle, infoMsg, back) => {
	return render("info", { pageTitle, infoMsg, back });
}

export const loggedIn = async(c) => {
	const sessionId = await cookie.get(c);
	if (!sessionId) return false;

	// if session is valid or registered on database
	const session = await data.session.get(sessionId);
	if (!session) {
		await cookie.destroy(c);
		return false;
	}

	// if the session id tied to a specific registered account
	const userExists = await data.account.get(session.account_id);
	if (!userExists) {
		await cookie.destroy(c);
		return false;
	}

	return true;
}

export const dataIsInvalid = (inputs, requiredInputs) => {
	// unnecesarry 	= input yang seharusnya tidak terkirim
	// missing 		= input yang dibutuhkan tapi tidak terkirim
	let unnecesarry = [], missing = [];
	const inputNames = Object.keys(inputs);

	unnecesarry = inputNames.filter(x => !requiredInputs.includes(x));
	missing = requiredInputs.filter(x => !inputNames.includes(x));

	return (unnecesarry.length || missing.length) ? true : false;
}

// return true: data valid
// return false: data tidak valid
export const validate = {
	fullName: (input) => {
		const [min, max] = [3, 48];
		const regex = /^[a-zA-Z-\s]+$/;

		return (input.length >= min && input.length <= max && regex.test(input));
	},

	phoneNumber: (input) => {
		const [min, max] = [10, 13];
		const regex = /^08\d+$/;

		return (input.length >= min && input.length <= max && regex.test(input));
	},

	password: (input) => {
		const [min, max] = [5, 32];
		return (input.length >= min && input.length <= max);
	},

	address: function(input) {
		const [min, max] = [8, 128];
		return (input.length >= min && input.length <= max);
	},


	reportTitle: function(input) {
		const [min, max] = [3, 64];
		return ( input.length >= min && input.length <= max );
	},

	category: function(input) {
		const statusList = ENUM.reportCategories;
		return statusList.includes(input);
	},

	reportDescription: function(input) {
		const [min, max] = [8, 2048];
		return ( input.length >= min && input.length <= max );
	},

	reportStatus: function(input) {
		const statusList = ENUM.reportStatuses;
		return statusList.includes(input);
	},

	message: function(input) {
		const [min, max] = [3, 2048];
		return ( input.length >= min && input.length <= max );
	}
}

export const generate = {
	randomStr: (e) => {
		// https://github.com/ai/nanoid/blob/main/nanoid.js
		// Copyright 2017 Andrey Sitnik <andrey@sitnik.ru>
		/* start */
		let a = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
		let t = "",
		r = crypto.getRandomValues(new Uint8Array(e));
		for(let n = 0; n < e; n++) {
			t += a[63&r[n]];
		};

		return t;
		/* end */
	},

	sessionId: () => randomUUID(),

	accountId: (e = 8) => {
		return generate.randomStr(e);
	},

	reportId: (e = 10) => {
		return generate.randomStr(e);
	},

	postId: (e = 12) => {
		return generate.randomStr(e);
	},

	fileName: (e = 13) => {
		return generate.randomStr(e);
	}
}

export const password = {

	hash: async(plainPassword) => {
		const settings = {
			algorithm: "argon2id",
			memoryCost: 65536,
			timeCost: 4
		};
		return await Bun.password.hash(plainPassword, settings);
	},

	verify: async(plainPassword, hashedPassword) => {
		return await Bun.password.verify(plainPassword, hashedPassword);
	}
}

export const insertImageToDatabase = async(conn, tableName, locationId, imagesName) => {
	if (!["report_images", "post_images"].includes(tableName)) return;

	const columnName = tableName === "report_images" ? "report_id" : "post_id" ;

	await data.images.put({ tableName, columnName, locationId, fileNames: imagesName });

	try {
		await conn.beginTransaction();

		for await (const image of imagesName) {
			await data.images.put({ tableName, columnName, locationId, fileNames: imagesName });
		}

		console.log(await conn.commit());
	} catch(err) {
		await conn.rollback();
		console.error(err);
		return c.html(error("Ada kesalahan pada server.", 500));
	} finally {
		console.log("inserted");
		conn.release();
	}
}

export const deleteImageFromStorage = async(folderName, fileNames) => {

	try {
		for (let fileName of fileNames) {
			await unlink(`./src/static/uploads/${folderName}/${fileName}`);
		}
	} catch(err) {
		console.error(err);
	}

};

export const saveImages = async({ tableName, images }) => {
	if (!["report_images", "post_images"].includes(tableName)) return;
	const location = tableName === "report_images" ? "reports" : "posts";

	let imageCount = 0, imagesName = [];
	const allowedTypes = ["image/png", "image/jpeg"];

	for(var i = 0; i < images.length; i++) {
		let image = images[i].file;

		if (!image.name) continue;
		if (!allowedTypes.includes(image.type)) {
			return { error: "Tidak boleh mengunggah diluar file gambar." };
		}

		if (image.size > 3e+6) {
			return { error: "Ukuran gambar terlalu besar." };
		}

		let extension;
		if (image.type === "image/png") extension = ".png";
		if (image.type === "image/jpeg") extension = ".jpeg";

		imageCount += 1;

		const fileName = `${imageCount}_${generate.fileName()}${extension}`;

		imagesName.push(fileName);
		await Bun.write(`./src/static/uploads/${location}/${fileName}`, image);
	}

	return { success: true, imagesName };
}

export const reportStatus = {
	formatted: (priority) => {
		let rawList = ENUM.reportStatuses;
		let result = [];

		const priorityIndex = ENUM.reportStatuses.indexOf(priority);
		rawList.splice(priorityIndex, 1);
		rawList.unshift(priority);

		for (let i = 0; i < rawList.length; i++) {
			result.push(format.reportStatus(rawList[i]));
		}

		return result;
	},

	convertToHTML: (statusList) => {
		let res = "";
		for (let status of statusList) {
			res += `<option value="${reportStatus.toENUM(status)}">${status}</option>`
		}

		return res;
	},

	toENUM: (input) => {
		switch (input) {
			case "Menunggu Konfirmasi":
				return "OPEN";
				break;
			case "Sedang Diproses":
				return "PROCESS";
				break;
			case "Terselesaikan":
				return "RESOLVED";
				break;
		}
	}
}

export const format = {
	reportStatus: (input) => {
		switch (input) {
			case "OPEN":
				return "Menunggu Konfirmasi";
				break;
			case "PROCESS":
				return "Sedang Diproses";
				break;
			case "RESOLVED":
				return "Terselesaikan";
				break;
			default:
				return "Unknown";
		}
	},

	role: (input) => {
		switch (input) {
			case "RESIDENT":
				return "Warga";
				break;
			case "ADMIN":
				return "Admin";
				break;
			case "SECURITY":
				return "Petugas";
				break;
			default:
				return "Unknown";
		}
	},

	post: {
		status: (status) => {
			return (status === "PENDING" ? "Menunggu Konfirmasi Admin" : "Disetujui");
		},

		caption: (caption) => {
			return caption.replace(/\n/g, "<br>");
		},

		shortenCaption: (caption) => {
			return caption.slice(0, 100);
		}
	}
}
