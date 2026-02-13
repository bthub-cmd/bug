#!/usr/bin/env python3
import yt_dlp
import sys
import os
import time
import uuid  # ✅ FIX: Untuk generate unique ID

def download_youtube_video(url):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, '..', '..', 'cache')
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    # ✅ FIX: Generate unique filename dengan UUID + timestamp
    unique_id = f"{int(time.time())}_{uuid.uuid4().hex[:6]}"
    
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best',
        
        # ✅ FIX: Output dengan unique ID, bukan cuma video_id
        'outtmpl': os.path.join(output_dir, f'ytvid_{unique_id}_%(id)s.%(ext)s'),
        'paths': {
            'home': output_dir,
            'temp': output_dir,
        },
        
        'merge_output_format': 'mp4',
        'postprocessors': [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4',
        }],
        
        'format_sort': [
            'res:2160',
            'res:1440', 
            'res:1080',
            'fps',
            'vcodec:h264',
            'acodec:aac',
        ],
        
        'postprocessor_args': [
            '-c:v', 'copy',
            '-c:a', 'copy',
        ],
        
        'max_filesize': 2 * 1024 * 1024 * 1024,  # 2GB
        'quiet': False,
        'no_warnings': False,
        
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        'retries': 5,
        
        'prefer_free_formats': False,
        'no_check_certificate': False,
        'keepvideo': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print("Extracting video info...", file=sys.stderr)
            info = ydl.extract_info(url, download=False)
            if info is None:
                print("ERROR: Could not extract video info", file=sys.stderr)
                sys.exit(1)
            
            video_id = info.get('id', 'unknown')
            title = info.get('title', 'video')
            
            # Get available formats info
            formats = info.get('formats', [])
            if formats:
                best_format = formats[-1]
                print(f"Selected format: {best_format.get('format_note', 'N/A')} - {best_format.get('ext', 'N/A')}", file=sys.stderr)
                print(f"Resolution: {best_format.get('resolution', 'N/A')}", file=sys.stderr)
                print(f"Video codec: {best_format.get('vcodec', 'N/A')}", file=sys.stderr)
                print(f"Audio codec: {best_format.get('acodec', 'N/A')}", file=sys.stderr)
            
            print("Downloading...", file=sys.stderr)
            ydl.download([url])
            
            # ✅ FIX: Cari file dengan unique_id yang baru saja dibuat
            expected_prefix = f"ytvid_{unique_id}_"
            downloaded_file = None
            
            # Tunggu file muncul (max 30 detik)
            max_wait = 60
            waited = 0
            while waited < max_wait and not downloaded_file:
                files = os.listdir(output_dir)
                for f in files:
                    if f.startswith(expected_prefix) and f.endswith(('.mp4', '.mkv', '.webm')):
                        # ✅ FIX: Verifikasi file ini baru dibuat (dalam 1 menit terakhir)
                        file_path = os.path.join(output_dir, f)
                        file_stat = os.stat(file_path)
                        file_age = time.time() - file_stat.st_mtime
                        
                        if file_age < 60:  # File dibuat dalam 1 menit terakhir
                            downloaded_file = file_path
                            break
                
                if not downloaded_file:
                    time.sleep(0.5)
                    waited += 0.5
            
            if not downloaded_file:
                print(f"ERROR: Could not find downloaded file with prefix {expected_prefix}", file=sys.stderr)
                sys.exit(1)
            
            # Get file size
            file_size = os.path.getsize(downloaded_file)
            size_mb = file_size / 1024 / 1024
            print(f"Download complete! Size: {size_mb:.2f} MB", file=sys.stderr)
            print(f"File saved to: {downloaded_file}", file=sys.stderr)
            
            # ✅ FIX: Output format VIDEO (bukan DOCUMENT)
            print(f"VIDEO:{downloaded_file}:{title}:{unique_id}")
                
    except Exception as e:
        error_str = str(e).lower()
        if 'private' in error_str or 'unavailable' in error_str:
            print("ERROR: private", file=sys.stderr)
        elif 'copyright' in error_str:
            print("ERROR: copyright", file=sys.stderr)
        elif 'age' in error_str or 'restricted' in error_str:
            print("ERROR: age restricted", file=sys.stderr)
        elif 'filesize' in error_str:
            print("ERROR: File too large (max 2GB)", file=sys.stderr)
        else:
            print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("ERROR: URL required", file=sys.stderr)
        sys.exit(1)
    
    url = sys.argv[1]
    download_youtube_video(url)
