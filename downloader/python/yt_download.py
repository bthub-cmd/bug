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
    
    # Format untuk kualitas TERTINGGI - download best video + best audio
    # Kemudian merge tanpa re-encode (copy codec)
    ydl_opts = {
        # Download best video AND best audio separately, then merge
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best',
        
        # IMPORTANT: Output ke cache directory
        'outtmpl': os.path.join(output_dir, 'ytvid_%(id)s.%(ext)s'),
        'paths': {
            'home': output_dir,
            'temp': output_dir,
        },
        
        # IMPORTANT: Merge without re-encoding to preserve quality
        'merge_output_format': 'mp4',
        'postprocessors': [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4',
        }],
        
        # Prefer formats with video codec already in h264 and audio in aac (no conversion needed)
        'format_sort': [
            'res:2160',      # Prefer 4K
            'res:1440',      # Then 1440p
            'res:1080',      # Then 1080p
            'fps',           # Higher FPS
            'vcodec:h264',   # Prefer h264 codec (widely supported)
            'acodec:aac',    # Prefer AAC audio
        ],
        
        # Don't re-encode if possible (preserve quality)
        'postprocessor_args': [
            '-c:v', 'copy',  # Copy video codec (no re-encode)
            '-c:a', 'copy',  # Copy audio codec (no re-encode)
        ],
        
        # INCREASED LIMIT: 2GB (was 200MB)
        'max_filesize': 2 * 1024 * 1024 * 1024,  # 2GB limit
        'quiet': False,
        'no_warnings': False,
        
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        'retries': 5,
        
        # Better quality options
        'prefer_free_formats': False,  # Don't prefer free formats if paid ones are better
        'no_check_certificate': False,
        
        # Force output to cache directory
        'keepvideo': False,  # Don't keep original after merge
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info first
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
                best_format = formats[-1]  # Usually the best one
                print(f"Selected format: {best_format.get('format_note', 'N/A')} - {best_format.get('ext', 'N/A')}", file=sys.stderr)
                print(f"Resolution: {best_format.get('resolution', 'N/A')}", file=sys.stderr)
                print(f"Video codec: {best_format.get('vcodec', 'N/A')}", file=sys.stderr)
                print(f"Audio codec: {best_format.get('acodec', 'N/A')}", file=sys.stderr)
            
            print("Downloading...", file=sys.stderr)
            # Download
            ydl.download([url])
            
            # Find downloaded file IN CACHE DIRECTORY
            possible_files = [
                os.path.join(output_dir, f"ytvid_{video_id}.mp4"),
                os.path.join(output_dir, f"ytvid_{video_id}.mkv"),
                os.path.join(output_dir, f"ytvid_{video_id}.webm"),
            ]
            
            downloaded_file = None
            for f in possible_files:
                if os.path.exists(f):
                    downloaded_file = f
                    break
            
            # Fallback: search for any ytvid_ file with video_id IN CACHE
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
            
            # Verify file is in cache directory
            if not downloaded_file.startswith(output_dir):
                print(f"WARNING: File not in cache directory, moving...", file=sys.stderr)
                import shutil
                new_path = os.path.join(output_dir, os.path.basename(downloaded_file))
                shutil.move(downloaded_file, new_path)
                downloaded_file = new_path
            
            # Get file size
            file_size = os.path.getsize(downloaded_file)
            size_mb = file_size / 1024 / 1024
            print(f"Download complete! Size: {size_mb:.2f} MB", file=sys.stderr)
            print(f"File saved to: {downloaded_file}", file=sys.stderr)
            
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
