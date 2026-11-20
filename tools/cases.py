#!/usr/bin/env python3
"""Генератор страниц кейсов (21.11).

    python3 tools/cases.py

site/cases.html            — «Пьедестал ViMotion»: ряд лиц и все кейсы карточками
site/case-<slug>.html      — отдельная страница на каждого ученика

Тексты кейсов из content/prototype.html (страница cases), сомнение и сумма из блока 14 (content/copy.md).
Шапка, подвал и финальный блок (блок 19) берутся из site/index.src.html, поэтому правка там подхватывается здесь.
"""
import os, re
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site')
V = '20261120m'
N = '&nbsp;'
UP = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12.5l9-9M5.5 3.5h7v7"/></svg>'
RT = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8h11M9 3.5 13.5 8 9 12.5"/></svg>'
LT = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 8h-11M7 3.5 2.5 8 7 12.5"/></svg>'

C = [
 dict(slug='alena', name='Алёна', doubt='«Мне не хватает времени»', res=(f'$3{N}000', 'в месяц'), img='stories/alena',
  h='Алёна. Первый заказ нашёлся у бывшего работодателя', nums=[(f'$3{N}000', 'в месяц'), ('70-120', 'обложек в месяц на пике')],
  p=['Пришла на 7-м месяце беременности, уже с маленьким ребёнком. Вместо своего канала предложила работодателю делать обложки. Потом добавились сценарии и монтаж, клиент стал рекомендовать её коллегам',
     'Когда заказов стало слишком много, наняла дизайнеров. Сейчас большую часть работы делает её команда'],
  q='Всегда, когда начинаю что-то новое, всем рассказываю. Так появляются возможности',
  ev=[('cases/proof-alena.webp', 346, 608, 'Сообщение Алёны в чате учеников: заработала на свою первую машину')]),
 dict(slug='ivan', name='Иван', doubt='«Не знаю, где искать клиентов»', res=(f'$2{N}000', 'в месяц'), img='stories/ivan',
  h='Иван. Свои каналы не пошли, работа на других пошла', nums=[(f'$2{N}000', 'в месяц'), ('~30', 'роликов в месяц')],
  p=['Ушёл с работы и уехал в Таиланд на все сбережения. Пробовал разные ниши, но подушка заканчивалась: либо деньги, либо домой',
     'Нашёл себя в монтаже. Первые клиенты пришли по рекомендации, дальше реклама, мотопрокат и полный продакшн игрового канала. Обучение окупил и остался в Таиланде'],
  q='Я шёл с мыслью найти то, что подойдёт именно мне',
  ev=[('cases/proof-ivan.webp', 351, 612, 'Поступления Ивану от клиентов')]),
 dict(slug='veronika', name='Вероника', doubt='«Не знаю, как совместить с работой»', res=(f'$4{N}000+', ''), img='stories/veronika',
  h='Вероника. С мебельного производства в продюсеры', nums=[(f'$4{N}000+', 'на контенте'), ('2', 'YouTube-проекта')],
  p=['По 10 часов на производстве, семью почти не видела, к заработку онлайн относилась со скепсисом',
     'Выложила сторис с консультациями по YouTube, первых клиентов привели знакомые. Потом взяла два проекта на продюсирование и ушла с завода. Теперь есть время на ребёнка'],
  q='Иногда сама не верю, как сильно можно изменить жизнь за пару месяцев', ev=[]),
 dict(slug='gaiduk', name='Иван Гайдук', doubt='«Не могу быть на двух съёмках сразу»', res=(f'$10{N}000+', 'за полгода'), img='stories/gaiduk',
  h='Иван Гайдук. На две съёмки сразу не успеть', nums=[(f'$10{N}000+', 'за первые полгода'), (f'до{N}9', 'каналов параллельно')],
  p=['Был оператором в Минске: снимал для других и зависел от того, где находится. Первому клиенту написал как монтажёр, договорились на три месяца',
     'Потом вошёл в команду продюсеров и вёл до девяти каналов. Сейчас сооснователь агентства вместе с Валентином'],
  q='Нельзя сравнивать себя с чужим тысячным днём. Только со вчерашним собой', ev=[]),
 dict(slug='nariman', name='Нариман', doubt='«Ниша слишком странная»', res=(f'$5{N}000', 'в месяц'), img='stories/nariman',
  h='Нариман. Деньги нашлись там, куда никто не смотрел', nums=[(f'$5{N}000', 'в месяц'), ('$15 → $75', 'себестоимость и цена ролика')],
  p=['Выбрал нишу, которую все обходят: ИИ-мультфильмы и колыбельные для детей. Запустил рекламу на свою услугу и работает в паре с дизайнером'],
  q='Даже в странных нишах есть деньги',
  ev=[('cases/proof-nariman.webp', 347, 610, 'Продажи Наримана за два месяца')]),
 dict(slug='nastya', name='Настя', doubt='«Вдруг не разберусь»', res=('$500', 'ещё на обучении'), img='stories/nastya',
  h='Настя. Первые заказы ещё во время обучения', nums=[('$500', 'на обучении'), ('0', 'опыта на старте')],
  p=['Работала баристой: ни монтажа, ни клиентов, ни понимания, как всё устроено. Одной из первых начала применять советы на практике',
     'Запустила рекламу своих услуг, и заявок стало так много, что рекламу пришлось выключить'],
  q=None, ev=[('cases/nastya-grad.webp', 627, 354, 'Настя с сертификатом выпускника ViMotion')]),
 dict(slug='artem', name='Артём', doubt=None, res=('24', 'YouTube-канала'), img='cases/artem',
  h='Артём. Применил навык по-своему', nums=[('24', 'YouTube-канала'), ('1/3', 'на монетизации')],
  p=['Работал в найме в Челябинске и мечтал о работе онлайн. После обучения написал свой софт, который собирает видео в несколько кликов, и запустил сеть каналов без лица. Сейчас сам ведёт учеников ViMotion'],
  q=None, ev=[]),
 dict(slug='angelina-ostap', name='Ангелина и Остап', doubt=None, res=(f'~$2{N}000', 'на двоих'), img=('cases/angelina', 'cases/ostap'),
  h='Ангелина и Остап. 10 дней с нуля', nums=[(f'~$2{N}000', 'на двоих'), ('~50', 'сообщений бизнесам каждый')],
  p=['Ноль опыта, ноль связей, ноль кейсов. Первые дни монтировали до ночи, потом писали бизнесам и получали отказы. Первые €50 заработали на трёх рилс',
     'Всё изменилось, когда перестали продавать один монтаж и начали предлагать контент целиком с оплатой вперёд'],
  q=None, ev=[]),
]

