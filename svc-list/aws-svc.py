from lxml import html, etree
import requests

page = requests.get('https://aws.amazon.com/products/')
tree = html.fromstring(page.content)

#svc = tree.xpath("//div[@class='lb-content-item']/a/span/text()")
#print("Services: ", svc)

for x in tree.xpath("//div[@class='lb-content-item']/*"):
    for y in x:
        print((x.text, y.attrib, y.text))
