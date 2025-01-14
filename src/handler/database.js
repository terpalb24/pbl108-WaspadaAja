import mariadb from "mariadb";
import * as util from "./util";

let conn;


export const db = () => conn;

export const init = async() => {
	const pool = await mariadb.createPool({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		database: process.env.DB_NAME,
		connectionLimit: 5
	});

	conn = await pool.getConnection();

	conn.on("error", err => {
		console.error(err);
		process.exit(1);
	});

	console.log("Database berhasil terhubung. Connection id: " + conn.threadId);
	await checkTables();
}



export const account = {

	create: async({ accountId, fullName, phoneNumber, hashedPassword, role, address }) => {
		const query = `INSERT INTO accounts
			(account_id, full_name, phone_number, password, role, address)
			VALUES(?, ?, ?, ?, ?, ?);`;

		await conn.query(query, [
			accountId, fullName, phoneNumber, hashedPassword, role, address
		]);
	},

	delete: async(accountId) => {
		const query = "DELETE FROM accounts WHERE account_id = ?";
		await conn.query(query, [accountId]);
	},

	// find account data based on account id or phone number
	get: async(input) => {
		const cmd = "SELECT * FROM accounts WHERE account_id = ? OR phone_number = ?;";
		const result = await conn.query(cmd, [input, input]);
		return result[0];
	},

	getRole: async(accountId) => {
		const acc = await account.get(accountId);
		return acc?.role;
	},

	modify: async({ accountId, fullName, phoneNumber, hashedPassword, address }) => {
		const query = `UPDATE accounts
			SET full_name = ?,
			phone_number = ?,
			password = ?,
			address = ?
			WHERE account_id = ?;`;

		await conn.query(query, [
			fullName, phoneNumber, hashedPassword, address, accountId
		]);
	},

	getAllSecurities: async() => {
		const cmd = "SELECT * FROM accounts WHERE role = 'SECURITY';";
		const result = await conn.query(cmd);
		return result;
	}
}



export const session = {

	create: async(accountId, sessionId) => {
		const cmd = "INSERT INTO sessions(account_id, session_id) VALUES(?, ?);";
		await conn.query(cmd, [accountId, sessionId]);
	},

	get: async(sid) => {
		const cmd = "SELECT * FROM sessions WHERE session_id = ?;";
		const result = await conn.query(cmd, [sid]);
		return result[0];
	},

	delete: async(sessionId) => {
		const cmd = "DELETE FROM sessions WHERE session_id = ?";
		await conn.query(cmd, [sessionId]);
	},

	deleteAll: async(accountId) => {
		const cmd = "DELETE FROM sessions WHERE account_id = ?";
		await conn.query(cmd, [accountId]);
	}

}



export const report = {

	total: async() => {
		const cmd = "SELECT COUNT(*) AS total FROM reports;"
		const res = await conn.query(cmd);
		return res[0].total;
	},

	get: {

		all: async(page, filter) => {
			const limit = 9;

			if (!["newest", "oldest"].includes(filter)) filter = "newest";

			let cmd = "SELECT * FROM reports ";
			if (filter === "newest") {
				cmd += "ORDER BY created_at DESC";
			} else {
				cmd += "ORDER BY created_at ASC";
			}

			cmd += ` LIMIT 9 OFFSET ${(page - 1) * 9};`;

			const res = await conn.query(cmd);

			let nextPage = true;
			if (res.length < limit) nextPage = false;

			return { res, nextPage };
		},

		allByAccountId: async(accountId, order) => {
			if (!["newest", "oldest"].includes(order)) order = "newest";

			let cmd = "SELECT * FROM reports WHERE reporter_id = ? ";
			if (order === "newest") {
				cmd += "ORDER BY created_at DESC";
			} else {
				cmd += "ORDER BY created_at ASC";
			}

			cmd += " LIMIT 9;";

			const res = await conn.query(cmd, [accountId]);
			return res;
		},

		oneById: async(reportId) => {
			const cmd = "SELECT * FROM reports WHERE report_id = ?;";
			const res = await conn.query(cmd, [reportId]);
			return res[0];
		}

	},

	format: async(reports) => {
		for (let report of reports) {
			report.reporter = (await account.get(report.reporter_id))?.full_name ?? "Akun Terhapus";
			report.category = formatReportCategory(report.category);
			report.created_at = formatTime(report.created_at);
			report.status = util.format.reportStatus(report.status);
		}
	},

	create: async({ reportId, reporterId, category, title, description, address }) => {
		const query = `INSERT INTO reports(report_id, reporter_id, category, title, description, address, created_at, status)
		VALUES(?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, "OPEN");`;
		await conn.query(query, [reportId, reporterId, category, title, description, address]);
	},

	insertImage: async(reportId, fileName) => {
		const query = "INSERT INTO report_images(report_id, file_name) VALUES(?, ?);";
		await conn.query(query, [reportId, fileName])
	},

	getImages: async(reportId) => {
		const query = "SELECT file_name FROM report_images WHERE report_id = ?";
		const res = await conn.query(query, [reportId]);
		return res;
	},

	updateStatus: async(reportId, status) => {
		const query = "UPDATE reports SET status = ? WHERE report_id = ?";
		await conn.query(query, [status, reportId]);
	},

	delete: async(reportId) => {
		const query = "DELETE FROM reports WHERE report_id = ?";
		await conn.query(query, [reportId]);
	},

	deleteImages: async(reportId) => {
		const query = "DELETE FROM report_images WHERE report_id = ?";
		await conn.query(query, [reportId]);
	}
}



