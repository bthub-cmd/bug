#!/usr/bin/env python3
import yt_dlp
import sys
import os
import re

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
    
    # Block stories and highlights
    if '/stories/' in url or '/highlights/' in url:
        print("ERROR: story", file=sys.stderr)
        sys.exit(1)
    
    ydl_opts = {
        'format': 'best',
        'outtmpl': os.path.join(output_dir, 'ig_%(id)s.%(ext)s'),
        'max_filesize': 100 * 1024 * 1024,
        'quiet': False,
        'no_warnings': False,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        },
        'retries': 5,
        'fragment_retries': 5,
        'extractor_args': {
            'instagram': {
                'include_story_following': False,
            }
        }
    }
    
    # Check for cookies file
    cookies_file = os.path.join(script_dir, 'instagram_cookies.txt')
    if os.path.exists(cookies_file):
        ydl_opts['cookiefile'] = cookies_file
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info first
            info = ydl.extract_info(url, download=False)
            if info is None:
                raise Exception("Could not extract info")
            
            # Handle multiple entries (carousel)
            entries = info.get('entries', [info])
            target = entries[0] if entries else info
            video_id = target.get('id', 'unknown')
            
            # Download
            ydl.download([url])
            
            # Find downloaded file
            possible_extensions = ['.mp4', '.jpg', '.png', '.webp', '.mkv', '.webm']
            downloaded_file = None
            
            for ext in possible_extensions:
                f = os.path.join(output_dir, f"ig_{video_id}{ext}")
                if os.path.exists(f):
                    downloaded_file = f
                    break
            
            # Fallback: search for any ig_ file with video_id
            if not downloaded_file:
                files = os.listdir(output_dir)
                for f in files:
                    if f.startswith('ig_') and video_id in f:
                        downloaded_file = os.path.join(output_dir, f)
                        break
            
            if not downloaded_file:
                raise Exception("Downloaded file not found")
            
            # Check file size
            file_size = os.path.getsize(downloaded_file)
            
            if file_size > 50 * 1024 * 1024:
                print(f"TOOBIG:{downloaded_file}")
            else:
                print(downloaded_file)
                
    except Exception as e:
        error_str = str(e).lower()
        
        # Detect specific errors
        if any(keyword in error_str for keyword in ['private', 'login', '403', 'unauthorized', 'forbidden']):
            print("ERROR: private", file=sys.stderr)
        elif '404' in error_str or 'not found' in error_str:
            print("ERROR: not found", file=sys.stderr)
        elif 'story' in error_str or 'highlight' in error_str:
            print("ERROR: story", file=sys.stderr)
        elif 'unavailable' in error_str:
            print("ERROR: Video unavailable or removed", file=sys.stderr)
        else:
            print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("ERROR: URL required", file=sys.stderr)
        sys.exit(1)
    
    url = sys.argv[1]
    download_instagram(url)
