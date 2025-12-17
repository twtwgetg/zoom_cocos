# 黑白格子Shader使用说明

## 🎯 功能说明
本Shader可以在Sprite上显示自定义颜色的格子效果，通过调节columns和rows参数可以控制格子的列数和行数，并支持根据屏幕尺寸自动调整。

## 📁 文件列表
- `checkerboard.effect` - 黑白格子着色器代码
- `checkerboard.mtl` - 对应的材质文件
- `CheckerboardSprite.ts` - 便捷使用的组件脚本

## 🔧 使用方法

### 方法一：直接使用材质

#### 1. 创建材质
1. 在Cocos Creator资源管理器中找到`checkerboard.mtl`文件
2. 右键点击该文件 → 实例化材料
3. 将新创建的材质保存到合适的位置

#### 2. 应用到Sprite
1. 选中要应用效果的节点（需要有Sprite组件）
2. 在Inspector面板中找到Sprite组件
3. 将创建好的材质拖拽到CustomMaterial属性上

#### 3. 调整参数
在材质的Inspector面板中可以调整以下参数：
- **color1**: 第一种颜色，默认为黑色
- **color2**: 第二种颜色，默认为白色
- **columns**: 列数，控制水平方向的格子数量，默认值为10
- **rows**: 行数，控制垂直方向的格子数量，默认值为10
- **patternStrength**: 图案强度，控制格子图案的明显程度，默认值为1
- **tintColor**: 色调颜色，可以整体调整格子的颜色

### 方法二：使用CheckerboardSprite组件（推荐）

#### 1. 创建材质
同方法一的步骤

#### 2. 添加组件
1. 选中要应用效果的节点
2. 在Inspector面板中点击【添加组件】按钮
3. 选择【自定义脚本】→【CheckerboardSprite】

#### 3. 配置组件
1. 将创建好的材质拖拽到组件的Checkerboard Material属性上
2. （可选）调整Color 1和Color 2参数来改变格子颜色
3. （可选）调整Columns和Rows参数来控制格子行列数
4. （可选）启用Auto Fit To Screen来根据屏幕尺寸自动调整行列数
5. （可选）指定Target Sprite，如果不指定则默认使用当前节点的Sprite组件

#### 4. 动态调整
在代码中可以通过以下方式动态调整：

```typescript
// 获取组件实例
const checkerboardSprite = this.node.getComponent(CheckerboardSprite);

// 更新颜色
checkerboardSprite.updateColor1(Color.RED);
checkerboardSprite.updateColor2(Color.BLUE);

// 更新行列数
checkerboardSprite.updateGridSize(20, 15);

// 更新图案强度
checkerboardSprite.updatePatternStrength(0.8);

// 根据屏幕尺寸重新调整（仅在启用Auto Fit To Screen时有效）
checkerboardSprite.resizeToFitScreen();
```

## 🎮 效果展示
- 格子颜色可以通过color1和color2参数自定义
- 格子行列数可以通过columns和rows参数调节
- 支持根据屏幕尺寸自动调整格子密度
- 支持透明通道，可与其他UI元素正确混合

## ⚠️ 注意事项
1. 本Shader基于Cocos Creator 3.x版本开发
2. 如果遇到渲染问题，请检查项目使用的Cocos Creator版本是否兼容
3. columns和rows参数建议在1-100范围内调节以获得最佳效果
4. 使用CheckerboardSprite组件时，会自动创建材质实例以避免影响其他Sprite
5. 启用Auto Fit To Screen时，Base Screen Width和Base Screen Height应设置为设计分辨率