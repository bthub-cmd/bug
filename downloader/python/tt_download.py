#!/usr/bin/env python3
import yt_dlp
import sys
import os
import time

def download_tiktok(url):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, '..', '..', 'cache')
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    # Normalize URL
    url = url.strip()
    if not url.startswith('http'):
        url = 'https://' + url
    
    # Extract ID dari URL
    video_id = 'unknown'
    try:
        if '/video/' in url:
            video_id = url.split('/video/')[1].split('?')[0].split('/')[0]
        elif '/v/' in url:
            video_id = url.split('/v/')[1].split('?')[0]
    except:
        pass
    
    # TANPA impersonate - pakai headers saja
    ydl_opts = {
        'format': 'best',
        'outtmpl': os.path.join(output_dir, f'tt_{video_id}.%(ext)s'),
        'max_filesize': 2 * 1024 * 1024 * 1024,  # 2GB limit
        'quiet': False,
        'no_warnings': False,
        'cookiesfrombrowser': None,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.tiktok.com/',
            'Origin': 'https://www.tiktok.com',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        },
        'extractor_args': {
            'tiktok': {
                'api_hostname': 'api16-normal-c-useast1a.tiktokv.com',
                'app_version': '20.1.0',
                'manifest_app_version': '20.1.0',
                'player_skip': 'webpage,configs,js',
            }
        },
        'retries': 10,
        'fragment_retries': 10,
        'skip_unavailable_fragments': False,
        'extract_flat': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Get info
            info = ydl.extract_info(url, download=False)
            if info is None:
                raise Exception("Could not extract video info - video may be private or removed")
            
            # Update ID
            video_id = info.get('id', video_id)
            
            # Rebuild template dengan ID benar
            ydl_opts['outtmpl'] = os.path.join(output_dir, f'tt_{video_id}.%(ext)s')
            
            # Download
            with yt_dlp.YoutubeDL(ydl_opts) as ydl2:
                ydl2.download([url])
            
            # Cari file
            possible_files = [
                os.path.join(output_dir, f'tt_{video_id}.mp4'),
                os.path.join(output_dir, f'tt_{video_id}.webm'),
                os.path.join(output_dir, f'tt_{video_id}.mkv'),
            ]
            
            downloaded_file = None
            for f in possible_files:
                if os.path.exists(f):
                    downloaded_file = f
                    break
            
            # Fallback: cari file terbaru
            if not downloaded_file:
                files = os.listdir(output_dir)
                tt_files = [f for f in files if f.startswith('tt_') and f.endswith(('.mp4', '.webm', '.mkv'))]
                if tt_files:
                    tt_files.sort(key=lambda x: os.path.getmtime(os.path.join(output_dir, x)), reverse=True)
                    downloaded_file = os.path.join(output_dir, tt_files[0])
            
            if not downloaded_file:
                raise Exception("Downloaded file not found")
            
            # Check size
            file_size = os.path.getsize(downloaded_file)
            time.sleep(0.5)
            
            if file_size > 50 * 1024 * 1024:
                print(f"TOOBIG:{downloaded_file}")
            else:
                print(downloaded_file)
                
    except Exception as e:
        error_str = str(e).lower()
        
        if 'not available' in error_str or 'status code 0' in error_str:
            print("ERROR: Video not available - may be private, removed, or region blocked", file=sys.stderr)
        elif 'private' in error_str or 'login' in error_str:
            print("ERROR: Video is private or requires login", file=sys.stderr)
        elif 'not found' in error_str or '404' in error_str:
            print("ERROR: Video not found or removed", file=sys.stderr)
        elif 'region' in error_str or 'blocked' in error_str:
            print("ERROR: Video blocked in your region", file=sys.stderr)
        else:
            print(f"ERROR: {e}", file=sys.stderr)
        
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("ERROR: URL required", file=sys.stderr)
        sys.exit(1)
    
    url = sys.argv[1]
    download_tiktok(url)