src = open(os.path.join(ROOT, 'index.src.html'), encoding='utf-8').read()
hdr = src[src.index('<header class="hdr">'):src.index('</header>') + 9]
hdr = hdr.replace('href="./"', 'href="index.html"').replace('href="#', 'href="index.html#')
hdr = hdr.replace('<a href="cases.html">Кейсы</a>', '<a href="cases.html" class="is-cur" aria-current="page">Кейсы</a>')
ftr = src[src.index('<!-- Подвал -->'):src.index('</footer>') + 9].replace('href="./"', 'href="index.html"')
fin = src[src.index('<!-- Блок 19. Финал -->'):]
fin = fin[:fin.index('</section>') + 10]


def first(c):
    return c['img'][0] if isinstance(c['img'], tuple) else c['img']


def srcset(base, sizes):
    return (f'src="img/{base}-600.webp?v={V}" srcset="img/{base}-400.webp?v={V} 400w, img/{base}-600.webp?v={V} 600w, img/{base}-900.webp?v={V} 900w" '
            f'sizes="{sizes}"')


def photo(c, sizes, lazy=True, alt=True):
    ld = ' loading="lazy"' if lazy else ' fetchpriority="high"'
    if isinstance(c['img'], tuple):
        return ''.join(f'<span class="ph-k"><img {srcset(b, sizes)} width="900" height="1200" alt="{a if alt else ""}"{ld} decoding="async"></span>'
                       for b, a in zip(c['img'], ['Ангелина', 'Остап']))
    return f'<span class="ph-k"><img {srcset(c["img"], sizes)} width="900" height="1200" alt="{c["name"] if alt else ""}"{ld} decoding="async"></span>'


