# 遍历所有的图片，把尺寸挑战到256*256
import os
from PIL import Image
# 图片路径
path = r'C:/Users/Administrator/zoon/Client/Assets/Enchanted Elements/Cute_Characters/Sprites/'
pathnew = "c:/Users/Administrator/zoon/sprite/"
for file in os.listdir(path):
    if file.endswith('.png'):
        img = Image.open(path + file)
        img = img.resize((128, 128))
        img.save(pathnew + file)