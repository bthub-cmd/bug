import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const downloadYoutube = (url, outputDir) => {
	return new Promise((resolve, reject) => {
		const filename = `yt_${Date.now()}.mp4`;
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
		}, 600000); // 10 menit timeout
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
		if (!text) return m.reply("? Kasih link YouTube-nya bos.\n\nContoh: .ytmp4 https://youtube.com/watch?v=xxxxx");
		
		// Cek apakah link YouTube
		const youtubeRegex = /(youtube\.com|youtu\.be)/i;
		if (!youtubeRegex.test(text)) {
			return m.reply("? Link bukan YouTube bos.\n\nKhusus YouTube aja ya.");
		}

		m.react("?");

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

			// Kirim sebagai dokumen MP4
			await sock.sendMessage(
				m.chat,
				{
					document: fs.readFileSync(filePath),
					mimetype: 'video/mp4',
					fileName: `youtube_video_${Date.now()}.mp4`,
					caption: `? *YouTube Downloaded*\n\n?? Size: ${sizeMB} MB\n?? Quality: Best available`
				},
				{ quoted: m }
			);

			await m.react("?");

			// Hapus file setelah 5 menit (biar gak penuh storage)
			setTimeout(() => {
				try {
					fs.unlinkSync(filePath);
					console.log('[YTMP4] Deleted:', filePath);
				} catch (e) {}
			}, 300000);

		} catch (error) {
			console.error('[YTMP4] Error:', error);
			await m.react("?");
			
			let errMsg = error.message;
			if (errMsg.includes('max-filesize')) {
				errMsg = "Video terlalu besar (max 2GB)";
			} else if (errMsg.includes('Private video')) {
				errMsg = "Video private atau age restricted";
			} else if (errMsg.includes('Video unavailable')) {
				errMsg = "Video tidak ditemukan atau dihapus";
			}
			
			m.reply(`? Gagal download: ${errMsg}`);
		}
	},

	failed: "Failed: %error",
	wait: null,
	done: null,
};