def head(title, desc, extra_css=''):
    return f'''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="format-detection" content="telephone=no,email=no,address=no">
<script>(function(){{var r=document.documentElement;function s(){{r.style.setProperty('--vhl',innerHeight+'px')}}s();addEventListener('resize',s);
if(!matchMedia('(prefers-reduced-motion: reduce)').matches)r.classList.add('anim')}})();</script>
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#EFE6DE">
<link rel="icon" href="data:,">
<link rel="preload" href="fonts/fira-xc-900.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/inter-cyrillic-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="styles/fonts.css?v={V}">
<link rel="stylesheet" href="styles/tokens.css?v={V}">
<link rel="stylesheet" href="styles/blocks/00-header.css?v={V}">
<link rel="stylesheet" href="styles/blocks/19-final.css?v={V}">
<link rel="stylesheet" href="styles/blocks/20-footer.css?v={V}">
<link rel="stylesheet" href="styles/pages/cases.css?v={V}">
<script src="scripts/menu.js?v={V}" defer></script>
<script src="scripts/nowidow.js?v={V}" defer></script>
<script src="scripts/cases.js?v={V}" defer></script>
<script src="scripts/final.js?v={V}" defer></script>
</head>
'''


TAIL = '''
<script>/* Только для демо на GitHub Pages: кнопки ведут на анкету из этой же папки (quiz/). На боевом сайте не срабатывает */
(function(){if(!/\\.github\\.io$/.test(location.hostname))return;
var q=location.search;[].forEach.call(document.querySelectorAll('a[href^="https://vi-motion.pro/quiz/"]'),function(a){a.href='quiz/'+q})})();</script>
</body>
</html>
'''


def faces(cur=None):
    out = ['<ul class="cs-faces">']
    for i, c in enumerate(C):
        on = ' class="is-cur" aria-current="page"' if cur == c['slug'] else ''
        out.append(f'  <li style="--i:{i}"><a href="case-{c["slug"]}.html"{on}><img src="img/{first(c)}-400.webp?v={V}" srcset="img/{first(c)}-400.webp?v={V} 400w, img/{first(c)}-600.webp?v={V} 600w" sizes="(max-width:720px) 150px, 300px" width="600" height="800" alt=""{' fetchpriority="high"' if i < 4 else ''} decoding="async"><span>{c["name"]}</span></a></li>')
    out.append('</ul>')
    return '\n'.join(out)


def doubt(c, cls='cx-doubt'):
    return f'<p class="{cls}"><span class="st-line">{c["doubt"]}</span></p>' if c['doubt'] else ''


# ---------- хаб ----------
cards = []
for i, c in enumerate(C):
    lab = f'<span class="cc-l">{c["res"][1]}</span>' if c['res'][1] else ''
    cards.append(f'''  <li class="cc" style="--i:{i}"><a class="cc-a" href="case-{c['slug']}.html">
    <span class="cc-ph{' cc-ph2' if isinstance(c['img'], tuple) else ''}">{photo(c, '(max-width:720px) 40vw, 260px', alt=False)}</span>
    <span class="cc-tx">
      <span class="cc-nm">{c['name']}</span>
      {('<span class="cc-dq"><span class="st-line">' + c['doubt'] + '</span></span>') if c['doubt'] else ''}
      <span class="cc-res"><b>{c['res'][0]}</b>{lab}</span>
      <span class="cc-go">Читать кейс{UP}</span>
    </span>
  </a></li>''')

hub = head('Пьедестал ViMotion: кейсы учеников', 'Мама в декрете, инженер с завода, бариста и парень, который уехал в Таиланд на последние деньги. Истории учеников ViMotion') + f'''<body class="pg-cases pg-hub">

{hdr}

<main>

<!-- Кейсы. Пьедестал -->
<section class="cs-top" aria-labelledby="cs-h">
  <h1 class="cs-h" id="cs-h">Пьедестал <span class="hl">ViMotion</span></h1>
  <p class="cs-sub">Мама в декрете, инженер с завода, бариста и парень, который уехал в Таиланд на последние деньги. Все начинали с нуля, и все уже на финише с первыми деньгами</p>
{faces()}
</section>

<!-- Кейсы. Все истории карточками -->
<section class="cs-all" aria-label="Все кейсы">
<ul class="cc-grid">
{chr(10).join(cards)}
</ul>
</section>

{fin}

</main>

{ftr}
''' + TAIL
open(os.path.join(ROOT, 'cases.html'), 'w', encoding='utf-8').write(hub)

