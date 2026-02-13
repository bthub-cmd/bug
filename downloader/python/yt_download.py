#!/usr/bin/env python3
import yt_dlp
import sys
import os
import time

def download_youtube(url):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, '..', '..', 'cache')
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    video_id = None
    final_path = None
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(output_dir, 'yt_%(id)s.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'max_filesize': 50 * 1024 * 1024,
        'quiet': True,
        'no_warnings': True,
        'keepvideo': False,  # Hapus webm setelah convert
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info dulu untuk dapat ID
            info = ydl.extract_info(url, download=False)
            if info is None:
                print("ERROR: Could not extract video info", file=sys.stderr)
                sys.exit(1)
            
            video_id = info.get('id', 'unknown')
            expected_mp3 = os.path.join(output_dir, f"yt_{video_id}.mp3")
            
            # Download (include convert)
            ydl.download([url])
            
            # TUNGGU file mp3 muncul (FFmpeg butuh waktu)
            max_wait = 30  # 30 detik max
            waited = 0
            while waited < max_wait:
                if os.path.exists(expected_mp3):
                    print(expected_mp3)
                    return
                
                # Cek file lain yang mungkin
                for ext in ['mp3', 'm4a', 'webm', 'mkv']:
                    test_path = os.path.join(output_dir, f"yt_{video_id}.{ext}")
                    if os.path.exists(test_path):
                        print(test_path)
                        return
                
                time.sleep(0.5)
                waited += 0.5
            
            # Timeout, cek apa yang ada
            files = os.listdir(output_dir)
            yt_files = [f for f in files if f.startswith(f'yt_{video_id}')]
            
            if yt_files:
                # Ambil yang ada
                found = os.path.join(output_dir, yt_files[0])
                print(found)
                return
            
            print(f"ERROR: Timeout waiting for file. Dir: {files}", file=sys.stderr)
            sys.exit(1)
                
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("ERROR: URL required", file=sys.stderr)
        sys.exit(1)
    
    url = sys.argv[1]
    download_youtube(url)
