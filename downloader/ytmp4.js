import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const downloadYoutube = (url, outputDir) => {
	return new Promise((resolve, reject) => {
		const randomStr = Math.random().toString(36).substring(2, 8);
		const filename = `yt_${Date.now()}_${randomStr}.mp4`;
		const outputFile = path.join(outputDir, filename);
		
		const ytdlp = spawn('yt-dlp', [
			'-f', 'best[ext=mp4]/best',
			'--max-filesize', '2G',
			'-o', outputFile,
			'--no-playlist',
			'--no-warnings',
			'--quiet',
			url
		]);

		let errorOutput = '';

		ytdlp.stderr.on('data', (data) => {
			errorOutput += data.toString();
		});

		ytdlp.on('close', (code) => {
			if (code !== 0) {
				reject(new Error(errorOutput || 'Download gagal'));
				return;
			}

			if (fs.existsSync(outputFile)) {
				resolve(outputFile);
			} else {
				reject(new Error('File tidak ditemukan'));
			}
		});

		setTimeout(() => {
			ytdlp.kill();
			reject(new Error('Timeout - download terlalu lama'));
		}, 600000);
	});
};

export default {
	command: ["ytmp4", "yt"],
	description: "Download YouTube video max 2GB",
	category: "Download",
	owner: false,
	admin: false,
	hidden: false,
	limit: false,
	group: false,
	private: false,

	haruna: async function (m, { sock, text }) {
		if (!text) return m.reply("❓ Kasih link YouTube-nya bos.\n\nContoh: .ytmp4 https://youtube.com/watch?v=xxxxx");
		
		const youtubeRegex = /(youtube\.com|youtu\.be)/i;
		if (!youtubeRegex.test(text)) {
			return m.reply("❌ Link bukan YouTube bos.\n\nKhusus YouTube aja ya.");
		}

		m.react("⏳");

		const outputDir = path.join(process.cwd(), 'cache');
		
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		try {
			console.log('[YTMP4] Downloading:', text);
			const filePath = await downloadYoutube(text, outputDir);
			
			const stats = fs.statSync(filePath);
			const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

			console.log('[YTMP4] Sending:', filePath, `(${sizeMB} MB)`);

			// ✅ FIX: Kirim sebagai video playable (BUKAN DOKUMEN)
			// HAPUS fileName, HAPUS document, cuma pakai video + mimetype
			await sock.sendMessage(
				m.chat,
				{
					video: fs.readFileSync(filePath),
					mimetype: 'video/mp4',
					// ✅ HAPUS fileName - ini yang bikin jadi dokumen!
					caption: `✅ *YouTube Downloaded*\n\n📦 Size: ${sizeMB} MB\n🎥 Quality: Best available\n📹 ${path.basename(filePath)}`
				},
				{ quoted: m }
			);

			await m.react("✅");

			// Hapus file setelah 5 detik
			setTimeout(() => {
				try {
					if (fs.existsSync(filePath)) {
						fs.unlinkSync(filePath);
						console.log('[YTMP4] Deleted:', filePath);
					}
				} catch (e) {}
			}, 5000);

		} catch (error) {
			console.error('[YTMP4] Error:', error);
			await m.react("❌");
			
			let errMsg = error.message;
			if (errMsg.includes('max-filesize')) {
				errMsg = "Video terlalu besar (max 2GB)";
			} else if (errMsg.includes('Private video')) {
				errMsg = "Video private atau age restricted";
			} else if (errMsg.includes('Video unavailable')) {
				errMsg = "Video tidak ditemukan atau dihapus";
			}
			
			m.reply(`❌ Gagal download: ${errMsg}`);
		}
	},

	failed: "Failed: %error",
	wait: null,
	done: null,
};