export const post = {

	getAll: async() => {
		const query = "SELECT * FROM posts ORDER BY created_at ASC LIMIT 20;";
		const res = await conn.query(query);
		return res;
	},

	getAllApproved: async() => {
		const query = "SELECT * FROM posts WHERE status = 'ACCEPTED' ORDER BY created_at ASC LIMIT 20;";
		const res = await conn.query(query);
		return res;
	},

	getAllByAccountId: async(accountId) => {
		const query = "SELECT * FROM posts WHERE author_id = ?;";
		const res = await conn.query(query, [accountId]);
		return res;
	},

	getOne: async(postId) => {
		const query = "SELECT * FROM posts WHERE post_id = ?;";
		const res = await conn.query(query, [postId]);
		return res[0];
	},

	format: async(posts) => {
		for (let post of posts) {
			post.author = (await account.get(post.author_id))?.full_name ?? "Akun Terhapus";
			post.caption = util.format.post.caption(post.caption);
			post.created_at = formatTime(post.created_at);
			post.status = util.format.post.status(post.status);
		}
	},

	create: async({ postId, authorId, title, caption }) => {
		const query = `INSERT INTO posts(post_id, author_id, title, caption, created_at, status)
		VALUES(?, ?, ?, ?, CURRENT_TIMESTAMP, "PENDING");`;
		await conn.query(query, [postId, authorId, title, caption]);
	},

	insertImage: async(postId, fileName) => {
		const query = "INSERT INTO post_images(post_id, file_name) VALUES(?, ?);";
		await conn.query(query, [postId, fileName])
	},

	getImages: async(postId) => {
		const query = "SELECT file_name FROM post_images WHERE post_id = ?";
		const res = await conn.query(query, [postId]);
		return res;
	},

	manage: {
		getAll: async(page) => {
			const limit = 9;

			let cmd = "SELECT * FROM posts ORDER BY created_at DESC";
			cmd += ` LIMIT 9 OFFSET ${(page - 1) * 9};`;

			const res = await conn.query(cmd);

			let nextPage = true;
			if (res.length < limit) nextPage = false;

			return { res, nextPage };
		}
	},

	delete: async(postId) => {
		const query = "DELETE FROM posts WHERE post_id = ?";
		await conn.query(query, [postId]);
	},

	deleteImages: async(postId) => {
		const query = "DELETE FROM post_images WHERE post_id = ?";
		await conn.query(query, [postId]);
	},

	setStatus: async(postId, status) => {
		const query = "UPDATE posts SET status = ? WHERE post_id = ?";
		await conn.query(query, [status, postId]);
	}
}



export const message = {

	insert: async(reportId, senderId, message) => {
		const query = `INSERT INTO messages(report_id, sender_id, message, sent_at)
		VALUES(?, ?, ?, CURRENT_TIMESTAMP);`;
		await conn.query(query, [reportId, senderId, message]);
	},

	getAll: async(reportId) => {
		const query = "SELECT * FROM messages WHERE report_id = ?";
		const res = await conn.query(query, [reportId]);
		return res;
	},

	format: async(messages) => {
		for (let msg of messages) {
			let acc = await account.get(msg.sender_id);
			msg.sender = acc?.full_name ?? "Akun Terhapus";
			msg.message = util.format.post.caption(msg.message);
			msg.sent_at = formatTime(msg.sent_at);
			msg.role = util.format.role(acc.role);
		}
	},

	delete: async(reportId) => {
		const query = "DELETE FROM messages WHERE report_id = ?";
		await conn.query(query, [reportId]);
	}

}








