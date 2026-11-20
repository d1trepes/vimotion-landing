#!/usr/bin/env python3
"""Сборка для скорости (21.11): все стили главной в один файл styles/site.css, все скрипты в scripts/site.js.
Исходники по блокам остаются как были (styles/blocks/NN-*.css, scripts/*.js) — правим их, потом запускаем:

    python3 tools/build.py

Порядок файлов берётся из блока <!-- build:css --> ... <!-- /build:css --> и <!-- build:js --> в site/index.src.html,
результат пишется в site/index.html (там вместо 20 стилей и 23 скриптов по одному файлу с новой версией ?v=).
"""
import re, os, hashlib, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site')
src = open(os.path.join(ROOT, 'index.src.html'), encoding='utf-8').read()

def strip_css(t):
    t = re.sub(r'/\*.*?\*/', '', t, flags=re.S)
    t = re.sub(r'\n\s*\n+', '\n', t)
    return t.strip() + '\n'

def css_bundle(block):
    out = []
    for href in re.findall(r'href="([^"?]+)', block):
        path = os.path.join(ROOT, href)
        t = open(path, encoding='utf-8').read()
        d = os.path.dirname(href)  # styles или styles/blocks
        # url(...) в файле считаются от его папки, в бандле — от styles/
        def fix(m):
            u = m.group(2)
            if re.match(r'(data:|https?:|#|%23)', u): return m.group(0)
            full = os.path.normpath(os.path.join(d, u.split('?')[0]))
            rel = os.path.relpath(full, 'styles').replace(os.sep, '/')
            q = '?' + u.split('?', 1)[1] if '?' in u else ''
            return 'url(' + m.group(1) + rel + q + m.group(1) + ')'
        t = re.sub(r'url\(([\'"]?)([^)\'"]+)\1\)', fix, t)
        out.append('/* ' + href + ' */\n' + strip_css(t))
    return ''.join(out)

def js_bundle(block):
    out = []
    for s in re.findall(r'src="([^"?]+)', block):
        t = open(os.path.join(ROOT, s), encoding='utf-8').read()
        # каждый файл отдельно: ошибка в одном не останавливает остальные
        out.append('/* ' + s + ' */\ntry{\n' + t + '\n}catch(e){window.console&&console.error("' + s + '",e)}\n')
    return ''.join(out)

m_css = re.search(r'<!-- build:css -->(.*?)<!-- /build:css -->', src, re.S)
m_js = re.search(r'<!-- build:js -->(.*?)<!-- /build:js -->', src, re.S)
css = css_bundle(m_css.group(1)); js = js_bundle(m_js.group(1))
open(os.path.join(ROOT, 'styles/site.css'), 'w', encoding='utf-8').write(css)
open(os.path.join(ROOT, 'scripts/site.js'), 'w', encoding='utf-8').write(js)
hv = hashlib.md5((css + js).encode()).hexdigest()[:8]
html = src.replace(m_css.group(0), '<link rel="stylesheet" href="styles/site.css?v=' + hv + '">')
html = html.replace(m_js.group(0), '<script src="scripts/site.js?v=' + hv + '" defer></script>')
html = html.replace('<!doctype html>\n', '<!doctype html>\n<!-- Собрано tools/build.py из index.src.html. Правки вносить в index.src.html и запускать сборку -->\n', 1)
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html)
print('site.css %d KB, site.js %d KB, v=%s' % (len(css) // 1024, len(js) // 1024, hv))
