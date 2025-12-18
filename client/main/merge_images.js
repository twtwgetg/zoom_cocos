const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// 定义输入目录和输出文件
const inputDir = path.join(__dirname, 'assets/res/explor/green/exp');
const tempDir = path.join(__dirname, 'temp_images');
const outputFile = path.join(__dirname, 'assets/res/explor/green/exp_atlas.png');
const plistFile = path.join(__dirname, 'assets/res/explor/green/exp_atlas.plist');

// 创建4x4的画布，每张图片是128x128像素
const cellWidth = 128;
const cellHeight = 128;
const cols = 4;
const rows = 4;
const canvasWidth = cols * cellWidth;
const canvasHeight = rows * cellHeight;

// 创建画布
const canvas = createCanvas(canvasWidth, canvasHeight);
const ctx = canvas.getContext('2d');

// 设置透明背景
ctx.clearRect(0, 0, canvasWidth, canvasHeight);

// 确保临时目录存在
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// 读取目录中的所有PNG文件
fs.readdir(inputDir, async (err, files) => {
  if (err) {
    console.error('读取目录失败:', err);
    return;
  }

  // 过滤出PNG文件并按名称排序
  const pngFiles = files
    .filter(file => path.extname(file) === '.png' && !file.endsWith('.meta'))
    .sort((a, b) => {
      // 提取文件名中的数字进行排序
      const numA = parseInt(a.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.match(/\d+/)?.[0] || 0);
      return numA - numB;
    });

  console.log('找到以下PNG文件:');
  pngFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });

  // 检查文件数量
  if (pngFiles.length !== 16) {
    console.warn(`警告: 找到了${pngFiles.length}个PNG文件，期望是16个`);
  }

  // 复制文件到临时目录并重命名
  const tempFiles = [];
  for (let i = 0; i < Math.min(pngFiles.length, 16); i++) {
    const originalFilePath = path.join(inputDir, pngFiles[i]);
    const tempFileName = `image_${String(i + 1).padStart(2, '0')}.png`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    // 复制文件
    fs.copyFileSync(originalFilePath, tempFilePath);
    tempFiles.push(tempFileName);
    
    console.log(`已复制: ${pngFiles[i]} -> ${tempFileName}`);
  }

  // 加载并绘制每张图片
  try {
    for (let i = 0; i < tempFiles.length; i++) {
      const filePath = path.join(tempDir, tempFiles[i]);
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        console.error(`文件不存在: ${filePath}`);
        continue;
      }
      
      const img = await loadImage(filePath);
      
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const x = col * cellWidth;
      const y = row * cellHeight;
      
      ctx.drawImage(img, x, y, cellWidth, cellHeight);
      console.log(`已绘制: ${tempFiles[i]} 到位置 (${col}, ${row})`);
    }

    // 保存合成的图片
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputFile, buffer);
    console.log(`成功创建合成图片: ${outputFile}`);
    console.log(`图片尺寸: ${canvasWidth}x${canvasHeight}`);
    
    // 生成plist文件
    generatePlistFile(plistFile, tempFiles, canvasWidth, canvasHeight);
    console.log(`成功创建plist文件: ${plistFile}`);
    
    // 清理临时文件
    tempFiles.forEach(file => {
      const tempFilePath = path.join(tempDir, file);
      fs.unlinkSync(tempFilePath);
    });
    fs.rmdirSync(tempDir);
    console.log('已清理临时文件');
  } catch (error) {
    console.error('处理图片时出错:', error);
    
    // 打印更多错误信息
    console.error('错误详情:', {
      code: error.code,
      path: error.path,
      syscall: error.syscall
    });
  }
});

// 生成plist文件的函数
function generatePlistFile(plistPath, fileNames, width, height) {
  let plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>frames</key>
    <dict>
`;

  // 为每个文件生成frame信息
  for (let i = 0; i < fileNames.length; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = col * 128;
    const y = row * 128;
    
    // 将image_01.png转换为exp_01.png格式
    const fileName = fileNames[i].replace('image_', 'exp_').replace('.png', '.png');
    
    plistContent += `        <key>${fileName}</key>
        <dict>
            <key>frame</key>
            <string>{{${x},${y}},{128,128}}</string>
            <key>offset</key>
            <string>{0,0}</string>
            <key>rotated</key>
            <false/>
            <key>sourceColorRect</key>
            <string>{{0,0},{128,128}}</string>
            <key>sourceSize</key>
            <string>{128,128}</string>
        </dict>
`;
  }

  plistContent += `    </dict>
    <key>metadata</key>
    <dict>
        <key>format</key>
        <integer>2</integer>
        <key>realTextureFileName</key>
        <string>exp_atlas.png</string>
        <key>size</key>
        <string>{${width},${height}}</string>
        <key>smartupdate</key>
        <string>$TexturePacker:SmartUpdate:xxx$</string>
        <key>textureFileName</key>
        <string>exp_atlas.png</string>
    </dict>
</dict>
</plist>`;

  fs.writeFileSync(plistPath, plistContent);
}