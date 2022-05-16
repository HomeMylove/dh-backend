import requests
import re
import csv
from bs4 import BeautifulSoup
import json
from concurrent.futures import ThreadPoolExecutor

# 域名
main_url = 'https://www.aozora.gr.jp/'

headers = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36"
}


def get_person_kana():
    """
    获取所有作家按假名分类的列表
    :return: person_hrefs 列表
    """
    home_page_response = requests.get(url=main_url, headers=headers)
    home_page_response.encoding = 'utf-8'
    home_page = BeautifulSoup(home_page_response.text, "html.parser")

    person_table = home_page.find("table", attrs={
        "summary": "main"
    })
    person_trs = person_table.find_all("tr")
    person_as = person_trs[3].find_all("a")

    person_hrefs = []
    for a in person_as:
        person_hrefs.append(main_url + a['href'])
    return person_hrefs


def get_name_list(person_kana):
    """
    获取姓名列表 同时保存为 csv
    :param person_kana: kana 列表
    :return: name_list 所有作家的名字
    """
    name_list = []
    name_to_csv = ""
    for kana in person_kana:
        kana_response = requests.get(url=kana, headers=headers)
        kana_response.encoding = 'utf-8'
        kana_page = BeautifulSoup(kana_response.text, "html.parser")
        kana_list = kana_page.find_all("ol")

        # 每一个五十音
        for ol in kana_list:
            # 找到所有 a
            name_as = ol.find_all("a")
            for name in name_as:
                full_url = main_url + "index_pages/" + name['href']
                name_list.append(full_url)
                name_to_csv += full_url + ", "
        name_to_csv += "\n"

    # 保存为 csv
    with open("name_list.csv", 'w', encoding="utf-8") as f:
        f.write(name_to_csv)

    return name_list


def get_work_list(name_list):
    """
    获取作品列表 以及 作者简介
    保存为 about_author.json 与 work_list.json
    :param name_list: 一个 name_list
    :return: None
    """
    about_author_to_json = []
    work_list_to_json = []

    # 作家 id
    author_id = 0
    for name in name_list:
        for url in name:
            try:
                work_page_response = requests.get(url=url, headers=headers)
            except Exception as e:
                print(e)
                continue
            work_page_response.encoding = 'utf-8'
            work_page = BeautifulSoup(work_page_response.text, "html.parser")
            # 保存作家信息
            author_table = work_page.find("table", attrs={
                "summary": "作家データ"
            })
            # 找到行
            author_info_trs = author_table.find_all("tr")
            # 作家对象（字典）
            author = {}
            author['author_id'] = author_id
            author['kanji_name'] = author_info_trs[0].find_all("td")[1].text
            author['kana_name'] = author_info_trs[1].find_all("td")[1].text
            author['roman_name'] = author_info_trs[2].find_all("td")[1].text
            author['about'] = author_info_trs[len(author_info_trs) - 1].find_all("td")[1].text
            # 添加一个作家
            about_author_to_json.append(author)
            # 添加他的所有作品
            # 找到第一个 ol
            work_ol = work_page.find("ol")
            # 找到所有 li
            work_lis = work_ol.find_all("li")
            for li in work_lis:
                # 作品对象（字典）
                work = {}
                # 找到第一个 a
                a = li.find("a")
                href = a['href']
                full_url = main_url + href.replace('../', '')
                work['url'] = full_url
                work['author_id'] = author_id

                work_list_to_json.append(work)
            author_id += 1

    # 保存为 json
    with open('about_author.json', 'w', encoding='utf-8') as f:
        json.dump(about_author_to_json, f)
    with open('work_list.json', 'w', encoding='utf-8') as f:
        json.dump(work_list_to_json, f)
    print("保存成功")


def get_text(work):
    """
    保存一篇文章
    :param work: work 信息，应该包含url，author_id
    :return: article 对象（字典）
    """
    try:
        text_page_response = requests.get(url=work['url'], headers=headers)
    except Exception as e:
        print('get text Exception ', e)
        return
    # 文章对象（字典）
    article = {}
    text_page_response.encoding = 'Shift_JIS'
    text_page = BeautifulSoup(text_page_response.text, "html.parser")
    # 获取标题
    title = text_page.find("h1", attrs={
        "class": "title"
    })
    article['author_id'] = work['author_id']
    article['title'] = title.text
    # 获取正文
    main_text = text_page.find("div", attrs={
        "class": "main_text"
    })
    # re 去除注音
    reg = re.compile('（.*?）')
    text = reg.sub('', main_text.text)
    article['text'] = text
    return article


def get_article(all_articles, work_list, i):
    """
    获取一篇文章，放入all_articles
    :param all_articles: list 保存一定数量的文章对象
    :param work_list: 需要获取的文章列表
    :param i: 由多线程传入的 索引
    :return: None
    """
    print('开始工作...', i)
    work = work_list[i]
    try:
        fisrt_page_response = requests.get(work['url'])
    except Exception as e:
        print('get article exception ', e)
        return
    fisrt_page_response.encoding = 'utf-8'
    first_page = BeautifulSoup(fisrt_page_response.text, "html.parser")
    download_table = first_page.find("table", attrs={
        "summary": "ダウンロードデータ",
        "class": "download"
    })
    trs = download_table.find_all("tr")
    tds = trs[len(trs) - 1].find_all("td")
    a = tds[2].find("a")
    if not a:
        return
    # https://www.aozora.gr.jp/cards/001257/ + href
    href = a['href'].replace('./', '')
    reg = re.compile(r'https://www.aozora.gr.jp/cards/.*?/')
    result = reg.findall(work['url'])
    if len(result) == 1:
        # 连接最终的 url
        work['url'] = result[0] + href
        try:
            article = get_text(work)
            all_articles.append(article)
        except Exception as e:
            print('exception is', e)
            return
    print("完成", i)


if __name__ == '__main__':
    person_kana = get_person_kana()
    name_list = get_name_list(person_kana)
    get_work_list(name_list)  # 保存一个 work_list.json

    with open('work_list.json', 'r', encoding='utf-8') as f:
        work_list = json.load(f)
    #  每一份 200 篇文章
    n = 200
    works = [work_list[i:i + n] for i in range(0, len(work_list), n)]
    # 中断的情况下，应该把 start 改为上一次的最后一个 index
    start = 0
    for index, work in enumerate(works):
        all_articles = []
        print('任务', index)
        if index <= start:
            continue
        with ThreadPoolExecutor(100) as t:
            for i in range(len(work)):
                t.submit(get_article, all_articles, work, i)

        file_name = f'./src/work{index + 1}.json'
        with open(file_name, 'w', encoding='utf-8') as f:
            json.dump(all_articles, f)
        print(f'完成({index + 1}/{len(works)}...')

    print("全部完毕")
