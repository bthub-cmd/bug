#!/usr/bin/env python3
import yt_dlp
import sys
import os
import time

def download_youtube_video(url):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, '..', '..', 'cache')
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    video_id = None
    
    ydl_opts = {
        'format': 'best[ext=mp4]/best',
        'outtmpl': os.path.join(output_dir, 'ytvid_%(id)s.%(ext)s'),
        'max_filesize': 100 * 1024 * 1024,  # 100MB limit
        'quiet': False,
        'no_warnings': False,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        'retries': 5,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info first
            info = ydl.extract_info(url, download=False)
            if info is None:
                print("ERROR: Could not extract video info", file=sys.stderr)
                sys.exit(1)
            
            video_id = info.get('id', 'unknown')
            title = info.get('title', 'video')
            
            # Download
            ydl.download([url])
            
            # Find downloaded file
            possible_files = [
                os.path.join(output_dir, f"ytvid_{video_id}.mp4"),
                os.path.join(output_dir, f"ytvid_{video_id}.webm"),
                os.path.join(output_dir, f"ytvid_{video_id}.mkv"),
            ]
            
            downloaded_file = None
            for f in possible_files:
                if os.path.exists(f):
                    downloaded_file = f
                    break
            
            # Fallback: search for any ytvid_ file with video_id
            if not downloaded_file:
                max_wait = 30
                waited = 0
                while waited < max_wait:
                    files = os.listdir(output_dir)
                    for f in files:
                        if f.startswith(f'ytvid_{video_id}'):
                            downloaded_file = os.path.join(output_dir, f)
                            break
                    if downloaded_file:
                        break
                    time.sleep(0.5)
                    waited += 0.5
            
            if not downloaded_file:
                print(f"ERROR: Timeout waiting for file", file=sys.stderr)
                sys.exit(1)
            
            # Check file size and always send as document
            file_size = os.path.getsize(downloaded_file)
            
            # Print: DOCUMENT:filepath:title
            print(f"DOCUMENT:{downloaded_file}:{title}")
                
    except Exception as e:
        error_str = str(e).lower()
        if 'private' in error_str or 'unavailable' in error_str:
            print("ERROR: private", file=sys.stderr)
        elif 'copyright' in error_str:
            print("ERROR: copyright", file=sys.stderr)
        elif 'age' in error_str or 'restricted' in error_str:
            print("ERROR: age restricted", file=sys.stderr)
        else:
            print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("ERROR: URL required", file=sys.stderr)
        sys.exit(1)
    
    url = sys.argv[1]
    download_youtube_video(url)
