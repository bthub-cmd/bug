#!/usr/bin/env python3
import yt_dlp
import sys
import os
import re
import time

def normalize_instagram_url(url):
    """Normalize Instagram URL"""
    url = re.sub(r'\?.*$', '', url)
    url = url.replace('/reel/', '/p/')
    url = url.replace('/reels/', '/p/')
    url = url.replace('/tv/', '/p/')
    return url

def download_instagram(url):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, '..', '..', 'cache')
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    url = normalize_instagram_url(url)
    
    if '/stories/' in url or '/highlights/' in url:
        print("ERROR: story", file=sys.stderr)
        sys.exit(1)
    
    user_agents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ]
    
    # Try with cookies from browser first
    browsers = ['chrome', 'firefox', 'edge', 'brave']
    
    for browser in browsers:
        try:
            ydl_opts = {
                'format': 'best',
                'outtmpl': os.path.join(output_dir, 'ig_%(id)s.%(ext)s'),
                'max_filesize': 100 * 1024 * 1024,
                'quiet': True,
                'no_warnings': True,
                'cookiesfrombrowser': (browser,),
                'http_headers': {
                    'User-Agent': user_agents[0],
                },
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if info is None:
                    continue
                
                entries = info.get('entries', [info])
                target = entries[0] if entries else info
                video_id = target.get('id', 'unknown')
                
                ydl.download([url])
                
                possible_extensions = ['.mp4', '.jpg', '.png', '.webp', '.mkv', '.webm']
                downloaded_file = None
                
                for ext in possible_extensions:
                    f = os.path.join(output_dir, f"ig_{video_id}{ext}")
                    if os.path.exists(f):
                        downloaded_file = f
                        break
                
                if not downloaded_file:
                    files = os.listdir(output_dir)
                    for f in files:
                        if f.startswith('ig_') and video_id in f:
                            downloaded_file = os.path.join(output_dir, f)
                            break
                
                if not downloaded_file:
                    continue
                
                file_size = os.path.getsize(downloaded_file)
                
                if file_size > 50 * 1024 * 1024:
                    print(f"TOOBIG:{downloaded_file}")
                else:
                    print(downloaded_file)
                
                return
                
        except Exception as e:
            continue
    
    # Fallback: try without cookies
    for idx, ua in enumerate(user_agents):
        try:
            ydl_opts = {
                'format': 'best',
                'outtmpl': os.path.join(output_dir, 'ig_%(id)s.%(ext)s'),
                'max_filesize': 100 * 1024 * 1024,
                'quiet': True,
                'no_warnings': True,
                'http_headers': {
                    'User-Agent': ua,
                },
            }
            
            cookies_file = os.path.join(script_dir, 'instagram_cookies.txt')
            if os.path.exists(cookies_file):
                ydl_opts['cookiefile'] = cookies_file
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if info is None:
                    continue
                
                entries = info.get('entries', [info])
                target = entries[0] if entries else info
                video_id = target.get('id', 'unknown')
                
                ydl.download([url])
                
                possible_extensions = ['.mp4', '.jpg', '.png', '.webp', '.mkv', '.webm']
                downloaded_file = None
                
                for ext in possible_extensions:
                    f = os.path.join(output_dir, f"ig_{video_id}{ext}")
                    if os.path.exists(f):
                        downloaded_file = f
                        break
                
                if not downloaded_file:
                    files = os.listdir(output_dir)
                    for f in files:
                        if f.startswith('ig_') and video_id in f:
                            downloaded_file = os.path.join(output_dir, f)
                            break
                
                if not downloaded_file:
                    continue
                
                file_size = os.path.getsize(downloaded_file)
                
                if file_size > 50 * 1024 * 1024:
                    print(f"TOOBIG:{downloaded_file}")
                else:
                    print(downloaded_file)
                
                return
                
        except Exception as e:
            if idx < len(user_agents) - 1:
                time.sleep(1)
                continue
    
    print("ERROR: Download failed. Try: yt-dlp --cookies-from-browser chrome <url>", file=sys.stderr)
    sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("ERROR: URL required", file=sys.stderr)
        sys.exit(1)
    
    url = sys.argv[1]
    download_instagram(url)
