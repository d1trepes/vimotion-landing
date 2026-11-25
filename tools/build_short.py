#!/usr/bin/env python3
"""Build the /short/ preview from the published full landing and its assets."""

import base64
import hashlib
from pathlib import Path
import re


SITE = Path(__file__).resolve().parents[1] / 'site'
SECTIONS = ('hero', 'lesson', 'route', 'author', 'final')
SCRIPTS = (
    'menu', 'live-photo', 'nowidow', 'perf', 'hero-fit', 'people', 'lesson',
    'route', 'author', 'final',
)
STYLES = (
    'fonts', 'tokens', 'blocks/00-header', 'blocks/01-hero', 'blocks/02-people',
    'blocks/03-lesson', 'blocks/09-route', 'blocks/15-author', 'blocks/19-final',
    'blocks/20-footer',
)
MODULE_MARKER = re.compile(r'^/\* scripts/([a-z-]+)\.js \*/$', re.M)
STYLE_MARKER = re.compile(r'^/\* styles/([\w/-]+)\.css \*/$', re.M)
URL_ATTR = re.compile(r'(?<![\w-])(href|src|data-poster|srcset|imagesrcset)="([^"]*)"')


def replace_once(source, old, new):
    if source.count(old) != 1:
        raise ValueError(f'Expected one occurrence of {old!r}')
    return source.replace(old, new, 1)


def select_sections(source):
    before, main = source.split('<main>', 1)
    main, after = main.split('</main>', 1)
    sections = {}
    for match in re.finditer(r'^(?:<!-- [^\n]+ -->\n)?<section\b(?P<tag>[^>]+)>.*?^</section>', main, re.M | re.S):
        section_id = re.search(r'\bid="([^"]+)"', match['tag'])
        if section_id:
            sections[section_id[1]] = match[0]
    return before + '<main>\n\n' + '\n\n'.join(sections[name] for name in SECTIONS) + '\n\n</main>' + after


def shared_url(url):
    if url.startswith(('img/', 'fonts/', 'styles/')) or url == 'cases.html':
        return '../' + url
    return url


def rebase_attribute(match):
    attr, value = match.groups()
    if attr in ('srcset', 'imagesrcset'):
        candidates = [candidate.strip().split(maxsplit=1) for candidate in value.split(',')]
        value = ', '.join(' '.join([shared_url(parts[0]), *parts[1:]]) for parts in candidates)
    else:
        value = shared_url(value)
    return f'{attr}="{value}"'


def short_scripts(source):
    parts = MODULE_MARKER.split(source)
    modules = dict(zip(parts[1::2], parts[2::2]))
    modules['live-photo'] = modules['live-photo'].replace("'media/", "'../media/")
    effect, _ = modules['perf'].split('/* Фоновая догрузка картинок.', 1)
    modules['perf'] = effect.rstrip() + '\n}catch(e){console.error("scripts/perf.js",e)}\n'
    cover, _ = modules['people'].split('  /* ---------- видоискатель ---------- */', 1)
    # Keep the sticky hero transition, using the lesson as the next section.
    modules['people'] = replace_once(
        cover, "getElementById('people')", "getElementById('lesson')",
    ).rstrip() + '\n})();\n}catch(e){console.error("scripts/people.js",e)}\n'
    lesson = replace_once(
        modules['lesson'], "v.preload='auto'", "v.preload='none'",
    )
    lesson = replace_once(
        lesson, "v.poster=card.getAttribute('data-poster')||'';",
        "var poster=card.getAttribute('data-poster')||'';\n"
        "    v.poster=matchMedia('(max-width:720px)').matches\n"
        "      ? poster.replace('cover-1200.webp','cover-800.webp') : poster;",
    )
    modules['lesson'] = replace_once(
        lesson, "    v.focus({preventScroll:true});",
        "    v.focus({preventScroll:true});\n"
        "    var playback;\n"
        "    if('IntersectionObserver' in window){\n"
        "      playback=new IntersectionObserver(function(entries){\n"
        "        if(!entries[0].isIntersecting&&!document.fullscreenElement&&!v.webkitDisplayingFullscreen)v.pause();\n"
        "      });\n"
        "      playback.observe(card);\n"
        "    }\n"
        "    v.addEventListener('error',function(){\n"
        "      if(playback)playback.disconnect();\n"
        "      v.remove();card.classList.remove('is-on');\n"
        "    },{once:true});",
    )
    return ''.join(f'/* scripts/{name}.js */{modules[name]}' for name in SCRIPTS)


