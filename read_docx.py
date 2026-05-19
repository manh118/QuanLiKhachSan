import zipfile
import xml.etree.ElementTree as ET
import sys

def read_docx(filename):
    try:
        with zipfile.ZipFile(filename) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.XML(xml_content)
            
            WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
            PARA = WORD_NAMESPACE + 'p'
            TEXT = WORD_NAMESPACE + 't'
            
            text = []
            for paragraph in tree.iter(PARA):
                texts = [node.text for node in paragraph.iter(TEXT) if node.text]
                if texts:
                    text.append(''.join(texts))
            return '\n'.join(text)
    except Exception as e:
        return str(e)

for f in sys.argv[1:]:
    print("FILE:", f)
    print(read_docx(f))
    print("="*40)