async function checkTables() {
	// cek tabel accounts
	let command = `CREATE TABLE IF NOT EXISTS accounts(
		account_id CHAR(8) NOT NULL PRIMARY KEY,
		full_name VARCHAR(48) NOT NULL,
		phone_number VARCHAR(13) NOT NULL,
		password VARCHAR(120) NOT NULL,
		role ENUM('RESIDENT', 'SECURITY', 'ADMIN') NOT NULL,
		address VARCHAR(128) NOT NULL
	) ENGINE = InnoDB;`;
	await conn.query(command);


	// cek tabel sessions
	command = `CREATE TABLE IF NOT EXISTS sessions(
		session_id CHAR(36) NOT NULL PRIMARY KEY,
		account_id CHAR(8) NOT NULL
	) ENGINE = InnoDB;`;
	await conn.query(command);


	// cek tabel reports
	command = `CREATE TABLE IF NOT EXISTS reports(
		report_id CHAR(10) NOT NULL PRIMARY KEY,
		reporter_id CHAR(8) NOT NULL,
		category ENUM('BURGLARY', 'DAMAGED_FACILITY', 'THEFT', 'FIRE', 'STREET_FIGHT', 'SUSPICIOUS_ACTIVITY', 'OTHER') NOT NULL,
		title VARCHAR(32) NOT NULL,
		description VARCHAR(2048) NOT NULL,
		address VARCHAR(128) NOT NULL,
		created_at TIMESTAMP NOT NULL,
		status ENUM('OPEN', 'PROCESS', 'RESOLVED') NOT NULL
	) ENGINE = InnoDB;`;
	await conn.query(command);


	// cek tabel report_images
	command = `CREATE TABLE IF NOT EXISTS report_images(
		report_id CHAR(10) NOT NULL,
		file_name CHAR(20) NOT NULL
	) ENGINE = InnoDB;`;
	await conn.query(command);


	// cek tabel messages
	command = `CREATE TABLE IF NOT EXISTS messages(
		report_id CHAR(10) NOT NULL,
		sender_id CHAR(8) NOT NULL,
		message VARCHAR(1024) NOT NULL,
		sent_at TIMESTAMP NOT NULL
	) ENGINE = InnoDB;`;
	await conn.query(command);


	// cek tabel posts
	command = `CREATE TABLE IF NOT EXISTS posts(
		post_id CHAR(12) NOT NULL PRIMARY KEY,
		author_id CHAR(8) NOT NULL,
		title VARCHAR(64) NOT NULL,
		caption VARCHAR(2048) NOT NULL,
		created_at TIMESTAMP NOT NULL,
		status ENUM('PENDING', 'ACCEPTED') NOT NULL
	) ENGINE = InnoDB;`;
	await conn.query(command);


	// cek tabel post_images
	command = `CREATE TABLE IF NOT EXISTS post_images(
		post_id CHAR(12) NOT NULL,
		file_name CHAR(20) NOT NULL
	) ENGINE = InnoDB;`;
	await conn.query(command);
}

function formatReportCategory(category) {
	let result = "";

	switch (category) {
	case "BURGLARY":
		result = "Kemalingan";
		break;
	case "DAMAGED_FACILITY":
		result = "Fasilitas Rusak";
		break;
	case "THEFT":
		result = "Pencurian";
		break;
	case "FIRE":
		result = "Kebakaran";
		break;
	case "STREET_FIGHT":
		result = "Tawuran";
		break;
	case "SUSPICIOUS_ACTIVITY":
		result = "Aktivitas Mencurigakan";
		break;
	case "OTHER":
		result = "Lainnya";
		break;
	}

	return result;
}

function formatTime(date) { // + 7
	date.setHours(date.getHours());
	const [hour, minute, day, month, year] = [
		date.getHours(),
		date.getMinutes(),
		date.getDate(),
		date.getMonth(),
		date.getFullYear()
	]
	return `${convertToTwoDigit(hour)}:${convertToTwoDigit(minute)} - ${day} ${formatMonth(month)} ${year}`
}

function convertToTwoDigit(hourOrMinute) {
	return hourOrMinute < 10 ? `0${hourOrMinute}` : hourOrMinute;
}

function formatMonth(month) {
	let result = "";
	switch (month) {
		case 0:
			result = "Januari"
			break;
		case 1:
			result = "Februari"
			break;
		case 2:
			result = "Maret"
			break;
		case 3:
			result = "April"
			break;
		case 4:
			result = "Mei"
			break;
		case 5:
			result = "Juni"
			break;
		case 6:
			result = "Juli"
			break;
		case 7:
			result = "Agustus"
			break;
		case 8:
			result = "September"
			break;
		case 9:
			result = "Oktober"
			break;
		case 10:
			result = "November"
			break;
		case 11:
			result = "Desember"
			break;
	}

	return result;
}