def short_styles(source):
    parts = STYLE_MARKER.split(source)
    modules = dict(zip(parts[1::2], parts[2::2]))
    css = ''.join(f'/* styles/{name}.css */{modules[name]}' for name in STYLES)
    return css + (
        '\n#lesson{padding-top:clamp(36px,6vw,88px)}\n'
        '@media (max-width:720px){.les-card.bg{background-image:url(../img/lesson/cover-800.webp?v=20261117z3)}}\n'
    )


def digest(source):
    return hashlib.sha256(source.encode('utf-8')).hexdigest()[:8]


def integrity(source):
    checksum = hashlib.sha256(source.encode('utf-8')).digest()
    return 'sha256-' + base64.b64encode(checksum).decode('ascii')


def protect(page):
    hashes = ' '.join(f"'{integrity(js)}'" for js in re.findall(r'<script>(.*?)</script>', page, re.S))
    policy = (
        "default-src 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'; "
        "connect-src 'none'; form-action 'none'; "
        f"script-src 'self' {hashes}; "
        "style-src 'self' 'unsafe-inline'; style-src-elem 'self'; "
        "img-src 'self' data:; font-src 'self'; media-src 'self' https://vi-motion.pro"
    )
    return replace_once(
        page, '<meta charset="utf-8">',
        '<meta charset="utf-8">\n'
        f'<meta http-equiv="Content-Security-Policy" content="{policy}">\n'
        '<meta name="referrer" content="strict-origin-when-cross-origin">',
    )


def main():
    scripts = short_scripts((SITE / 'scripts/site.js').read_text(encoding='utf-8'))
    styles = short_styles((SITE / 'styles/site.css').read_text(encoding='utf-8'))
    source = (SITE / 'index.html').read_text(encoding='utf-8')
    page = select_sections(source)
    page = re.sub(
        r'(<nav\b[^>]*\bid="nav"[^>]*>).*?(</nav>)',
        r'\1<a href="#lesson">Как устроено</a><a href="#route">Программа</a><a href="#author">Об авторе</a>\2',
        page, count=1, flags=re.S,
    )
    page = replace_once(page, 'href="#how"', 'href="#route"')
    page, removed = re.subn(r'^    <div class="acts rt-acts">[^\n]*</div>\n', '', page, flags=re.M)
    if removed != 1:
        raise ValueError('Expected one route CTA')
    page = replace_once(page, 'Оставь анкету, и мы разберём', 'Напиши в Telegram, и мы разберём')
    page = replace_once(
        page,
        'href="https://vi-motion.pro/quiz/"><span class="bt">Стать следующим',
        'href="https://t.me/m/rUCmwDTQZGZi"><span class="bt">Стать следующим',
    )
    page = replace_once(page, 'href="#faq"', 'href="../#faq"')
    page = replace_once(page, "a.href='quiz/'+q", "a.href='../quiz/'+q")
    page = re.sub(r'<script>\s*/\* На телефоне, слабой сети.*?</script>\s*', '', page, count=1, flags=re.S)
    page = re.sub(r'<!-- Прелоадер: спидометр -->.*?(?=<header\b)', '', page, count=1, flags=re.S)
    page = re.sub(r'^<link rel="preload" href="fonts/inter-tight-latin-700-normal\.woff2"[^\n]*>\n', '', page, count=1, flags=re.M)
    page = re.sub(r'src="scripts/site\.js\?v=[a-f0-9]+"', f'src="site.js?v={digest(scripts)}" integrity="{integrity(scripts)}"', page, count=1)
    page = re.sub(r'href="styles/site\.css\?v=[a-f0-9]+"', f'href="site.css?v={digest(styles)}" integrity="{integrity(styles)}"', page, count=1)
    page = URL_ATTR.sub(rebase_attribute, page)
    page = re.sub(r'^<!-- Собрано [^\n]+ -->$', '<!-- Preview generated by tools/build_short.py. -->', page, count=1, flags=re.M)

    output = SITE / 'short'
    output.mkdir(exist_ok=True)
    (output / 'index.html').write_text(protect(page), encoding='utf-8', newline='\n')
    (output / 'site.css').write_text(styles, encoding='utf-8', newline='\n')
    (output / 'site.js').write_text(scripts, encoding='utf-8', newline='\n')


if __name__ == '__main__':
    main()