# ---------- страницы кейсов ----------
for i, c in enumerate(C):
    nxt = C[(i + 1) % len(C)]
    bar = ''.join(f'<a href="case-{x["slug"]}.html"' + (' class="is-cur" aria-current="page"' if x is c else '') + f'>{x["name"]}</a>' for x in C)
    nums = ''.join(f'<li><b>{a}</b><span>{b}</span></li>' for a, b in c['nums'])
    paras = ''.join(f'<p>{p}</p>' for p in c['p'])
    q = f'<blockquote class="cx-q"><p>{c["q"]}</p><cite>{c["name"]}</cite></blockquote>' if c['q'] else ''
    ev = ''
    if c['ev']:
        ev = '<ul class="cx-ev">' + ''.join(
            f'<li><button class="cx-z" type="button" aria-label="Увеличить: {alt}"><img src="img/{f}?v={V}" width="{w}" height="{h}" alt="{alt}" loading="lazy" decoding="async"></button></li>'
            for f, w, h, alt in c['ev']) + '</ul>'
    lab = f'<span>{c["res"][1]}</span>' if c['res'][1] else ''
    # цитата и скрин рядом: скрин карточкой справа, чуть наклонён и заходит на плашку; без цитаты скрин на всю колонку
    qe = (f'<div class="cx-qe{" has-q" if q else ""}{" has-ev" if ev else ""}">{q}{ev}</div>') if (q or ev) else ''
    page = head(f'{c["name"]}: кейс ученика ViMotion', c['h']) + f'''<body class="pg-cases pg-case">

{hdr}

<!-- Переключатель кейсов: закреплён под шапкой с самого начала, переход сразу на страницу человека -->
<nav class="cx-bar" aria-label="Кейсы учеников"><div class="cx-bar-in"><a class="cx-all" href="cases.html">Все кейсы</a>{bar}</div></nav>

<main>

<!-- Кейс. Первый экран: сомнение зачёркивается, загорается результат -->
<section class="cx-hero" data-hdr="dark" aria-labelledby="cx-name">
  <div class="cx-hero-in">
    <div class="cx-hero-tx">
      <h1 class="cx-name" id="cx-name">{c['name']}</h1>
      {doubt(c)}
      <p class="cx-res"><b data-count>{c['res'][0]}</b>{lab}</p>
    </div>
    <div class="cx-hero-ph{' cx-ph2' if isinstance(c['img'], tuple) else ''}">{photo(c, '(max-width:720px) 80vw, 460px', lazy=False)}</div>
  </div>
</section>

<!-- Кейс. История -->
<article class="cx-story" aria-labelledby="cx-h">
  <div class="cx-in">
    <h2 class="cx-h" id="cx-h">{c['h']}</h2>
    <ul class="cx-nums">{nums}</ul>
    <div class="cx-body">{paras}</div>
    {qe}
  </div>
</article>

<!-- Кейс. Следующий: карточка целиком ведёт на следующего, рядом «Все кейсы» (второстепенная слева, основная справа) -->
<section class="cx-next" aria-label="Следующий кейс">
  <div class="cx-next-card">
    <span class="cx-next-ph{' cx-ph2' if isinstance(nxt['img'], tuple) else ''}">{photo(nxt, '(max-width:720px) 40vw, 280px', alt=False)}</span>
    <span class="cx-next-tx">
      <span class="cx-next-nm">{nxt['name']}</span>
      {('<span class="cx-next-dq">' + nxt['doubt'] + '</span>') if nxt['doubt'] else ''}
      <span class="cx-next-acts"><a class="btn btn-o" href="cases.html"><span class="bt">Все кейсы</span>{UP}</a><a class="btn btn-k cx-next-go" href="case-{nxt['slug']}.html"><span class="bt">Следующий кейс</span>{UP}</a></span>
    </span>
  </div>
</section>

{fin}

</main>

{ftr}

<div class="cs-lb" id="cs-lb" hidden><button class="cs-lb-x" type="button" aria-label="Закрыть"><i></i></button><img alt=""></div>
''' + TAIL
    open(os.path.join(ROOT, f'case-{c["slug"]}.html'), 'w', encoding='utf-8').write(page)
print('ok:', 1 + len(C), 'pages')
